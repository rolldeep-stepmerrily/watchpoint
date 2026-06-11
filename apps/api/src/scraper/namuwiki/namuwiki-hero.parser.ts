import { AppException } from '@@exceptions';
import { Injectable, Logger } from '@nestjs/common';
import * as cheerio from 'cheerio';
import type { AnyNode } from 'domhandler';

import { SCRAPER_ERRORS } from '../scraper.error';
import type { ParsedNamuwikiAbility, ParsedNamuwikiHero } from './dto/parsed-hero.dto';

/**
 * 나무위키는 Vue 컴포넌트로 렌더링되어 클래스명이 빌드마다 바뀌므로,
 * 안정적인 anchor id(`s-X.Y`)와 텍스트 패턴만 사용.
 *
 * 능력 추출 패턴: 목차 항목 텍스트 형태
 *   `5.4. 우클릭 - 톱니칼(Jagged Blade)`
 *   `5.2. 지속 능력 - 아드레날린 촉진(Adrenaline Rush)`
 *   `5.3. 기본 무기 - 산탄총(Scattergun)`
 *
 * 모든 영웅 페이지는 "<숫자>.<숫자>. <키 또는 카테고리> - <한글>(<영문>)" 형태로 능력을 나열.
 * 영문이 항상 괄호 안에 있어 ability id 매칭 anchor로 활용 가능.
 *
 * subrole 항목(예: `5.1. 지속 능력 - 하위 역할: 강건한 자(Subrole: Stalwart)`)은 영문에 'Subrole:'이
 * 포함돼 있어 자동 필터.
 *
 * 능력 섹션 번호는 영웅마다 다를 수 있으므로 목차 텍스트 패턴만으로 식별.
 */
@Injectable()
export class NamuwikiHeroParser {
  private readonly logger = new Logger(NamuwikiHeroParser.name);

  parse(html: string, codename: string, pageTitle: string, sourceUrl: string): ParsedNamuwikiHero {
    try {
      const $ = cheerio.load(html);
      const abilities = this.parseAbilities($, codename);
      return { codename, pageTitle, sourceUrl, abilities };
    } catch (error) {
      this.logger.error(`namuwiki parse failed for ${codename}`, error as Error);
      throw new AppException(SCRAPER_ERRORS.PARSE_FAILED);
    }
  }

  /**
   * 목차 anchor(`href="#s-X.Y"`)를 가진 모든 항목에서 텍스트 패턴 매칭으로 능력 추출.
   * 중복 anchor(목차 + 본문 heading)는 같은 sectionId 첫 등장만 채택.
   */
  private parseAbilities($: cheerio.CheerioAPI, codename: string): ParsedNamuwikiAbility[] {
    const abilities: ParsedNamuwikiAbility[] = [];
    const seen = new Set<string>();

    $('a[href^="#s-"]').each((_, el) => {
      const $anchor = $(el);
      const href = $anchor.attr('href') ?? '';
      const sectionId = href.replace(/^#/, '');
      if (seen.has(sectionId) || !/^s-\d+\.\d+$/.test(sectionId)) {
        return;
      }
      const parsed = this.parseAnchorEntry($anchor, sectionId);
      if (!parsed) {
        return;
      }
      seen.add(sectionId);
      abilities.push(parsed);
    });

    if (abilities.length === 0) {
      this.logger.warn(`${codename}: namuwiki 능력 추출 0개 — 페이지 구조 변경 가능성`);
    }
    return abilities;
  }

  /**
   * 단일 anchor `<a href="#s-X.Y">`의 부모 텍스트에서 `X.Y. <키표시> - <한글>(<영문>)` 패턴 매칭.
   * subrole 항목(영문에 'Subrole:' 포함)은 ability가 아니므로 null.
   */
  private parseAnchorEntry($anchor: cheerio.Cheerio<AnyNode>, sectionId: string): ParsedNamuwikiAbility | null {
    const text = ($anchor.parent().text() ?? '').replace(/\s+/g, ' ').trim();
    const match = text.match(/^[\d.]+\.\s*(.+?)\(([^()]+?)\)\s*$/);
    if (!match) {
      return null;
    }
    const koPart = match[1].trim();
    const enName = match[2].trim();

    if (/^(Sub)?[Rr]ole:?/i.test(enName)) {
      return null;
    }

    const { keyHint, koName } = this.splitKoPart(koPart);
    if (!koName) {
      return null;
    }
    const enSlug = this.slugifyEn(enName);
    return { sectionId, enSlug, enName, koName, keyHint };
  }

  /**
   * `우클릭 - 톱니칼` → { keyHint: '우클릭', koName: '톱니칼' }
   * `아드레날린 촉진` → { keyHint: null, koName: '아드레날린 촉진' }
   */
  private splitKoPart(koPart: string): { keyHint: string | null; koName: string } {
    const sepIdx = koPart.indexOf(' - ');
    if (sepIdx === -1) {
      return { keyHint: null, koName: koPart };
    }
    const keyHint = koPart.slice(0, sepIdx).trim();
    const koName = koPart.slice(sepIdx + 3).trim();
    return { keyHint: keyHint || null, koName };
  }

  /**
   * 영문 능력명을 ability id slug로 변환: 소문자 + 공백/특수문자 → '-'.
   * 예: "Jagged Blade" → "jagged-blade", "D.Va" → "d-va"
   */
  private slugifyEn(enName: string): string {
    return enName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}
