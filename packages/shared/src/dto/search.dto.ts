import type { HeroSummaryDto } from './hero.dto';
import type { PatchNoteSummaryDto } from './patch-note.dto';

export interface SearchResponseDto {
  heroes: HeroSummaryDto[];
  patchNotes: PatchNoteSummaryDto[];
}
