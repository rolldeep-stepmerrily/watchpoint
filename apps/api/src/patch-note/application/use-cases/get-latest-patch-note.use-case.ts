import { TypedQueryBus } from '@@cqrs';
import { AppException } from '@@exceptions';
import { Injectable } from '@nestjs/common';
import { isDefined } from 'class-validator';
import { PATCH_NOTE_ERRORS } from '../../patch-note.error';
import { GetLatestPatchNoteResponseDto } from '../../presenter/http/dto/get-latest-patch-note.dto';
import { GetLatestPatchNoteQuery } from '../queries/get-latest-patch-note.query';

@Injectable()
export class GetLatestPatchNoteUseCase {
  constructor(private readonly queryBus: TypedQueryBus<GetLatestPatchNoteQuery>) {}

  /**
   * 가장 최근 PUBLISHED 패치노트 1건을 반환
   *
   * @returns {Promise<GetLatestPatchNoteResponseDto>} 최신 패치노트 요약
   * @throws {AppException} PUBLISHED 패치가 한 건도 없는 경우
   */
  async execute(): Promise<GetLatestPatchNoteResponseDto> {
    const patch = await this.queryBus.execute(new GetLatestPatchNoteQuery());

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
      status: patch.status as 'PUBLISHED',
    };
  }
}
