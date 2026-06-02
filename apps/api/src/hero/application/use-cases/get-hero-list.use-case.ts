import { CACHE_KEYS, CACHE_TTL, ResponseCache } from '@@cache';
import { TypedQueryBus } from '@@cqrs';
import { Injectable } from '@nestjs/common';
import { DEFAULT_LOCALE, type HeroSummaryDto, type Locale } from '@watchpoint/shared';
import { GetHeroListResponseDto } from '../../presenter/http/dto/get-hero-list.dto';
import { resolveName } from '../name-resolver';
import { GetHeroListQuery } from '../queries/get-hero-list.query';

interface GetHeroListUseCaseProps {
  role?: HeroSummaryDto['role'];
  q?: string;
  page: number;
  pageSize: number;
  lang?: Locale;
}

@Injectable()
export class GetHeroListUseCase {
  constructor(
    private readonly queryBus: TypedQueryBus<GetHeroListQuery>,
    private readonly cache: ResponseCache,
  ) {}

  /**
   * 영웅 목록을 조회 (페이지네이션, role/검색어 필터)
   *
   * @param {GetHeroListUseCaseProps} props 조회 파라미터
   * @returns {Promise<GetHeroListResponseDto>} 페이지네이션된 영웅 목록
   */
  async execute(props: GetHeroListUseCaseProps): Promise<GetHeroListResponseDto> {
    const lang = props.lang ?? DEFAULT_LOCALE;
    const key = CACHE_KEYS.heroList(props.role, props.q, props.page, props.pageSize, lang);
    return await this.cache.wrap(key, CACHE_TTL.HERO_LIST, async () => {
      const { items, total } = await this.queryBus.execute(new GetHeroListQuery(props));

      return {
        items: items.map((hero) => ({
          id: hero.id,
          codename: hero.codename,
          name: resolveName(hero.name, hero.nameTranslations, lang),
          role: hero.role,
          subrole: hero.subrole,
          releasedAt: hero.releasedAt.toISOString(),
          portraitUrl: hero.portraitUrl,
        })),
        total,
        page: props.page,
        pageSize: props.pageSize,
      };
    });
  }
}
