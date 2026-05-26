import { CACHE_KEYS, CACHE_TTL, ResponseCache } from '@@cache';
import { TypedQueryBus } from '@@cqrs';
import { Injectable } from '@nestjs/common';
import { DEFAULT_LOCALE, type Locale } from '@watchpoint/shared';
import { resolveDescription, resolveName } from '../../../hero/application/name-resolver';
import { GetPatchNoteListResponseDto } from '../../presenter/http/dto/get-patch-note-list.dto';
import { GetPatchNoteListQuery } from '../queries/get-patch-note-list.query';

interface GetPatchNoteListUseCaseProps {
  page: number;
  pageSize: number;
  lang?: Locale;
}

@Injectable()
export class GetPatchNoteListUseCase {
  constructor(
    private readonly queryBus: TypedQueryBus<GetPatchNoteListQuery>,
    private readonly cache: ResponseCache,
  ) {}

  /**
   * 패치노트 목록을 최신순 페이지네이션으로 조회 (PUBLISHED만)
   *
   * @param {GetPatchNoteListUseCaseProps} props 페이지네이션 + 로케일
   * @returns {Promise<GetPatchNoteListResponseDto>} 페이지네이션된 패치노트 목록
   */
  async execute(props: GetPatchNoteListUseCaseProps): Promise<GetPatchNoteListResponseDto> {
    const lang = props.lang ?? DEFAULT_LOCALE;
    return await this.cache.wrap(
      CACHE_KEYS.patchList(props.page, props.pageSize, lang),
      CACHE_TTL.PATCH_LIST,
      async () => {
        const { items, total } = await this.queryBus.execute(
          new GetPatchNoteListQuery({ page: props.page, pageSize: props.pageSize }),
        );

        return {
          items: items.map((patch) => ({
            id: patch.id,
            version: patch.version,
            title: resolveName(patch.title, patch.titleTranslations, lang),
            releasedAt: patch.releasedAt.toISOString(),
            sourceUrl: patch.sourceUrl,
            summary: resolveDescription(patch.summary, patch.summaryTranslations, lang),
            status: patch.status,
          })),
          total,
          page: props.page,
          pageSize: props.pageSize,
        };
      },
    );
  }
}
