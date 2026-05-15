import { TypedQueryBus } from '@@cqrs';
import { AppException } from '@@exceptions';
import { Injectable } from '@nestjs/common';
import { isDefined } from 'class-validator';
import { HERO_ERRORS } from '../../hero.error';
import { GetHeroResponseDto } from '../../presenter/http/dto/get-hero.dto';
import { GetHeroByCodenameQuery } from '../queries/get-hero-by-codename.query';

interface GetHeroUseCaseProps {
  codename: string;
}

@Injectable()
export class GetHeroUseCase {
  constructor(private readonly queryBus: TypedQueryBus<GetHeroByCodenameQuery>) {}

  /**
   * codename으로 영웅 상세 정보 조회 (stat + abilities 포함)
   *
   * @param {GetHeroUseCaseProps} props 조회 파라미터
   * @returns {Promise<GetHeroResponseDto>} 영웅 상세 정보
   * @throws {AppException} 영웅이 존재하지 않는 경우
   */
  async execute(props: GetHeroUseCaseProps): Promise<GetHeroResponseDto> {
    const hero = await this.queryBus.execute(new GetHeroByCodenameQuery({ codename: props.codename }));

    if (!isDefined(hero)) {
      throw new AppException(HERO_ERRORS.NOT_FOUND);
    }

    return {
      id: hero.id,
      codename: hero.codename,
      name: hero.name,
      role: hero.role,
      releasedAt: hero.releasedAt.toISOString(),
      portraitUrl: hero.portraitUrl,
      description: hero.description,
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
        name: ability.name,
        description: ability.description,
        stats: ability.stats as Record<string, unknown> | null,
        order: ability.order,
      })),
    };
  }
}
