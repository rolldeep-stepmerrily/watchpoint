import { PrismaService } from '@@db';
import { type Prisma } from '@@prisma';
import { IQueryHandler, Query, QueryHandler } from '@nestjs/cqrs';

interface GetHeroPatchHistoryQueryProps {
  heroId: number;
}

const PATCH_NOTE_SELECT = {
  id: true,
  version: true,
  title: true,
  releasedAt: true,
  sourceUrl: true,
  summary: true,
  status: true,
} as const satisfies Prisma.PatchNoteSelect;

const ENTRY_SELECT = {
  id: true,
  patchNoteId: true,
  category: true,
  heroId: true,
  title: true,
  body: true,
  order: true,
  patchNote: { select: PATCH_NOTE_SELECT },
} as const satisfies Prisma.PatchNoteEntrySelect;

export type PatchEntryWithPatch = Prisma.PatchNoteEntryGetPayload<{ select: typeof ENTRY_SELECT }>;

export class GetHeroPatchHistoryQuery extends Query<PatchEntryWithPatch[]> {
  constructor(public readonly props: GetHeroPatchHistoryQueryProps) {
    super();
  }
}

@QueryHandler(GetHeroPatchHistoryQuery)
export class GetHeroPatchHistoryQueryHandler implements IQueryHandler<GetHeroPatchHistoryQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetHeroPatchHistoryQuery): Promise<PatchEntryWithPatch[]> {
    const { heroId } = query.props;

    const entries = await this.prisma.patchNoteEntry.findMany({
      where: {
        heroId,
        patchNote: { status: 'PUBLISHED' },
      },
      select: ENTRY_SELECT,
    });

    return entries.sort((a, b) => {
      const releasedDiff = b.patchNote.releasedAt.getTime() - a.patchNote.releasedAt.getTime();
      if (releasedDiff !== 0) return releasedDiff;
      return a.order - b.order;
    });
  }
}
