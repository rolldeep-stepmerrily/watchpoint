import { TypedCommandBus } from '@@cqrs';
import { RedisService } from '@@redis';
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { DeleteRefreshTokenCommand } from '../command/delete-refresh-token.command';

@Injectable()
export class LogoutUseCase {
  constructor(
    private readonly commandBus: TypedCommandBus<DeleteRefreshTokenCommand>,
    private readonly jwtService: JwtService,
    private readonly redisService: RedisService,
  ) {}

  async execute(props: LogoutUseCaseProps): Promise<void> {
    const { userId, refreshToken, accessToken } = props;

    await Promise.all([
      this.deleteRefreshToken({ userId, token: refreshToken }),
      this.blacklistAccessToken(accessToken),
    ]);
  }

  private async deleteRefreshToken(props: { userId: number; token: string }): Promise<void> {
    await this.commandBus.execute(new DeleteRefreshTokenCommand(props));
  }

  private async blacklistAccessToken(token: string): Promise<void> {
    if (!token) {
      return;
    }

    const decoded = this.jwtService.decode(token) as { exp?: number } | null;

    if (!decoded?.exp) {
      return;
    }

    const ttlSeconds = Math.max(0, decoded.exp - Math.floor(Date.now() / 1000));

    await this.redisService.addToBlacklist(token, ttlSeconds);
  }
}

interface LogoutUseCaseProps {
  userId: number;
  refreshToken: string;
  accessToken: string;
}
