import { TypedQueryBus } from '@@cqrs';
import { AppException } from '@@exceptions';
import { Injectable } from '@nestjs/common';
import { DEFAULT_LOCALE, type EntryCategory, type Locale } from '@watchpoint/shared';
import { isDefined } from 'class-validator';
import { resolveDescription, resolveName } from '../../../hero/application/name-resolver';
import { PATCH_NOTE_ERRORS } from '../../patch-note.error';
import { GetPatchNoteEntriesResponseDto } from '../../presenter/http/dto/get-patch-note-entries.dto';
import { GetPatchNoteByVersionQuery } from '../queries/get-patch-note-by-version.query';

interface GetPatchNoteEntriesUseCaseProps {
  version: string;
  category?: EntryCategory;
  lang?: Locale;
}

@Injectable()
export class GetPatchNoteEntriesUseCase {
  constructor(private readonly queryBus: TypedQueryBus<GetPatchNoteByVersionQuery>) {}

  /**
   * 특정 패치의 entry 목록 조회 (category 필터 가능)
   *
   * @param {GetPatchNoteEntriesUseCaseProps} props 조회 파라미터
   * @returns {Promise<GetPatchNoteEntriesResponseDto>} entry 목록
   * @throws {AppException} 패치노트가 존재하지 않거나 미공개인 경우
   */
  async execute(props: GetPatchNoteEntriesUseCaseProps): Promise<GetPatchNoteEntriesResponseDto> {
    const patch = await this.queryBus.execute(
      new GetPatchNoteByVersionQuery({ version: props.version, category: props.category }),
    );

    if (!isDefined(patch)) {
      throw new AppException(PATCH_NOTE_ERRORS.NOT_FOUND);
    }

    const lang = props.lang ?? DEFAULT_LOCALE;

    return {
      entries: patch.entries.map((entry) => ({
        id: entry.id,
        category: entry.category,
        heroId: entry.heroId,
        title: resolveName(entry.title, entry.titleTranslations, lang),
        body: resolveDescription(entry.body, entry.bodyTranslations, lang),
        order: entry.order,
      })),
    };
  }
}
