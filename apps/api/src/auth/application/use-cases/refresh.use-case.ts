/** biome-ignore-all lint/suspicious/noExplicitAny: @nestjs/jwt v11 expiresIn 타입 이슈 */
import { TypedCommandBus } from '@@cqrs';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import dayjs from 'dayjs';

import { RefreshResponseDataDto } from '../../presenter/http/dto/refresh.dto';
import { DeleteRefreshTokenCommand } from '../command/delete-refresh-token.command';
import { SaveRefreshTokenCommand } from '../command/save-refresh-token.command';

@Injectable()
export class RefreshUseCase {
  constructor(
    private readonly commandBus: TypedCommandBus<SaveRefreshTokenCommand | DeleteRefreshTokenCommand>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async execute(props: RefreshUseCaseProps): Promise<RefreshResponseDataDto> {
    const { userId, email, oldToken } = props;

    await this.deleteRefreshToken(oldToken);

    const tokens = await this.issueTokens(userId, email);

    return this.buildResponseDataDto(tokens);
  }

  buildResponseDataDto(tokens: { accessToken: string; refreshToken: string }): RefreshResponseDataDto {
    return RefreshResponseDataDto.from(tokens);
  }

  async issueTokens(userId: number, email: string): Promise<{ accessToken: string; refreshToken: string }> {
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

  async deleteRefreshToken(token: string): Promise<void> {
    await this.commandBus.execute(new DeleteRefreshTokenCommand({ token }));
  }
}

interface RefreshUseCaseProps {
  userId: number;
  email: string;
  oldToken: string;
}
