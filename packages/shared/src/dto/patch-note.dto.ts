import type { EntryCategory, PatchNoteStatus } from '../enums';

export interface PatchNoteSummaryDto {
  id: number;
  version: string;
  title: string;
  releasedAt: string;
  sourceUrl: string;
  summary: string | null;
  status: PatchNoteStatus;
}

export interface PatchNoteDetailDto extends PatchNoteSummaryDto {
  entries: PatchNoteEntryDto[];
}

export interface PatchNoteEntryDto {
  id: number;
  category: EntryCategory;
  heroId: number | null;
  title: string;
  body: string;
  order: number;
}
