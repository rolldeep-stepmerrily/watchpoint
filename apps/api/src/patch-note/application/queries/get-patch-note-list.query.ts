import { PrismaService } from '@@db';
import { IQueryHandler, Query, QueryHandler } from '@nestjs/cqrs';

interface GetPatchNoteListQueryProps {
  page: number;
  pageSize: number;
}

interface PatchNoteListResult {
  items: Array<{
    id: number;
    version: string;
    title: string;
    releasedAt: Date;
    sourceUrl: string;
    summary: string | null;
    status: 'PUBLISHED';
  }>;
  total: number;
}

export class GetPatchNoteListQuery extends Query<PatchNoteListResult> {
  constructor(public readonly props: GetPatchNoteListQueryProps) {
    super();
  }
}

@QueryHandler(GetPatchNoteListQuery)
export class GetPatchNoteListQueryHandler implements IQueryHandler<GetPatchNoteListQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetPatchNoteListQuery): Promise<PatchNoteListResult> {
    const { page, pageSize } = query.props;

    const where = { status: 'PUBLISHED' as const };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.patchNote.findMany({
        where,
        select: {
          id: true,
          version: true,
          title: true,
          releasedAt: true,
          sourceUrl: true,
          summary: true,
          status: true,
        },
        orderBy: { releasedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.patchNote.count({ where }),
    ]);

    return { items: items as PatchNoteListResult['items'], total };
  }
}
