import type { EntryCategory } from '@@prisma';

export interface ParsedPatchEntry {
  category: EntryCategory;
  heroCodename: string | null;
  heroName: string | null;
  title: string;
  body: string;
  order: number;
}

export interface ParsedPatchNote {
  version: string;
  title: string;
  releasedAt: Date;
  sourceUrl: string;
  summary: string | null;
  entries: ParsedPatchEntry[];
}
