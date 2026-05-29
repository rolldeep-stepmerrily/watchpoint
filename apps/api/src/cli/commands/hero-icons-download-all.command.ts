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

interface CodenameSummary {
  codename: string;
  ok: boolean;
  abilities: number;
  perks: number;
  unmatched: number;
  error?: string;
}

@Command({
  name: 'hero:icons:download:all',
  description: 'hero-registry 전체 영웅에 대해 능력/특전 아이콘을 일괄 다운로드합니다.',
})
export class HeroIconsDownloadAllCommand extends CommandRunner {
  private readonly logger = new Logger(HeroIconsDownloadAllCommand.name);

  constructor(
    private readonly http: ScraperHttpClient,
    private readonly prisma: PrismaService,
    private readonly cache: ResponseCache,
  ) {
    super();
  }

  async run(): Promise<void> {
    const entries = Object.entries(HERO_REGISTRY);
    console.log(`${entries.length}명 아이콘 일괄 다운로드 시작...`);
    const summaries: CodenameSummary[] = [];

    for (const [codename, entry] of entries) {
      try {
        const summary = await this.downloadFor(codename, entry.pageTitle);
        summaries.push(summary);
      } catch (error) {
        summaries.push({
          codename,
          ok: false,
          abilities: 0,
          perks: 0,
          unmatched: 0,
          error: (error as Error).message,
        });
      }
    }

    console.log('결과:');
    console.table(summaries);
    await this.cache.invalidateAll();
  }

  private async downloadFor(codename: string, pageTitle: string): Promise<CodenameSummary> {
    const html = await this.fetchPage(pageTitle);
    const icons = extractHeroIcons(html, pageTitle);

    const hero = await this.prisma.hero.findUnique({
      where: { codename },
      include: {
        abilities: { orderBy: [{ slot: 'asc' }, { order: 'asc' }] },
        perks: { orderBy: [{ tier: 'asc' }, { slot: 'asc' }] },
      },
    });

    if (!hero) {
      return { codename, ok: false, abilities: 0, perks: 0, unmatched: 0, error: 'hero not in DB' };
    }

    const abilityIndex = new Map(hero.abilities.map((a) => [normalizeName(a.name), a]));
    const perkIndex = new Map(hero.perks.map((p) => [normalizeName(p.name), p]));

    let abilityMatched = 0;
    let perkMatched = 0;
    let unmatchedCount = 0;

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
        abilityMatched += 1;
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
        perkMatched += 1;
        continue;
      }

      unmatchedCount += 1;
    }

    return { codename, ok: true, abilities: abilityMatched, perks: perkMatched, unmatched: unmatchedCount };
  }

  private async fetchPage(pageTitle: string): Promise<string> {
    const candidates = [`${NAMUWIKI_BASE}${encodeURIComponent(pageTitle)}`];
    const stripped = pageTitle.replace(/\([^)]+\)$/, '').trim();

    if (stripped && stripped !== pageTitle) {
      candidates.push(`${NAMUWIKI_BASE}${encodeURIComponent(stripped)}`);
    }

    for (const url of candidates) {
      const html = await this.http.fetchHtmlOrNullOnClientError(url);

      if (html !== null) {
        return html;
      }
    }
    throw new Error('namuwiki fetch failed for all candidate URLs');
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
