import { DEFAULT_LOCALE } from '@@shared';
import type { Metadata } from 'next';

import { getLabels } from '@/lib/labels';

import { PatchNoteNotFoundContent } from './not-found-content';

export function generateMetadata(): Metadata {
  const t = getLabels(DEFAULT_LOCALE);
  return {
    title: t.patchNotes.notFound.title,
    robots: { index: false, follow: false },
  };
}

export default function PatchNoteNotFound() {
  return <PatchNoteNotFoundContent />;
}
