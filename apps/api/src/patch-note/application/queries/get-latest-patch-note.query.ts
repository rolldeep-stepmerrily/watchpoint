import { PrismaService } from '@@db';
import { type PatchNote } from '@@prisma';
import { IQueryHandler, Query, QueryHandler } from '@nestjs/cqrs';

export class GetLatestPatchNoteQuery extends Query<PatchNote | null> {}

@QueryHandler(GetLatestPatchNoteQuery)
export class GetLatestPatchNoteQueryHandler implements IQueryHandler<GetLatestPatchNoteQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(): Promise<PatchNote | null> {
    return await this.prisma.patchNote.findFirst({
      where: { status: 'PUBLISHED' },
      orderBy: { releasedAt: 'desc' },
    });
  }
}
