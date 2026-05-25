import { Command, CommandRunner, Option } from 'nest-commander';

import { BlizzardPatchScraper } from '../../scraper/blizzard';

interface PatchBackfillOptions {
  until?: Date;
  maxPages?: number;
}

@Command({
  name: 'patch:backfill',
  description: '블리자드 패치노트를 페이지네이션 따라가며 과거까지 백필합니다.',
})
export class PatchBackfillCommand extends CommandRunner {
  constructor(private readonly scraper: BlizzardPatchScraper) {
    super();
  }

  async run(_inputs: string[], options: PatchBackfillOptions): Promise<void> {
    const until = options.until ?? new Date('2026-01-01T00:00:00Z');
    const maxPages = options.maxPages ?? 24;

    console.log(`백필 시작 — until=${until.toISOString().slice(0, 10)} maxPages=${maxPages}`);
    const summary = await this.scraper.backfill({ until, maxPages });
    console.log('백필 완료:');
    console.table(summary);
  }

  @Option({ flags: '--until <date>', description: '이 날짜 이전 패치는 무시 (YYYY-MM-DD, 기본 2026-01-01)' })
  parseUntil(value: string): Date {
    const date = new Date(`${value}T00:00:00Z`);
    if (Number.isNaN(date.getTime())) {
      throw new Error(`잘못된 날짜 형식: ${value} (YYYY-MM-DD 필요)`);
    }
    return date;
  }

  @Option({ flags: '--max-pages <n>', description: '최대 페이지 수 (기본 24)' })
  parseMaxPages(value: string): number {
    const n = Number.parseInt(value, 10);
    if (Number.isNaN(n) || n <= 0) {
      throw new Error(`잘못된 max-pages: ${value}`);
    }
    return n;
  }
}
