import { TypedQueryBus } from '@@cqrs';
import { Injectable } from '@nestjs/common';
import { GetPatchNoteListResponseDto } from '../../presenter/http/dto/get-patch-note-list.dto';
import { GetPatchNoteListQuery } from '../queries/get-patch-note-list.query';

interface GetPatchNoteListUseCaseProps {
  page: number;
  pageSize: number;
}

@Injectable()
export class GetPatchNoteListUseCase {
  constructor(private readonly queryBus: TypedQueryBus<GetPatchNoteListQuery>) {}

  /**
   * 패치노트 목록을 최신순 페이지네이션으로 조회 (PUBLISHED만)
   *
   * @param {GetPatchNoteListUseCaseProps} props 페이지네이션 파라미터
   * @returns {Promise<GetPatchNoteListResponseDto>} 페이지네이션된 패치노트 목록
   */
  async execute(props: GetPatchNoteListUseCaseProps): Promise<GetPatchNoteListResponseDto> {
    const { items, total } = await this.queryBus.execute(new GetPatchNoteListQuery(props));

    return {
      items: items.map((patch) => ({
        id: patch.id,
        version: patch.version,
        title: patch.title,
        releasedAt: patch.releasedAt.toISOString(),
        sourceUrl: patch.sourceUrl,
        summary: patch.summary,
        status: patch.status,
      })),
      total,
      page: props.page,
      pageSize: props.pageSize,
    };
  }
}
