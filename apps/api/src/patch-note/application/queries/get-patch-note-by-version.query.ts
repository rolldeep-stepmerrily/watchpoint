import { PrismaService } from '@@db';
import { type EntryCategory, type Prisma } from '@@prisma';
import { IQueryHandler, Query, QueryHandler } from '@nestjs/cqrs';

interface GetPatchNoteByVersionQueryProps {
  version: string;
  category?: EntryCategory;
}

const ENTRY_SELECT = {
  id: true,
  category: true,
  heroId: true,
  title: true,
  body: true,
  order: true,
} as const satisfies Prisma.PatchNoteEntrySelect;

const PATCH_SELECT = {
  id: true,
  version: true,
  title: true,
  releasedAt: true,
  sourceUrl: true,
  summary: true,
  status: true,
} as const satisfies Prisma.PatchNoteSelect;

export type PatchNoteWithEntries = Prisma.PatchNoteGetPayload<{ select: typeof PATCH_SELECT }> & {
  entries: Array<Prisma.PatchNoteEntryGetPayload<{ select: typeof ENTRY_SELECT }>>;
};

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
      select: {
        ...PATCH_SELECT,
        entries: {
          where: category ? { category } : undefined,
          orderBy: { order: 'asc' },
          select: ENTRY_SELECT,
        },
      },
    });
  }
}
