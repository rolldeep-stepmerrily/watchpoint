import { ResponseCache } from '@@cache';
import { PrismaService } from '@@db';
import { AppException } from '@@exceptions';
import { type AbilitySlot, ScrapeSource } from '@@prisma';
import { Injectable, Logger } from '@nestjs/common';

import { NAMUWIKI_PAGE_TITLES } from '../../domain/namuwiki-page-titles';
import { ABILITY_ID_TO_SLOT } from '../../seeder/icon-overrides';
import { mergeTranslation, ScrapeJobRecorder, ScraperHttpClient } from '../common';
import { SCRAPER_ERRORS } from '../scraper.error';
import type { ParsedNamuwikiAbility, ParsedNamuwikiHero } from './dto/parsed-hero.dto';
import { NamuwikiHeroParser } from './namuwiki-hero.parser';

const NAMUWIKI_BASE = 'https://namu.wiki/w/';

export interface NamuwikiSyncResult {
  codename: string;
  matched: boolean;
  abilitiesParsed: number;
  abilitiesUpdated: number;
  unmatchedAbilities: string[];
}

/**
 * 나무위키 영웅 페이지에서 한국어 ability 명칭을 우선 가져와 DB ability.name을 갱신.
 *
 * 매칭 우선순위:
 *   1) 나무위키 영문 능력명 slug(예: 'jagged-blade') == DB ability.blizzardId
 *   2) ABILITY_ID_TO_SLOT[codename][slug] override로 slot 결정 → 같은 slot의 빈 자리에 채움
 *   3) 매칭 실패 시 unmatchedAbilities에 누적, warn 로그
 *
 * - DB의 ability.nameTranslations.en은 보존(블리자드 영문 sync가 채운 값)
 * - DB의 ability.name(한국어)만 나무위키 명칭으로 덮어쓰기
 * - 나무위키에 없는 ability(블리자드에만 있는 것)는 그대로 보존
 */
@Injectable()
export class NamuwikiHeroScraper {
  private readonly logger = new Logger(NamuwikiHeroScraper.name);

  constructor(
    private readonly httpClient: ScraperHttpClient,
    private readonly parser: NamuwikiHeroParser,
    private readonly recorder: ScrapeJobRecorder,
    private readonly prismaService: PrismaService,
    private readonly responseCache: ResponseCache,
  ) {}

  async sync(codename: string): Promise<NamuwikiSyncResult> {
    const pageTitle = NAMUWIKI_PAGE_TITLES[codename];
    if (!pageTitle) {
      this.logger.warn(`${codename}: NAMUWIKI_PAGE_TITLES 매핑 없음 — 신규 영웅이면 추가 필요`);
      return { codename, matched: false, abilitiesParsed: 0, abilitiesUpdated: 0, unmatchedAbilities: [] };
    }

    const candidates = this.buildCandidateUrls(pageTitle);
    const primaryUrl = candidates[0];

    const result = await this.recorder.run({
      source: ScrapeSource.NAMUWIKI_HERO,
      target: primaryUrl,
      task: async () => {
        const fetched = await this.fetchWithFallback(candidates);
        const parsed = this.parser.parse(fetched.html, codename, pageTitle, fetched.url);
        const summary = await this.applyNames(parsed);
        return { result: summary, diffSummary: { ...summary } };
      },
    });
    if (result.matched) {
      await this.responseCache.invalidateAll();
    }
    return result;
  }

