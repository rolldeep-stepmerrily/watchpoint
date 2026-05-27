import { TypedQueryBus } from '@@cqrs';
import { Injectable, Logger } from '@nestjs/common';
import { DEFAULT_LOCALE, isSubrole, type Locale, type Subrole } from '@watchpoint/shared';

import { resolveDescription, resolveName } from '../../../hero/application/name-resolver';
import { GetSearchResponseDto } from '../../presenter/http/dto/search.dto';
import { SearchQuery } from '../queries/search.query';

interface SearchUseCaseProps {
  q: string;
  lang?: Locale;
}

@Injectable()
export class SearchUseCase {
  private readonly logger = new Logger(SearchUseCase.name);

  constructor(private readonly queryBus: TypedQueryBus<SearchQuery>) {}

  /**
   * 영웅과 패치노트(PUBLISHED)에서 q를 부분 매치로 검색.
   *
   * @param {SearchUseCaseProps} props 검색어 + 응답 로케일
   * @returns {Promise<GetSearchResponseDto>} 영웅/패치노트 상위 10건씩
   */
  async execute(props: SearchUseCaseProps): Promise<GetSearchResponseDto> {
    const { heroes, patchNotes } = await this.queryBus.execute(new SearchQuery({ q: props.q }));
    const lang = props.lang ?? DEFAULT_LOCALE;

    return {
      heroes: heroes.map((hero) => ({
        id: hero.id,
        codename: hero.codename,
        name: resolveName(hero.name, hero.nameTranslations, lang),
        role: hero.role,
        subrole: this.resolveSubrole(hero.codename, hero.subrole),
        releasedAt: hero.releasedAt.toISOString(),
        portraitUrl: hero.portraitUrl,
      })),
      patchNotes: patchNotes.map((patch) => ({
        id: patch.id,
        version: patch.version,
        title: resolveName(patch.title, patch.titleTranslations, lang),
        releasedAt: patch.releasedAt.toISOString(),
        sourceUrl: patch.sourceUrl,
        summary: resolveDescription(patch.summary, patch.summaryTranslations, lang),
        status: patch.status,
      })),
    };
  }

  private resolveSubrole(codename: string, subrole: string | null): Subrole | null {
    if (subrole === null) return null;
    if (isSubrole(subrole)) return subrole;
    this.logger.warn(`hero ${codename}: invalid subrole "${subrole}" dropped to null`);
    return null;
  }
}
