import { TypedQueryBus } from '@@cqrs';
import { AppException } from '@@exceptions';
import { Injectable } from '@nestjs/common';
import { isDefined } from 'class-validator';
import { HERO_ERRORS } from '../../hero.error';
import { GetHeroAbilitiesResponseDto } from '../../presenter/http/dto/get-hero-abilities.dto';
import { GetHeroByCodenameQuery } from '../queries/get-hero-by-codename.query';

interface GetHeroAbilitiesUseCaseProps {
  codename: string;
}

@Injectable()
export class GetHeroAbilitiesUseCase {
  constructor(private readonly queryBus: TypedQueryBus<GetHeroByCodenameQuery>) {}

  /**
   * codename으로 영웅의 능력 목록만 조회
   *
   * @param {GetHeroAbilitiesUseCaseProps} props 조회 파라미터
   * @returns {Promise<GetHeroAbilitiesResponseDto>} 능력 목록
   * @throws {AppException} 영웅이 존재하지 않는 경우
   */
  async execute(props: GetHeroAbilitiesUseCaseProps): Promise<GetHeroAbilitiesResponseDto> {
    const hero = await this.queryBus.execute(new GetHeroByCodenameQuery({ codename: props.codename }));

    if (!isDefined(hero)) {
      throw new AppException(HERO_ERRORS.NOT_FOUND);
    }

    return {
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