  /**
   * pageTitle이 `<name>(<context>)` 형태면 bare `<name>`도 후보에 포함.
   * namuwiki는 동음이의 있을 때만 suffix를 쓰는데 카탈로그가 어긋날 때 자동 폴백.
   */
  private buildCandidateUrls(pageTitle: string): string[] {
    const urls = [`${NAMUWIKI_BASE}${encodeURIComponent(pageTitle)}`];
    const stripped = pageTitle.replace(/\([^)]+\)$/, '').trim();
    if (stripped && stripped !== pageTitle) {
      urls.push(`${NAMUWIKI_BASE}${encodeURIComponent(stripped)}`);
    }
    return urls;
  }

  private async fetchWithFallback(urls: string[]): Promise<{ url: string; html: string }> {
    for (const url of urls) {
      const html = await this.httpClient.fetchHtmlOrNullOnClientError(url);
      if (html !== null) {
        return { url, html };
      }
    }
    throw new AppException(SCRAPER_ERRORS.FETCH_FAILED);
  }

  private async applyNames(parsed: ParsedNamuwikiHero): Promise<NamuwikiSyncResult> {
    const hero = await this.prismaService.hero.findUnique({
      where: { codename: parsed.codename },
      select: {
        id: true,
        abilities: {
          select: { id: true, slot: true, order: true, name: true, blizzardId: true, nameTranslations: true },
          orderBy: [{ slot: 'asc' }, { order: 'asc' }],
        },
      },
    });
    if (!hero) {
      this.logger.warn(`${parsed.codename}: hero row 없음 — catalog seed 필요`);
      return {
        codename: parsed.codename,
        matched: false,
        abilitiesParsed: parsed.abilities.length,
        abilitiesUpdated: 0,
        unmatchedAbilities: parsed.abilities.map((a) => a.koName),
      };
    }

    const overrides = ABILITY_ID_TO_SLOT[parsed.codename];
    const dbBySlot = new Map<AbilitySlot, typeof hero.abilities>();
    for (const a of hero.abilities) {
      const arr = dbBySlot.get(a.slot) ?? [];
      arr.push(a);
      dbBySlot.set(a.slot, arr);
    }

    let updated = 0;
    const unmatched: string[] = [];

    for (const parsedAbility of parsed.abilities) {
      const target = this.matchDbAbility(hero.abilities, dbBySlot, overrides, parsedAbility);
      if (!target) {
        unmatched.push(parsedAbility.koName);
        this.logger.warn(
          `${parsed.codename}: namuwiki ability "${parsedAbility.koName}(${parsedAbility.enName})" DB 매칭 실패 ` +
            `— ABILITY_ID_TO_SLOT['${parsed.codename}']['${parsedAbility.enSlug}'] 추가 검토`,
        );
        continue;
      }
      if (target.name === parsedAbility.koName) {
        continue;
      }
      const nextName = mergeTranslation(target.nameTranslations, 'ko', parsedAbility.koName);
      await this.prismaService.heroAbility.update({
        where: { id: target.id },
        data: {
          name: parsedAbility.koName,
          nameTranslations: nextName as never,
        },
      });
      updated++;
    }

    return {
      codename: parsed.codename,
      matched: true,
      abilitiesParsed: parsed.abilities.length,
      abilitiesUpdated: updated,
      unmatchedAbilities: unmatched,
    };
  }

  /**
   * 1) blizzardId 매칭 (enSlug == DB ability.blizzardId)
   * 2) override 매칭 (ABILITY_ID_TO_SLOT[cn][enSlug] → slot의 빈 자리)
   * 3) 실패 시 null
   */
  private matchDbAbility(
    dbAbilities: ReadonlyArray<{
      id: number;
      slot: AbilitySlot;
      order: number;
      name: string;
      blizzardId: string | null;
      nameTranslations: unknown;
    }>,
    dbBySlot: Map<
      AbilitySlot,
      ReadonlyArray<{
        id: number;
        slot: AbilitySlot;
        order: number;
        name: string;
        blizzardId: string | null;
        nameTranslations: unknown;
      }>
    >,
    overrides: Partial<Record<string, AbilitySlot | AbilitySlot[]>> | undefined,
    parsed: ParsedNamuwikiAbility,
  ): {
    id: number;
    slot: AbilitySlot;
    order: number;
    name: string;
    blizzardId: string | null;
    nameTranslations: unknown;
  } | null {
    const byId = dbAbilities.find((a) => a.blizzardId === parsed.enSlug);
    if (byId) {
      return byId;
    }
    const mapping = overrides?.[parsed.enSlug];
    if (!mapping) {
      return null;
    }
    const targetSlot = Array.isArray(mapping) ? mapping[0] : mapping;
    const slotAbilities = dbBySlot.get(targetSlot);
    if (!slotAbilities || slotAbilities.length === 0) {
      return null;
    }
    return slotAbilities[0];
  }
}
