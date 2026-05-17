import { Injectable } from '@nestjs/common';

import { TypedQueryBus } from '@@cqrs';

import { GetSearchResponseDto } from '../../presenter/http/dto/search.dto';
import { SearchQuery } from '../queries/search.query';

interface SearchUseCaseProps {
  q: string;
}

@Injectable()
export class SearchUseCase {
  constructor(private readonly queryBus: TypedQueryBus<SearchQuery>) {}

  /**
   * 영웅과 패치노트(PUBLISHED)에서 q를 부분 매치로 검색.
   *
   * @param {SearchUseCaseProps} props 검색어
   * @returns {Promise<GetSearchResponseDto>} 영웅/패치노트 상위 10건씩
   */
  async execute(props: SearchUseCaseProps): Promise<GetSearchResponseDto> {
    const { heroes, patchNotes } = await this.queryBus.execute(new SearchQuery(props));

    return {
      heroes: heroes.map((hero) => ({
        id: hero.id,
        codename: hero.codename,
        name: hero.name,
        role: hero.role,
        releasedAt: hero.releasedAt.toISOString(),
        portraitUrl: hero.portraitUrl,
      })),
      patchNotes: patchNotes.map((patch) => ({
        id: patch.id,
        version: patch.version,
        title: patch.title,
        releasedAt: patch.releasedAt.toISOString(),
        sourceUrl: patch.sourceUrl,
        summary: patch.summary,
        status: patch.status,
      })),
    };
  }
}
