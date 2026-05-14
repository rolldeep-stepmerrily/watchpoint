import { PrismaService } from '@@db';
import { type Prisma } from '@@prisma';
import { IQueryHandler, Query, QueryHandler } from '@nestjs/cqrs';

interface GetHeroPatchHistoryQueryProps {
  heroId: number;
}

export type PatchEntryWithPatch = Prisma.PatchNoteEntryGetPayload<{
  include: { patchNote: true };
}>;

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

    return await this.prisma.patchNoteEntry.findMany({
      where: {
        heroId,
        patchNote: { status: 'PUBLISHED' },
      },
      include: { patchNote: true },
      orderBy: [{ patchNote: { releasedAt: 'desc' } }, { order: 'asc' }],
    });
  }
}
