import { PrismaService } from '@@db';
import { type EntryCategory, type Prisma } from '@@prisma';
import { IQueryHandler, Query, QueryHandler } from '@nestjs/cqrs';

interface GetPatchNoteByVersionQueryProps {
  version: string;
  category?: EntryCategory;
}

export type PatchNoteWithEntries = Prisma.PatchNoteGetPayload<{
  include: { entries: { orderBy: { order: 'asc' } } };
}>;

export class GetPatchNoteByVersionQuery extends Query<PatchNoteWithEntries | null> {
  constructor(public readonly props: GetPatchNoteByVersionQueryProps) {
    super();
  }
}

@QueryHandler(GetPatchNoteByVersionQuery)
export class GetPatchNoteByVersionQueryHandler implements IQueryHandler<GetPatchNoteByVersionQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetPatchNoteByVersionQuery): Promise<PatchNoteWithEntries | null> {
    const { version, category } = query.props;

    return await this.prisma.patchNote.findFirst({
      where: {
        version,
        status: 'PUBLISHED',
      },
      include: {
        entries: {
          where: category ? { category } : undefined,
          orderBy: { order: 'asc' },
        },
      },
    });
  }
}
