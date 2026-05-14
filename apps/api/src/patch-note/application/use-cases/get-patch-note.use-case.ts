import { TypedQueryBus } from '@@cqrs';
import { AppException } from '@@exceptions';
import { Injectable } from '@nestjs/common';
import { isDefined } from 'class-validator';
import { PATCH_NOTE_ERRORS } from '../../patch-note.error';
import { GetPatchNoteResponseDto } from '../../presenter/http/dto/get-patch-note.dto';
import { GetPatchNoteByVersionQuery } from '../queries/get-patch-note-by-version.query';

interface GetPatchNoteUseCaseProps {
  version: string;
}

@Injectable()
export class GetPatchNoteUseCase {
  constructor(private readonly queryBus: TypedQueryBus<GetPatchNoteByVersionQuery>) {}

  /**
   * version으로 패치노트 상세 조회 (entries 포함, PUBLISHED만)
   *
   * @param {GetPatchNoteUseCaseProps} props 조회 파라미터
   * @returns {Promise<GetPatchNoteResponseDto>} 패치노트 상세
   * @throws {AppException} 패치노트가 존재하지 않거나 미공개인 경우
   */
  async execute(props: GetPatchNoteUseCaseProps): Promise<GetPatchNoteResponseDto> {
    const patch = await this.queryBus.execute(new GetPatchNoteByVersionQuery({ version: props.version }));

    if (!isDefined(patch)) {
      throw new AppException(PATCH_NOTE_ERRORS.NOT_FOUND);
    }

    return {
      id: patch.id,
      version: patch.version,
      title: patch.title,
      releasedAt: patch.releasedAt.toISOString(),
      sourceUrl: patch.sourceUrl,
      summary: patch.summary,
      status: patch.status,
      entries: patch.entries.map((entry) => ({
        id: entry.id,
        category: entry.category,
        heroId: entry.heroId,
        title: entry.title,
        body: entry.body,
        order: entry.order,
      })),
    };
  }
}
