import { TypedCommandBus, TypedQueryBus } from '@@cqrs';
import { Injectable } from '@nestjs/common';
import { isDefined } from 'class-validator';
import { Profile } from 'passport-github2';

import { SaveGithubUserCommand } from '../../../users/application/commands/save-github-user.command';
import { GetOneUserByEmailQuery } from '../../../users/application/queries/get-one-user-by-email.query';
import { UserEntity } from '../../../users/entities/user.entity';
import { CreateOAuthAccountCommand } from '../command/create-oauth-account.command';
import { UpdateOAuthAccountAccessTokenCommand } from '../command/update-oauth-account-access-token.command';
import { GetOAuthAccountByProviderQuery, OAuthAccountWithUser } from '../queries/get-oauth-account-by-provider.query';

@Injectable()
export class FindOrCreateGithubUserUseCase {
  constructor(
    private readonly commandBus: TypedCommandBus<
      UpdateOAuthAccountAccessTokenCommand | SaveGithubUserCommand | CreateOAuthAccountCommand
    >,
    private readonly queryBus: TypedQueryBus<GetOAuthAccountByProviderQuery | GetOneUserByEmailQuery>,
  ) {}

  async execute(props: FindOrCreateGithubUserUseCaseProps): Promise<UserEntity> {
    const { profile, accessToken } = props;
    const providerAccountId = String(profile.id);
    const email = profile.emails?.[0]?.value;

    const existing = await this.findOAuthAccount(providerAccountId);

    if (isDefined(existing)) {
      await this.updateOAuthAccountToken(existing.id, accessToken);
      return existing.user;
    }

    const user = await this.findOrCreateUser({ email, profile, providerAccountId });

    await this.linkOAuthAccount({ userId: user.id, providerAccountId, accessToken });

    return user;
  }

  async findOAuthAccount(providerAccountId: string): Promise<OAuthAccountWithUser | null> {
    return await this.queryBus.execute(new GetOAuthAccountByProviderQuery({ provider: 'github', providerAccountId }));
  }

  async updateOAuthAccountToken(id: number, accessToken: string): Promise<void> {
    await this.commandBus.execute(new UpdateOAuthAccountAccessTokenCommand({ id, accessToken }));
  }

  async findOrCreateUser(props: {
    email: string | undefined;
    profile: Profile;
    providerAccountId: string;
  }): Promise<UserEntity> {
    const { email, profile, providerAccountId } = props;

    if (isDefined(email)) {
      const existing = await this.queryBus.execute(new GetOneUserByEmailQuery({ email }));

      if (isDefined(existing)) {
        return existing;
      }
    }

    return await this.commandBus.execute(
      new SaveGithubUserCommand({
        email: email ?? `github_${providerAccountId}@noemail.watchpoint.local`,
        name: profile.displayName || profile.username || null,
        avatarUrl: profile.photos?.[0]?.value ?? null,
      }),
    );
  }

  async linkOAuthAccount(props: { userId: number; providerAccountId: string; accessToken: string }): Promise<void> {
    const { userId, providerAccountId, accessToken } = props;

    await this.commandBus.execute(
      new CreateOAuthAccountCommand({ userId, provider: 'github', providerAccountId, accessToken }),
    );
  }
}

interface FindOrCreateGithubUserUseCaseProps {
  profile: Profile;
  accessToken: string;
}
