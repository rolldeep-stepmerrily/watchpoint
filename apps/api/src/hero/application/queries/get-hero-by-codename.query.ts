import { PrismaService } from '@@db';
import { type Prisma } from '@@prisma';
import { IQueryHandler, Query, QueryHandler } from '@nestjs/cqrs';

interface GetHeroByCodenameQueryProps {
  codename: string;
}

type HeroWithRelations = Prisma.HeroGetPayload<{
  include: {
    stat: true;
    abilities: { orderBy: [{ slot: 'asc' }, { order: 'asc' }] };
    perks: { orderBy: [{ tier: 'asc' }, { slot: 'asc' }] };
  };
}>;

export class GetHeroByCodenameQuery extends Query<HeroWithRelations | null> {
  constructor(public readonly props: GetHeroByCodenameQueryProps) {
    super();
  }
}

@QueryHandler(GetHeroByCodenameQuery)
export class GetHeroByCodenameQueryHandler implements IQueryHandler<GetHeroByCodenameQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetHeroByCodenameQuery): Promise<HeroWithRelations | null> {
    const { codename } = query.props;

    return await this.prisma.hero.findUnique({
      where: { codename },
      include: {
        stat: true,
        abilities: { orderBy: [{ slot: 'asc' }, { order: 'asc' }] },
        perks: { orderBy: [{ tier: 'asc' }, { slot: 'asc' }] },
      },
    });
  }
}
