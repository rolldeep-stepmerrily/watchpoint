import { DEFAULT_LOCALE } from '@@shared';
import type { Metadata } from 'next';

import { getLabels } from '@/lib/labels';

import { HeroNotFoundContent } from './not-found-content';

export function generateMetadata(): Metadata {
  const t = getLabels(DEFAULT_LOCALE);
  return {
    title: t.heroes.notFound.title,
    robots: { index: false, follow: false },
  };
}

export default function HeroNotFound() {
  return <HeroNotFoundContent />;
}
