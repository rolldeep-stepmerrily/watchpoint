import { AppException } from '@@exceptions';
import { Injectable, Logger } from '@nestjs/common';
import * as cheerio from 'cheerio';

import { SCRAPER_ERRORS } from '../scraper.error';
import type { ParsedHeroEn } from './dto/parsed-hero-en.dto';

@Injectable()
export class BlizzardHeroParser {
  private readonly logger = new Logger(BlizzardHeroParser.name);

  /**
   * Blizzard 영웅 페이지(영문)에서 메타 태그 기반으로 영문 이름/설명만 추출.
   * 능력별 영문 텍스트는 페이지 구조가 영웅마다 다르고 매칭이 까다로워 별도 단계에서 처리.
   */
  parse(html: string, codename: string, sourceUrl: string): ParsedHeroEn {
    try {
      const $ = cheerio.load(html);

      const rawTitle = $('meta[property="og:title"]').attr('content')?.trim();
      const name = this.cleanName(rawTitle) ?? codename;
      const description = $('meta[property="og:description"]').attr('content')?.trim() ?? null;

      return { codename, name, description, sourceUrl };
    } catch (error) {
      this.logger.error(`blizzard hero parse failed for ${codename}`, error as Error);
      throw new AppException(SCRAPER_ERRORS.PARSE_FAILED);
    }
  }

  /**
   * "Ana - Overwatch", "D.Va | Overwatch", "D.Va · Overwatch" 등 사이트별 접미사 제거.
   */
  private cleanName(raw: string | undefined): string | null {
    if (!raw) return null;
    return raw.replace(/\s*[-|·–—]\s*Overwatch.*$/i, '').trim() || null;
  }
}
