import { TypedQueryBus } from '@@cqrs';
import { AppException } from '@@exceptions';
import { Injectable } from '@nestjs/common';
import { DEFAULT_LOCALE, type Locale } from '@watchpoint/shared';
import { isDefined } from 'class-validator';
import { resolveDescription, resolveName } from '../../../hero/application/name-resolver';
import { PATCH_NOTE_ERRORS } from '../../patch-note.error';
import { GetLatestPatchNoteResponseDto } from '../../presenter/http/dto/get-latest-patch-note.dto';
import { GetLatestPatchNoteQuery } from '../queries/get-latest-patch-note.query';

interface GetLatestPatchNoteUseCaseProps {
  lang?: Locale;
}

@Injectable()
export class GetLatestPatchNoteUseCase {
  constructor(private readonly queryBus: TypedQueryBus<GetLatestPatchNoteQuery>) {}

  /**
   * 가장 최근 PUBLISHED 패치노트 1건을 반환
   */
  async execute(props: GetLatestPatchNoteUseCaseProps = {}): Promise<GetLatestPatchNoteResponseDto> {
    const patch = await this.queryBus.execute(new GetLatestPatchNoteQuery());

    if (!isDefined(patch)) {
      throw new AppException(PATCH_NOTE_ERRORS.NOT_FOUND);
    }

    const lang = props.lang ?? DEFAULT_LOCALE;

    return {
      id: patch.id,
      version: patch.version,
      title: resolveName(patch.title, patch.titleTranslations, lang),
      releasedAt: patch.releasedAt.toISOString(),
      sourceUrl: patch.sourceUrl,
      summary: resolveDescription(patch.summary, patch.summaryTranslations, lang),
      status: patch.status as 'PUBLISHED',
    };
  }
}
