import { PrismaService } from '@@db';
import type { HeroRole as PrismaHeroRole } from '@@prisma';
import { IQueryHandler, Query, QueryHandler } from '@nestjs/cqrs';

const RESULT_LIMIT = 10;

interface SearchQueryProps {
  q: string;
}

export interface SearchResult {
  heroes: Array<{
    id: number;
    codename: string;
    name: string;
    role: PrismaHeroRole;
    releasedAt: Date;
    portraitUrl: string | null;
  }>;
  patchNotes: Array<{
    id: number;
    version: string;
    title: string;
    releasedAt: Date;
    sourceUrl: string;
    summary: string | null;
    status: 'PUBLISHED';
  }>;
}

export class SearchQuery extends Query<SearchResult> {
  constructor(public readonly props: SearchQueryProps) {
    super();
  }
}

@QueryHandler(SearchQuery)
export class SearchQueryHandler implements IQueryHandler<SearchQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: SearchQuery): Promise<SearchResult> {
    const { q } = query.props;

    const [heroes, patchNotes] = await this.prisma.$transaction([
      this.prisma.hero.findMany({
        where: {
          OR: [{ name: { contains: q, mode: 'insensitive' } }, { codename: { contains: q, mode: 'insensitive' } }],
        },
        select: {
          id: true,
          codename: true,
          name: true,
          role: true,
          releasedAt: true,
          portraitUrl: true,
        },
        orderBy: [{ role: 'asc' }, { name: 'asc' }],
        take: RESULT_LIMIT,
      }),
      this.prisma.patchNote.findMany({
        where: {
          status: 'PUBLISHED',
          OR: [
            { version: { contains: q, mode: 'insensitive' } },
            { title: { contains: q, mode: 'insensitive' } },
            { summary: { contains: q, mode: 'insensitive' } },
          ],
        },
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
        take: RESULT_LIMIT,
      }),
    ]);

    return { heroes, patchNotes: patchNotes as SearchResult['patchNotes'] };
  }
}
