import { PrismaService } from '@@db';
import { type HeroRole as PrismaHeroRole, type Prisma } from '@@prisma';
import { IQueryHandler, Query, QueryHandler } from '@nestjs/cqrs';
import type { HeroRole } from '@watchpoint/shared';

interface GetHeroListQueryProps {
  role?: HeroRole;
  q?: string;
  page: number;
  pageSize: number;
}

interface HeroListResult {
  items: Array<{
    id: number;
    codename: string;
    name: string;
    nameTranslations: Prisma.JsonValue;
    role: PrismaHeroRole;
    subrole: string | null;
    releasedAt: Date;
    portraitUrl: string | null;
  }>;
  total: number;
}

export class GetHeroListQuery extends Query<HeroListResult> {
  constructor(public readonly props: GetHeroListQueryProps) {
    super();
  }
}

@QueryHandler(GetHeroListQuery)
export class GetHeroListQueryHandler implements IQueryHandler<GetHeroListQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetHeroListQuery): Promise<HeroListResult> {
    const { role, q, page, pageSize } = query.props;

    const where = {
      ...(role && { role: role as PrismaHeroRole }),
      ...(q && {
        OR: [
          { name: { contains: q, mode: 'insensitive' as const } },
          { codename: { contains: q, mode: 'insensitive' as const } },
        ],
      }),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.hero.findMany({
        where,
        select: {
          id: true,
          codename: true,
          name: true,
          nameTranslations: true,
          role: true,
          subrole: true,
          releasedAt: true,
          portraitUrl: true,
        },
        orderBy: [{ role: 'asc' }, { name: 'asc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.hero.count({ where }),
    ]);

    return { items, total };
  }
}
