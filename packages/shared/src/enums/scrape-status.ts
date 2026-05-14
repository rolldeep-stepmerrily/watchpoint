export type ScrapeStatus = 'RUNNING' | 'SUCCESS' | 'FAILED' | 'SKIPPED';

export const SCRAPE_STATUSES = [
  'RUNNING',
  'SUCCESS',
  'FAILED',
  'SKIPPED',
] as const satisfies readonly ScrapeStatus[];
