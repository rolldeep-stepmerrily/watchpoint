import { Injectable, Logger } from '@nestjs/common';
import * as cheerio from 'cheerio';

import { AppException } from '@@exceptions';
import type { HeroRole } from '@@prisma';

import { SCRAPER_ERRORS } from '../scraper.error';
import type { ParsedHero } from './dto/parsed-hero.dto';

const ROLE_KEYWORDS: ReadonlyArray<{ role: HeroRole; keywords: string[] }> = [
  { role: 'TANK', keywords: ['돌격'] },
  { role: 'DAMAGE', keywords: ['공격', '딜러'] },
  { role: 'SUPPORT', keywords: ['지원'] },
];

/**
 * 나무위키는 Vue로 렌더링되어 클래스명이 빌드마다 바뀜.
 * 안정적으로 추출 가능한 것만 본다:
 * - og:title, og:image, og:description (메타 태그)
 * - title 텍스트 일치
 *
 * 본문 기반 스탯/능력 추출은 페이지마다 너무 달라 신뢰할 수 없음.
 * v1에서는 메타만 채우고 stat/abilities는 비워둔 채 hero:edit + Prisma Studio로 보정.
 */
@Injectable()
export class NamuwikiHeroParser {
  private readonly logger = new Logger(NamuwikiHeroParser.name);

  parse(html: string, codename: string, sourceUrl: string): ParsedHero {
    try {
      const $ = cheerio.load(html);

      const ogTitle = $('meta[property="og:title"]').attr('content')?.trim();
      const name = ogTitle?.replace(/\s*\([^)]*\)\s*$/, '').trim() || codename;
      const description = $('meta[property="og:description"]').attr('content')?.trim() ?? null;
      const portraitUrl = this.normalizeUrl($('meta[property="og:image"]').attr('content'));
      const role = this.inferRole(description ?? '');

      return {
        codename,
        name,
        role,
        releasedAt: null,
        portraitUrl,
        description,
        sourceUrl,
        stat: null,
        abilities: [],
      };
    } catch (error) {
      this.logger.error(`namuwiki parse failed for ${codename}`, error as Error);
      throw new AppException(SCRAPER_ERRORS.PARSE_FAILED);
    }
  }

  private inferRole(text: string): HeroRole {
    for (const { role, keywords } of ROLE_KEYWORDS) {
      if (keywords.some((keyword) => text.includes(keyword))) return role;
    }
    return 'DAMAGE';
  }

  private normalizeUrl(url: string | undefined): string | null {
    if (!url) return null;
    if (url.startsWith('//')) return `https:${url}`;
    return url;
  }
}
