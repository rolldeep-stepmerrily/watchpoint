import { PrismaService } from '@@db';
import { type IQueryHandler, Query, QueryHandler } from '@nestjs/cqrs';

import { UserEntity } from '../../entities/user.entity';

export class GetOneUserByEmailQuery extends Query<UserEntity | null> {
  constructor(public readonly props: GetOneUserByEmailQueryProps) {
    super();
  }
}

@QueryHandler(GetOneUserByEmailQuery)
export class GetOneUserByEmailQueryHandler implements IQueryHandler<GetOneUserByEmailQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetOneUserByEmailQuery): Promise<UserEntity | null> {
    const { email } = query.props;

    return (await this.prisma.user.findUnique({ where: { email } })) as UserEntity | null;
  }
}

interface GetOneUserByEmailQueryProps {
  email: string;
}
