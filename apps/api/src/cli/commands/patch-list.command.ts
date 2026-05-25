import { PrismaService } from '@@db';
import { PatchNoteStatus } from '@@prisma';
import { Command, CommandRunner, Option } from 'nest-commander';

interface PatchListOptions {
  status?: PatchNoteStatus | 'ALL';
  limit?: number;
}

@Command({
  name: 'patch:list',
  description: '패치노트 목록 조회 (DRAFT/PENDING_REVIEW 포함).',
})
export class PatchListCommand extends CommandRunner {
  constructor(private readonly prismaService: PrismaService) {
    super();
  }

  async run(_inputs: string[], options: PatchListOptions): Promise<void> {
    const statusFilter = options.status && options.status !== 'ALL' ? options.status : undefined;
    const limit = options.limit ?? 30;

    const items = await this.prismaService.patchNote.findMany({
      where: statusFilter ? { status: statusFilter } : undefined,
      orderBy: { releasedAt: 'desc' },
      take: limit,
      select: { id: true, version: true, title: true, status: true, releasedAt: true },
    });

    console.table(
      items.map((item) => ({
        version: item.version,
        status: item.status,
        releasedAt: item.releasedAt.toISOString().slice(0, 10),
        title: item.title.slice(0, 40),
      })),
    );
  }

  @Option({ flags: '-s, --status <status>', description: 'DRAFT|PENDING_REVIEW|PUBLISHED|ALL' })
  parseStatus(value: string): PatchNoteStatus | 'ALL' {
    const upper = value.toUpperCase() as PatchNoteStatus | 'ALL';
    return upper;
  }

  @Option({ flags: '-l, --limit <n>', description: '최대 표시 건수 (기본 30)' })
  parseLimit(value: string): number {
    return Number(value);
  }
}
