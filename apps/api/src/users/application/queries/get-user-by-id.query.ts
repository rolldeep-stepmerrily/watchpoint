import { PrismaService } from '@@db';
import { type IQueryHandler, Query, QueryHandler } from '@nestjs/cqrs';

import { UserEntity } from '../../entities/user.entity';

export class GetUserByIdQuery extends Query<UserEntity | null> {
  constructor(public readonly props: GetUserByIdQueryProps) {
    super();
  }
}

@QueryHandler(GetUserByIdQuery)
export class GetUserByIdQueryHandler implements IQueryHandler<GetUserByIdQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetUserByIdQuery): Promise<UserEntity | null> {
    const { userId } = query.props;

    return (await this.prisma.user.findUnique({ where: { id: userId } })) as UserEntity | null;
  }
}

interface GetUserByIdQueryProps {
  userId: number;
}
