import { AppException } from '@@exceptions';
import { Injectable, Logger } from '@nestjs/common';
import * as cheerio from 'cheerio';
import type { AnyNode } from 'domhandler';

import { SCRAPER_ERRORS } from '../scraper.error';
import type { ParsedAbilityEn, ParsedHeroEn, ParsedPerkEn } from './dto/parsed-hero-en.dto';

@Injectable()
export class BlizzardHeroParser {
  private readonly logger = new Logger(BlizzardHeroParser.name);

  /**
   * Blizzard 영웅 페이지(영문)에서 영문 이름/설명/능력 목록을 추출.
   * - 영웅명/설명: <blz-page-header>의 <blz-header slot="header"> 안. og 메타는 모든 페이지에서
   *   "Overwatch" 게임 일반 정보로 동일하게 들어있어 사용 불가.
   * - 능력: <blz-tab-control id="..."> 순서로 id 목록을 수집한 뒤,
   *   <blz-feature slot="slide"> 카드 순서와 zip하여 {id, name, description}로 구성.
   *
   * 능력 매칭(어떤 DB slot에 들어갈지)은 scraper의 매칭 로직에서 처리한다.
   */
  parse(html: string, codename: string, sourceUrl: string): ParsedHeroEn {
    try {
      const $ = cheerio.load(html);

      const $pageHeader = $('blz-page-header').first();
      const name = this.parseHeroName($, $pageHeader, codename);
      const description = this.parseHeroDescription($pageHeader);
      const abilities = this.parseAbilities($);
      const perks = this.parsePerks($);

      return { codename, name, description, abilities, perks, sourceUrl };
    } catch (error) {
      this.logger.error(`blizzard hero parse failed for ${codename}`, error as Error);
      throw new AppException(SCRAPER_ERRORS.PARSE_FAILED);
    }
  }

  /**
   * <blz-page-header> 내부의 첫 <blz-header slot="header"> > <h2 slot="heading"> 를 우선,
   * 없으면 <title>Overwatch - Heroes - D.Va</title> 끝부분에서 추출.
   */
  private parseHeroName($: cheerio.CheerioAPI, $pageHeader: cheerio.Cheerio<AnyNode>, codename: string): string {
    const headerName = $pageHeader.find('blz-header[slot="header"] h2[slot="heading"]').first().text().trim();
    if (headerName) {
      return headerName;
    }

    const titleText = $('title').first().text().trim();
    const titleMatch = titleText.match(/-\s*Heroes\s*-\s*(.+)$/i);
    if (titleMatch?.[1]) {
      return titleMatch[1].trim();
    }

    return codename;
  }

  /**
   * <blz-page-header>의 직속 <blz-header slot="header"> > <p slot="description">.
   * blz-list-item 안의 description (role/subrole/location 정보)과 구분하기 위해 first()만 사용.
   */
  private parseHeroDescription($pageHeader: cheerio.Cheerio<AnyNode>): string | null {
    const text = $pageHeader.find('blz-header[slot="header"] p[slot="description"]').first().text().trim();
    return text || null;
  }

  private parseAbilities($: cheerio.CheerioAPI): ParsedAbilityEn[] {
    const ids: string[] = [];
    $('blz-tab-control[id]').each((_, element) => {
      const id = $(element).attr('id')?.trim();
      if (id && !ids.includes(id)) {
        ids.push(id);
      }
    });

    const abilities: ParsedAbilityEn[] = [];
    $('blz-feature[slot="slide"]').each((index, element) => {
      const $el = $(element);
      const name = $el.find('h3.heading').first().text().trim();
      const description = this.extractDescription($el.find('p[slot="description"]').first());
      if (!(name && description)) {
        return;
      }
      const id = ids[abilities.length] ?? '';
      abilities.push({ index, id, name, description });
    });

    if (ids.length > 0 && ids.length !== abilities.length) {
      this.logger.warn(
        `ability tab-control(${ids.length}) vs feature card(${abilities.length}) 갯수 불일치 — id 매핑이 어긋났을 수 있음`,
      );
    }

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
   * Blizzard 영문 페이지의 perk 카드 추출.
   *
   * 마크업: `<div class="perk-details {left|right} {minor|major} N">` 4개.
   * 각 카드 내부:
   *   - `.perk-info > blz-header > h3[slot="subheading"]` → 이름
   *   - `.perk-info > blz-header > div[slot="description"]` → 설명
   *
   * tier 매핑: minor → MINOR, major → MAJOR
   * slot 매핑: left → 1, right → 2
   */
  private parsePerks($: cheerio.CheerioAPI): ParsedPerkEn[] {
    const perks: ParsedPerkEn[] = [];
    $('.perk-details').each((_, element) => {
      const perk = this.parsePerkCard($(element));
      if (perk) {
        perks.push(perk);
      }
    });
    return perks;
  }

  /**
   * 단일 `.perk-details` 카드를 ParsedPerkEn으로 변환. 분류/텍스트 누락 시 null.
   */
  private parsePerkCard($card: cheerio.Cheerio<AnyNode>): ParsedPerkEn | null {
    const classes = ($card.attr('class') ?? '').split(/\s+/);
    const slot = classes.includes('left') ? 1 : classes.includes('right') ? 2 : null;
    const tier = classes.includes('minor') ? 'MINOR' : classes.includes('major') ? 'MAJOR' : null;
    if (!(slot && tier)) {
      return null;
    }
    const name = $card.find('.perk-info blz-header h3[slot="subheading"]').first().text().trim();
    const description = $card
      .find('.perk-info blz-header div[slot="description"]')
      .first()
      .text()
      .replace(/\s+/g, ' ')
      .trim();
    if (!(name && description)) {
      return null;
    }
    return { tier, slot, name, description };
  }
}
