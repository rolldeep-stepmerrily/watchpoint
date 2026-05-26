import { PrismaService } from '@@db';
import { type Prisma } from '@@prisma';
import { IQueryHandler, Query, QueryHandler } from '@nestjs/cqrs';

const LATEST_SELECT = {
  id: true,
  version: true,
  title: true,
  titleTranslations: true,
  releasedAt: true,
  sourceUrl: true,
  summary: true,
  summaryTranslations: true,
  status: true,
} as const satisfies Prisma.PatchNoteSelect;

export type LatestPatchNote = Prisma.PatchNoteGetPayload<{ select: typeof LATEST_SELECT }>;

export class GetLatestPatchNoteQuery extends Query<LatestPatchNote | null> {}

@QueryHandler(GetLatestPatchNoteQuery)
export class GetLatestPatchNoteQueryHandler implements IQueryHandler<GetLatestPatchNoteQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(): Promise<LatestPatchNote | null> {
    return await this.prisma.patchNote.findFirst({
      where: { status: 'PUBLISHED' },
      orderBy: { releasedAt: 'desc' },
      select: LATEST_SELECT,
    });
  }
}
