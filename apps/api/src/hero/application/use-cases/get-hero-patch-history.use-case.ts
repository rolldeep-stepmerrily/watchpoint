import { TypedQueryBus } from '@@cqrs';
import { AppException } from '@@exceptions';
import { Injectable } from '@nestjs/common';
import { DEFAULT_LOCALE, isSubrole, type Locale } from '@watchpoint/shared';
import { isDefined } from 'class-validator';
import { HERO_ERRORS } from '../../hero.error';
import {
  GetHeroPatchHistoryResponseDto,
  HeroPatchHistoryItemResponseDto,
  PatchNoteEntryItemDto,
  PatchNoteSummaryItemDto,
} from '../../presenter/http/dto/get-hero-patch-history.dto';
import { resolveName } from '../name-resolver';
import { GetHeroByCodenameQuery } from '../queries/get-hero-by-codename.query';
import { GetHeroPatchHistoryQuery, type PatchEntryWithPatch } from '../queries/get-hero-patch-history.query';

interface GetHeroPatchHistoryUseCaseProps {
  codename: string;
  lang?: Locale;
}

@Injectable()
export class GetHeroPatchHistoryUseCase {
  constructor(private readonly queryBus: TypedQueryBus<GetHeroByCodenameQuery | GetHeroPatchHistoryQuery>) {}

  /**
   * 영웅의 패치 이력 조회 (PUBLISHED 패치만, 최신순)
   *
   * @param {GetHeroPatchHistoryUseCaseProps} props 조회 파라미터
   * @returns {Promise<GetHeroPatchHistoryResponseDto>} 영웅 + 패치별 entry 그룹
   * @throws {AppException} 영웅이 존재하지 않는 경우
   */
  async execute(props: GetHeroPatchHistoryUseCaseProps): Promise<GetHeroPatchHistoryResponseDto> {
    const hero = await this.queryBus.execute(new GetHeroByCodenameQuery({ codename: props.codename }));

    if (!isDefined(hero)) {
      throw new AppException(HERO_ERRORS.NOT_FOUND);
    }

    const entries = await this.queryBus.execute(new GetHeroPatchHistoryQuery({ heroId: hero.id }));

    const grouped = this.groupEntriesByPatch(entries);

    const lang = props.lang ?? DEFAULT_LOCALE;

    return {
      hero: {
        id: hero.id,
        codename: hero.codename,
        name: resolveName(hero.name, hero.nameTranslations, lang),
        role: hero.role,
        subrole: isSubrole(hero.subrole) ? hero.subrole : null,
        releasedAt: hero.releasedAt.toISOString(),
        portraitUrl: hero.portraitUrl,
      },
      history: grouped,
    };
  }

  /**
   * patchNoteId 기준으로 entry를 그룹핑하여 응답 형태로 변환
   *
   * @param {PatchEntryWithPatch[]} entries patchNote include된 entry 목록
   * @returns {HeroPatchHistoryItemResponseDto[]} 패치별 그룹 (releasedAt 최신순 유지)
   */
  private groupEntriesByPatch(entries: PatchEntryWithPatch[]): HeroPatchHistoryItemResponseDto[] {
    const groups = new Map<number, HeroPatchHistoryItemResponseDto>();

    for (const entry of entries) {
      const existing = groups.get(entry.patchNoteId);
      const entryDto: PatchNoteEntryItemDto = {
        id: entry.id,
        category: entry.category,
        heroId: entry.heroId,
        title: entry.title,
        body: entry.body,
        order: entry.order,
      };

      if (isDefined(existing)) {
        existing.entries.push(entryDto);
        continue;
      }

      const patchSummary: PatchNoteSummaryItemDto = {
        id: entry.patchNote.id,
        version: entry.patchNote.version,
        title: entry.patchNote.title,
        releasedAt: entry.patchNote.releasedAt.toISOString(),
        sourceUrl: entry.patchNote.sourceUrl,
        summary: entry.patchNote.summary,
        status: entry.patchNote.status,
      };

      groups.set(entry.patchNoteId, { patchNote: patchSummary, entries: [entryDto] });
    }

    return Array.from(groups.values());
  }
}
