import { ResponseCache } from '@@cache';
import { PrismaService } from '@@db';
import { Logger } from '@nestjs/common';
import { writeFile } from 'node:fs/promises';
import { mkdir } from 'node:fs/promises';
import { dirname, resolve as pathResolve } from 'node:path';
import { Command, CommandRunner } from 'nest-commander';

import { ScraperHttpClient } from '../../scraper/common';
import { extractHeroIcons, normalizeName } from '../../scraper/namuwiki';
import { HERO_REGISTRY } from '../hero-registry';

const NAMUWIKI_BASE = 'https://namu.wiki/w/';
const PUBLIC_ICONS_REL = '../web/public/icons/heroes';

interface DownloadResult {
  codename: string;
  abilityMatched: number;
  abilitySkipped: number;
  perkMatched: number;
  perkSkipped: number;
  unmatched: string[];
}

@Command({
  name: 'hero:icons:download',
  arguments: '<codename>',
  description: '나무위키 영웅 페이지에서 능력/특전 아이콘을 다운로드해 apps/web/public/icons에 저장 + DB iconUrl 갱신.',
})
export class HeroIconsDownloadCommand extends CommandRunner {
  private readonly logger = new Logger(HeroIconsDownloadCommand.name);

  constructor(
    private readonly http: ScraperHttpClient,
    private readonly prisma: PrismaService,
    private readonly cache: ResponseCache,
  ) {
    super();
  }

  async run(inputs: string[]): Promise<void> {
    const [codename] = inputs;

    if (!codename) {
      console.error('codename 필요: pnpm hero:icons:download <codename>');
      process.exit(1);
    }

    const entry = HERO_REGISTRY[codename];

    if (!entry) {
      console.error(`'${codename}' 영웅이 hero-registry에 등록되지 않았습니다.`);
      process.exit(1);
    }

    const result = await this.downloadFor(codename, entry.pageTitle);
    console.log('완료:');
    console.table([result]);

    if (result.unmatched.length > 0) {
      console.log('\nDB에 매칭 안 된 아이콘 이름 (이름 차이일 가능성):');
      for (const name of result.unmatched) {
        console.log(`  - ${name}`);
      }
    }

    await this.cache.invalidateAll();
  }

  private async downloadFor(codename: string, pageTitle: string): Promise<DownloadResult> {
    const candidates = this.buildCandidateUrls(pageTitle);
    const html = await this.fetchPage(candidates);
    const icons = extractHeroIcons(html, pageTitle);

    const hero = await this.prisma.hero.findUnique({
      where: { codename },
      include: {
        abilities: { orderBy: [{ slot: 'asc' }, { order: 'asc' }] },
        perks: { orderBy: [{ tier: 'asc' }, { slot: 'asc' }] },
      },
    });

    if (!hero) {
      throw new Error(`Hero ${codename} not found in DB. seed first.`);
    }

    const abilityIndex = new Map(hero.abilities.map((a) => [normalizeName(a.name), a]));
    const perkIndex = new Map(hero.perks.map((p) => [normalizeName(p.name), p]));

    const result: DownloadResult = {
      codename,
      abilityMatched: 0,
      abilitySkipped: 0,
      perkMatched: 0,
      perkSkipped: 0,
      unmatched: [],
    };

    for (const icon of icons) {
      const key = normalizeName(icon.name);
      const ability = abilityIndex.get(key);
      const perk = perkIndex.get(key);

      if (ability) {
        const ext = this.extensionOf(icon.url);
        const relPath = `${codename}/abilities/${ability.slot.toLowerCase()}.${ext}`;
        await this.saveIcon(icon.url, relPath);
        await this.prisma.heroAbility.update({
          where: { id: ability.id },
          data: { iconUrl: `/icons/heroes/${relPath}` },
        });
        result.abilityMatched += 1;
        continue;
      }

      if (perk) {
        const ext = this.extensionOf(icon.url);
        const relPath = `${codename}/perks/${perk.tier.toLowerCase()}-${perk.slot}.${ext}`;
        await this.saveIcon(icon.url, relPath);
        await this.prisma.heroPerk.update({
          where: { id: perk.id },
          data: { iconUrl: `/icons/heroes/${relPath}` },
        });
        result.perkMatched += 1;
        continue;
      }

      result.unmatched.push(icon.name);
    }

    result.abilitySkipped = hero.abilities.length - result.abilityMatched;
    result.perkSkipped = hero.perks.length - result.perkMatched;

    return result;
  }

  private async fetchPage(urls: string[]): Promise<string> {
    for (const url of urls) {
      const html = await this.http.fetchHtmlOrNullOnClientError(url);

      if (html !== null) {
        return html;
      }
    }
    throw new Error('namuwiki fetch failed for all candidate URLs');
  }

  private buildCandidateUrls(pageTitle: string): string[] {
    const urls = [`${NAMUWIKI_BASE}${encodeURIComponent(pageTitle)}`];
    const stripped = pageTitle.replace(/\([^)]+\)$/, '').trim();

    if (stripped && stripped !== pageTitle) {
      urls.push(`${NAMUWIKI_BASE}${encodeURIComponent(stripped)}`);
    }

    return urls;
  }

  private async saveIcon(url: string, relPath: string): Promise<void> {
    const { bytes } = await this.http.fetchBytes(url);
    const absPath = pathResolve(process.cwd(), PUBLIC_ICONS_REL, relPath);
    await mkdir(dirname(absPath), { recursive: true });
    await writeFile(absPath, bytes);
    this.logger.log(`saved ${relPath} (${bytes.byteLength} bytes)`);
  }

  private extensionOf(url: string): string {
    const match = url.match(/\.([a-zA-Z0-9]+)(?:\?|$)/);
    return (match?.[1] ?? 'png').toLowerCase();
  }
}
