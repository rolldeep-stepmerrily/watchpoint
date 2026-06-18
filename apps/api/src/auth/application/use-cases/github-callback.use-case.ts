/** biome-ignore-all lint/suspicious/noExplicitAny: @nestjs/jwt v11 expiresIn 타입 이슈 */
import { TypedCommandBus } from '@@cqrs';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import dayjs from 'dayjs';

import { SaveRefreshTokenCommand } from '../command/save-refresh-token.command';

@Injectable()
export class GithubCallbackUseCase {
  constructor(
    private readonly commandBus: TypedCommandBus<SaveRefreshTokenCommand>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  execute(props: GithubCallbackUseCaseProps): Promise<GithubCallbackResult> {
    const { userId, email } = props;

    return this.issueTokens(userId, email);
  }

  async issueTokens(userId: number, email: string): Promise<GithubCallbackResult> {
    const payload = { sub: userId, email };

    const tokens = {
      accessToken: this.jwtService.sign(payload, {
        secret: this.configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
        expiresIn: this.configService.getOrThrow<string>('JWT_ACCESS_EXPIRES_IN') as any,
      }),
      refreshToken: this.jwtService.sign(payload, {
        secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.getOrThrow<string>('JWT_REFRESH_EXPIRES_IN') as any,
      }),
    };

    const refreshTtlDays = this.configService.getOrThrow<number>('REFRESH_TOKEN_TTL_DAYS');
    const expiresAt = dayjs().add(refreshTtlDays, 'day').toDate();

    await this.saveRefreshToken({ userId, token: tokens.refreshToken, expiresAt });

    return tokens;
  }

  async saveRefreshToken(props: { userId: number; token: string; expiresAt: Date }): Promise<void> {
    await this.commandBus.execute(
      new SaveRefreshTokenCommand({ userId: props.userId, token: props.token, expiresAt: props.expiresAt }),
    );
  }
}

interface GithubCallbackUseCaseProps {
  userId: number;
  email: string;
}

interface GithubCallbackResult {
  accessToken: string;
  refreshToken: string;
}
