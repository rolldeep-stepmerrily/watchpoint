import { PrismaService } from '@@db';
import { type IQueryHandler, Query, QueryHandler } from '@nestjs/cqrs';

import { UserEntity } from '../../../users/entities/user.entity';

export class GetOAuthAccountByProviderQuery extends Query<OAuthAccountWithUser | null> {
  constructor(public readonly props: GetOAuthAccountByProviderQueryProps) {
    super();
  }
}

@QueryHandler(GetOAuthAccountByProviderQuery)
export class GetOAuthAccountByProviderQueryHandler implements IQueryHandler<GetOAuthAccountByProviderQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetOAuthAccountByProviderQuery): Promise<OAuthAccountWithUser | null> {
    const { provider, providerAccountId } = query.props;

    return (await this.prisma.oAuthAccount.findUnique({
      where: { provider_providerAccountId: { provider, providerAccountId } },
      include: { user: true },
    })) as OAuthAccountWithUser | null;
  }
}

export interface OAuthAccountWithUser {
  id: number;
  userId: number;
  provider: string;
  providerAccountId: string;
  accessToken: string | null;
  user: UserEntity;
}

interface GetOAuthAccountByProviderQueryProps {
  provider: string;
  providerAccountId: string;
}
