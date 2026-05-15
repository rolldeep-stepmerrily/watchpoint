import { Injectable, Logger } from '@nestjs/common';
import * as cheerio from 'cheerio';

import { AppException } from '@@exceptions';
import type { AbilitySlot, HeroRole } from '@@prisma';

import { SCRAPER_ERRORS } from '../scraper.error';
import type { ParsedHero, ParsedHeroAbility, ParsedHeroStat } from './dto/parsed-hero.dto';

const ROLE_KEYWORDS: ReadonlyArray<{ role: HeroRole; keywords: string[] }> = [
  { role: 'TANK', keywords: ['돌격', 'tank'] },
  { role: 'DAMAGE', keywords: ['공격', 'damage', 'dps'] },
  { role: 'SUPPORT', keywords: ['지원', 'support'] },
];

const SLOT_BY_KEY: Record<string, AbilitySlot> = {
  '좌클릭': 'PRIMARY',
  '우클릭': 'SECONDARY',
  shift: 'ABILITY_1',
  e: 'ABILITY_2',
  q: 'ULTIMATE',
};

@Injectable()
export class NamuwikiHeroParser {
  private readonly logger = new Logger(NamuwikiHeroParser.name);

  parse(html: string, codename: string, sourceUrl: string): ParsedHero {
    try {
      const $ = cheerio.load(html);

      const name = $('h1').first().text().trim() || codename;
      const description = $('meta[name="description"]').attr('content')?.trim() ?? null;
      const portraitUrl = $('meta[property="og:image"]').attr('content') ?? null;
      const role = this.inferRole($('body').text());
      const releasedAt = this.extractReleaseDate($);
      const stat = this.extractStat($);
      const abilities = this.extractAbilities($);

      return {
        codename,
        name,
        role,
        releasedAt,
        portraitUrl,
        description,
        sourceUrl,
        stat,
        abilities,
      };
    } catch (error) {
      this.logger.error(`namuwiki parse failed for ${codename}`, error as Error);
      throw new AppException(SCRAPER_ERRORS.PARSE_FAILED);
    }
  }

  private inferRole(text: string): HeroRole {
    const lower = text.toLowerCase();
    for (const { role, keywords } of ROLE_KEYWORDS) {
      if (keywords.some((keyword) => lower.includes(keyword))) return role;
    }
    return 'DAMAGE';
  }

  private extractReleaseDate($: cheerio.CheerioAPI): Date | null {
    const text = $('body').text();
    const match = text.match(/(\d{4})[년.\-/](\d{1,2})[월.\-/](\d{1,2})/);
    if (!match) return null;
    const [, y, m, d] = match;
    const date = new Date(`${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}T00:00:00Z`);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  private extractStat($: cheerio.CheerioAPI): ParsedHeroStat | null {
    const health = this.parseNumber($, ['생명력', 'HP']);
    if (health === null) return null;

    const armor = this.parseNumber($, ['방어력', 'armor']) ?? 0;
    const shield = this.parseNumber($, ['보호막', 'shield']) ?? 0;
    const moveSpeed = this.parseNumber($, ['이동 속도', 'move']) ?? 5.5;

    return {
      health,
      armor,
      shield,
      moveSpeed,
      extras: null,
    };
  }

  private parseNumber($: cheerio.CheerioAPI, keys: string[]): number | null {
    const text = $('body').text();
    for (const key of keys) {
      const regex = new RegExp(`${key}\\s*[:=]?\\s*(\\d+(?:\\.\\d+)?)`, 'i');
      const match = text.match(regex);
      if (match) return Number(match[1]);
    }
    return null;
  }

  private extractAbilities($: cheerio.CheerioAPI): ParsedHeroAbility[] {
    const abilities: ParsedHeroAbility[] = [];
    let order = 0;

    $('table').each((_, table) => {
      const rows = $(table).find('tr');
      rows.each((_index, row) => {
        const cells = $(row).find('th, td');
        if (cells.length < 2) return;

        const left = $(cells[0]).text().trim();
        const right = $(cells[1]).text().trim();
        const slot = this.matchSlot(left);
        if (!slot) return;

        abilities.push({
          slot,
          key: left,
          name: right.split('\n')[0].trim(),
          description: right,
          stats: null,
          order: order++,
        });
      });
    });

    return abilities;
  }

  private matchSlot(label: string): AbilitySlot | null {
    const normalized = label.toLowerCase().trim();
    return SLOT_BY_KEY[normalized] ?? SLOT_BY_KEY[label.trim()] ?? null;
  }
}
