import type { HeroSummaryDto } from './hero.dto';
import type { PatchNoteEntryDto, PatchNoteSummaryDto } from './patch-note.dto';

export interface HeroPatchHistoryItemDto {
  patchNote: PatchNoteSummaryDto;
  entries: PatchNoteEntryDto[];
}

export interface HeroPatchHistoryDto {
  hero: HeroSummaryDto;
  history: HeroPatchHistoryItemDto[];
}
