import { PrismaService } from '@@db';
import type { HeroAbility, HeroPerk } from '@@prisma';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve as pathResolve } from 'node:path';
import { Injectable, Logger } from '@nestjs/common';

import { ScraperHttpClient } from '../scraper/common';
import { type ExtractedImage, extractAllImages, normalizeName } from '../scraper/namuwiki';

import { ICON_NAME_OVERRIDES } from './icon-overrides';

const NAMUWIKI_BASE = 'https://namu.wiki/w/';
const PUBLIC_ICONS_REL = '../web/public/icons/heroes';

export interface DownloadResult {
  codename: string;
  abilityMatched: number;
  abilityTotal: number;
  perkMatched: number;
  perkTotal: number;
  unmatchedAbilities: string[];
  unmatchedPerks: string[];
  extraImages: string[];
}

@Injectable()
export class HeroIconMatcher {
  private readonly logger = new Logger(HeroIconMatcher.name);

  constructor(
    private readonly http: ScraperHttpClient,
    private readonly prisma: PrismaService,
  ) {}

  async downloadFor(codename: string, pageTitle: string): Promise<DownloadResult> {
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

    const html = await this.fetchPage(pageTitle);
    const images = extractAllImages(html, pageTitle);
    const index = this.buildImageIndex(images);
    const overrides = ICON_NAME_OVERRIDES[codename] ?? {};
    const usedUrls = new Set<string>();

    const result: DownloadResult = {
      codename,
      abilityMatched: 0,
      abilityTotal: hero.abilities.length,
      perkMatched: 0,
      perkTotal: hero.perks.length,
      unmatchedAbilities: [],
      unmatchedPerks: [],
      extraImages: [],
    };

    for (const ability of hero.abilities) {
      const image = this.findImage(ability.name, overrides, index);

      if (!image) {
        result.unmatchedAbilities.push(ability.name);
        continue;
      }

      usedUrls.add(image.url);
      const relPath = this.abilityRelPath(codename, ability, image.url);
      await this.saveAndUpdate(image.url, relPath, { kind: 'ability', record: ability });
      result.abilityMatched += 1;
    }

    for (const perk of hero.perks) {
      const image = this.findImage(perk.name, overrides, index);

      if (!image) {
        result.unmatchedPerks.push(perk.name);
        continue;
      }

      usedUrls.add(image.url);
      const relPath = this.perkRelPath(codename, perk, image.url);
      await this.saveAndUpdate(image.url, relPath, { kind: 'perk', record: perk });
      result.perkMatched += 1;
    }

    for (const image of images) {
      if (usedUrls.has(image.url)) {
        continue;
      }
      const label = image.altWithoutPrefix ?? image.alt;
      result.extraImages.push(label);
    }

    return result;
  }

  private buildImageIndex(images: ExtractedImage[]): Map<string, ExtractedImage> {
    const byPrefix = new Map<string, ExtractedImage>();
    const byStandalone = new Map<string, ExtractedImage>();

    for (const image of images) {
      if (image.altWithoutPrefix) {
        const key = normalizeName(image.altWithoutPrefix);

        if (!byPrefix.has(key)) {
          byPrefix.set(key, image);
        }

        continue;
      }

      const key = normalizeName(image.alt);

      if (!byStandalone.has(key)) {
        byStandalone.set(key, image);
      }
    }

    const merged = new Map<string, ExtractedImage>(byStandalone);

    for (const [key, value] of byPrefix) {
      merged.set(key, value);
    }

    return merged;
  }

  private findImage(
    dbName: string,
    overrides: Record<string, string>,
    index: Map<string, ExtractedImage>,
  ): ExtractedImage | null {
    const candidates = [dbName];
    const overrideName = overrides[dbName];

    if (overrideName) {
      candidates.push(overrideName);
    }

    for (const candidate of candidates) {
      const image = index.get(normalizeName(candidate));

      if (image) {
        return image;
      }
    }

    return null;
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

  private abilityRelPath(codename: string, ability: HeroAbility, url: string): string {
    const ext = this.extensionOf(url);

    return `${codename}/abilities/${ability.slot.toLowerCase()}.${ext}`;
  }

  private perkRelPath(codename: string, perk: HeroPerk, url: string): string {
    const ext = this.extensionOf(url);

    return `${codename}/perks/${perk.tier.toLowerCase()}-${perk.slot}.${ext}`;
  }

  private async saveAndUpdate(
    url: string,
    relPath: string,
    target: { kind: 'ability'; record: HeroAbility } | { kind: 'perk'; record: HeroPerk },
  ): Promise<void> {
    const { bytes } = await this.http.fetchBytes(url);
    const absPath = pathResolve(process.cwd(), PUBLIC_ICONS_REL, relPath);
    await mkdir(dirname(absPath), { recursive: true });
    await writeFile(absPath, bytes);
    this.logger.log(`saved ${relPath} (${bytes.byteLength} bytes)`);

    const iconUrl = `/icons/heroes/${relPath}`;

    if (target.kind === 'ability') {
      await this.prisma.heroAbility.update({ where: { id: target.record.id }, data: { iconUrl } });

      return;
    }

    await this.prisma.heroPerk.update({ where: { id: target.record.id }, data: { iconUrl } });
  }

  private extensionOf(url: string): string {
    const match = url.match(/\.([a-zA-Z0-9]+)(?:\?|$)/);

    return (match?.[1] ?? 'png').toLowerCase();
  }
}
