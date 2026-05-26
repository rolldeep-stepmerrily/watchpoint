import { CACHE_KEYS, CACHE_TTL, ResponseCache } from '@@cache';
import { TypedQueryBus } from '@@cqrs';
import { AppException } from '@@exceptions';
import { Injectable } from '@nestjs/common';
import { DEFAULT_LOCALE, isSubrole, type Locale } from '@watchpoint/shared';
import { isDefined } from 'class-validator';
import { HERO_ERRORS } from '../../hero.error';
import { GetHeroResponseDto } from '../../presenter/http/dto/get-hero.dto';
import { resolveDescription, resolveName } from '../name-resolver';
import { GetHeroByCodenameQuery } from '../queries/get-hero-by-codename.query';

interface GetHeroUseCaseProps {
  codename: string;
  lang?: Locale;
}

@Injectable()
export class GetHeroUseCase {
  constructor(
    private readonly queryBus: TypedQueryBus<GetHeroByCodenameQuery>,
    private readonly cache: ResponseCache,
  ) {}

  /**
   * codename으로 영웅 상세 정보 조회 (stat + abilities 포함)
   *
   * @param {GetHeroUseCaseProps} props 조회 파라미터
   * @returns {Promise<GetHeroResponseDto>} 영웅 상세 정보
   * @throws {AppException} 영웅이 존재하지 않는 경우
   */
  async execute(props: GetHeroUseCaseProps): Promise<GetHeroResponseDto> {
    const lang = props.lang ?? DEFAULT_LOCALE;
    return await this.cache.wrap(CACHE_KEYS.hero(props.codename, lang), CACHE_TTL.HERO, async () => {
      const hero = await this.queryBus.execute(new GetHeroByCodenameQuery({ codename: props.codename }));

      if (!isDefined(hero)) {
        throw new AppException(HERO_ERRORS.NOT_FOUND);
      }

      return {
        id: hero.id,
        codename: hero.codename,
        name: resolveName(hero.name, hero.nameTranslations, lang),
        role: hero.role,
        subrole: isSubrole(hero.subrole) ? hero.subrole : null,
        releasedAt: hero.releasedAt.toISOString(),
        portraitUrl: hero.portraitUrl,
        description: resolveDescription(hero.description, hero.descriptionTranslations, lang),
        sourceUrl: hero.sourceUrl,
        stat: isDefined(hero.stat)
          ? {
              health: hero.stat.health,
              armor: hero.stat.armor,
              shield: hero.stat.shield,
              moveSpeed: hero.stat.moveSpeed,
              extras: hero.stat.extras as Record<string, unknown> | null,
            }
          : null,
        abilities: hero.abilities.map((ability) => ({
          id: ability.id,
          slot: ability.slot,
          key: ability.key,
          name: resolveName(ability.name, ability.nameTranslations, lang),
          description: resolveDescription(ability.description, ability.descriptionTranslations, lang),
          stats: ability.stats as Record<string, unknown> | null,
          order: ability.order,
        })),
      };
    });
  }
}
