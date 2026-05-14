export type PatchNoteStatus = 'DRAFT' | 'PUBLISHED' | 'PENDING_REVIEW';

export const PATCH_NOTE_STATUSES = [
  'DRAFT',
  'PUBLISHED',
  'PENDING_REVIEW',
] as const satisfies readonly PatchNoteStatus[];
