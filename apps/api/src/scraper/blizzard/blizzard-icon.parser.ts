import { PerkTier } from '@@prisma';
import { Injectable } from '@nestjs/common';
import * as cheerio from 'cheerio';
import type { AnyNode } from 'domhandler';

/**
 * Blizzard 영웅 페이지(영문 또는 한국어)에서 능력/특전 아이콘 + 메타데이터를 위치 기반으로 추출.
 *
 * - 능력 아이콘: `<blz-tab-control id="..." variant="icon-text" label="..."> <blz-image slot="icon" src="...">`
 *   - id는 어느 locale에서도 영문 slug (kebab-case)로 동일
 *   - label은 페이지 locale에 따라 영문/한국어
 * - 특전: `<div class="perk-details (left|right) (minor|major) N">`
 *   - 안의 `<img alt="..." src="...">`로 아이콘 + 이름
 *   - `<div slot="description">`로 설명
 *   - tier/slot은 class에서 결정 (이름 매칭 불필요)
 */
export interface ParsedAbilityIcon {
  id: string;
  label: string;
  url: string;
}

export interface ParsedPerkIcon {
  tier: PerkTier;
  slot: number;
  label: string;
  description: string;
  url: string;
}

export interface ParsedIcons {
  abilities: ParsedAbilityIcon[];
  perks: ParsedPerkIcon[];
}

@Injectable()
export class BlizzardIconParser {
  parse(html: string): ParsedIcons {
    const $ = cheerio.load(html);

    const abilities: ParsedAbilityIcon[] = [];
    $('blz-tab-control[variant="icon-text"]').each((_, el) => {
      const $el = $(el);
      const id = $el.attr('id')?.trim();
      const label = $el.attr('label')?.trim();
      const url = $el.find('blz-image[slot="icon"]').first().attr('src')?.trim();

      if (!id || !label || !url) {
        return;
      }

      abilities.push({ id, label, url });
    });

    const perks: ParsedPerkIcon[] = [];
    $('div.perk-details').each((_, el) => {
      const $el = $(el);
      const cls = $el.attr('class') ?? '';
      const tierMatch = cls.match(/\b(minor|major)\b/);
      const numberMatch = cls.match(/\b(\d+)\b/);

      if (!tierMatch || !numberMatch) {
        return;
      }

      const $img = $el.find('div.perk-icon img').first();
      const url = $img.attr('src')?.trim();
      const label = $img.attr('alt')?.trim() ?? '';
      const description = this.extractDescription($el.find('div[slot="description"]').first());

      if (!url) {
        return;
      }

      const tier: PerkTier = tierMatch[1] === 'minor' ? PerkTier.MINOR : PerkTier.MAJOR;
      const positionInPage = Number(numberMatch[1]);
      const slot = tier === PerkTier.MINOR ? positionInPage : positionInPage - 2;

      perks.push({ tier, slot, label, description, url });
    });

    return { abilities, perks };
  }

  /**
   * description 안의 nested img(키 아이콘 등) 제거 후 텍스트만.
   */
  private extractDescription($el: cheerio.Cheerio<AnyNode>): string {
    if ($el.length === 0) {
      return '';
    }

    const clone = $el.clone();
    clone.find('img').remove();

    return clone.text().replace(/\s+/g, ' ').trim();
  }
}
