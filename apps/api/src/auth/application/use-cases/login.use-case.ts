/** biome-ignore-all lint/suspicious/noExplicitAny: @nestjs/jwt v11 expiresIn 타입 이슈 */
import { TypedCommandBus, TypedQueryBus } from '@@cqrs';
import { AppException } from '@@exceptions';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { isDefined } from 'class-validator';
import dayjs from 'dayjs';

import { GetOneUserByEmailQuery } from '../../../users/application/queries/get-one-user-by-email.query';
import { UserEntity } from '../../../users/entities/user.entity';
import { AUTH_ERRORS } from '../../auth.error';
import { LoginRequestBodyDto, LoginResponseDataDto } from '../../presenter/http/dto/login.dto';
import { SaveRefreshTokenCommand } from '../command/save-refresh-token.command';

@Injectable()
export class LoginUseCase {
  constructor(
    private readonly commandBus: TypedCommandBus<SaveRefreshTokenCommand>,
    private readonly queryBus: TypedQueryBus<GetOneUserByEmailQuery>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async execute(props: LoginUseCaseProps): Promise<LoginResponseDataDto> {
    const { email, password } = props.bodyDto;

    const user = await this.getUserByEmail(email);

    if (!isDefined(user.password)) {
      throw new AppException(AUTH_ERRORS.INVALID_CREDENTIALS);
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      throw new AppException(AUTH_ERRORS.INVALID_CREDENTIALS);
    }

    const tokens = await this.issueTokens(user);

    return this.buildResponseDataDto(tokens);
  }

  buildResponseDataDto(tokens: { accessToken: string; refreshToken: string }): LoginResponseDataDto {
    return LoginResponseDataDto.from(tokens);
  }

  async issueTokens(user: UserEntity): Promise<{ accessToken: string; refreshToken: string }> {
    const payload = { sub: user.id, email: user.email };

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

    await this.saveRefreshToken({ userId: user.id, token: tokens.refreshToken, expiresAt });

    return tokens;
  }

  async saveRefreshToken(props: { userId: number; token: string; expiresAt: Date }): Promise<void> {
    await this.commandBus.execute(
      new SaveRefreshTokenCommand({ userId: props.userId, token: props.token, expiresAt: props.expiresAt }),
    );
  }

  async getUserByEmail(email: string): Promise<UserEntity> {
    const user = await this.queryBus.execute(new GetOneUserByEmailQuery({ email }));

    if (!isDefined(user)) {
      throw new AppException(AUTH_ERRORS.INVALID_CREDENTIALS);
    }

    return user;
  }
}

interface LoginUseCaseProps {
  bodyDto: LoginRequestBodyDto;
}
