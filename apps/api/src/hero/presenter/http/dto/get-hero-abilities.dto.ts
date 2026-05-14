import { ApiProperty } from '@nestjs/swagger';
import { HeroAbilityItemDto } from './get-hero.dto';

export class GetHeroAbilitiesResponseDto {
  @ApiProperty({ type: [HeroAbilityItemDto] })
  abilities!: HeroAbilityItemDto[];
}
