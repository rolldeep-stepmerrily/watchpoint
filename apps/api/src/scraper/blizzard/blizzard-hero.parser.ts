import { AppException } from '@@exceptions';
import { Injectable, Logger } from '@nestjs/common';
import * as cheerio from 'cheerio';
import type { AnyNode } from 'domhandler';

import { SCRAPER_ERRORS } from '../scraper.error';
import type { ParsedAbilityEn, ParsedHeroEn } from './dto/parsed-hero-en.dto';

@Injectable()
export class BlizzardHeroParser {
  private readonly logger = new Logger(BlizzardHeroParser.name);

  /**
   * Blizzard 영웅 페이지(영문)에서 영문 이름/설명/능력 목록을 추출.
   * - 영웅명/설명: og:title / og:description
   * - 능력: `<blz-feature slot="slide">` 카드 안의 `h3.heading` (이름) + `p[slot="description"]` (설명)
   *
   * 능력 매칭(어떤 DB slot에 들어갈지)은 scraper의 매칭 로직에서 처리한다.
   */
  parse(html: string, codename: string, sourceUrl: string): ParsedHeroEn {
    try {
      const $ = cheerio.load(html);

      const rawTitle = $('meta[property="og:title"]').attr('content')?.trim();
      const name = this.cleanName(rawTitle) ?? codename;
      const description = $('meta[property="og:description"]').attr('content')?.trim() ?? null;
      const abilities = this.parseAbilities($);

      return { codename, name, description, abilities, sourceUrl };
    } catch (error) {
      this.logger.error(`blizzard hero parse failed for ${codename}`, error as Error);
      throw new AppException(SCRAPER_ERRORS.PARSE_FAILED);
    }
  }

  private parseAbilities($: cheerio.CheerioAPI): ParsedAbilityEn[] {
    const abilities: ParsedAbilityEn[] = [];

    $('blz-feature[slot="slide"]').each((index, element) => {
      const $el = $(element);
      const name = $el.find('h3.heading').first().text().trim();
      const description = this.extractDescription($el.find('p[slot="description"]').first());
      if (name && description) {
        abilities.push({ index, name, description });
      }
    });

    return abilities;
  }

  /**
   * `<p slot="description">` 안의 텍스트만 추출 (이미지 아이콘은 무시).
   * 텍스트 노드 사이 공백을 정규화.
   */
  private extractDescription($p: cheerio.Cheerio<AnyNode>): string {
    const clone = $p.clone();
    clone.find('img').remove();
    return clone.text().replace(/\s+/g, ' ').trim();
  }

  /**
   * "Ana - Overwatch", "D.Va | Overwatch" 등 사이트별 접미사 제거.
   */
  private cleanName(raw: string | undefined): string | null {
    if (!raw) {
      return null;
    }
    return raw.replace(/\s*[-|·–—]\s*Overwatch.*$/i, '').trim() || null;
  }
}
