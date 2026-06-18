/** biome-ignore-all lint/suspicious/noExplicitAny: @nestjs/jwt v11 expiresIn 타입이 ms의 StringValue를 요구하나 string과 호환되지 않는 라이브러리 타입 이슈 */
import { TypedCommandBus, TypedQueryBus } from '@@cqrs';
import { PrismaService } from '@@db';
import { AppException } from '@@exceptions';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { isDefined } from 'class-validator';
import dayjs from 'dayjs';

import { SaveUserCommand } from '../../../users/application/commands/save-user.command';
import { GetOneUserByEmailQuery } from '../../../users/application/queries/get-one-user-by-email.query';
import { UserEntity } from '../../../users/entities/user.entity';
import { AUTH_ERRORS } from '../../auth.error';
import { SignUpRequestBodyDto, SignUpResponseDataDto } from '../../presenter/http/dto/signup.dto';
import { SaveRefreshTokenCommand } from '../command/save-refresh-token.command';

@Injectable()
export class SignUpUseCase {
  constructor(
    private readonly commandBus: TypedCommandBus<SaveUserCommand | SaveRefreshTokenCommand>,
    private readonly queryBus: TypedQueryBus<GetOneUserByEmailQuery>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async execute(props: SignUpUseCaseProps): Promise<SignUpResponseDataDto> {
    const { email, password, name } = props.bodyDto;

    await this.checkEmailDuplication(email);

    const hashedPassword = await this.hashPassword(password);

    const tokens = await this.prisma.$transaction(async () => {
      const user = await this.signUp({ email, hashedPassword, name });

      return await this.issueTokens(user);
    });

    return this.buildResponseDataDto(tokens);
  }

  buildResponseDataDto(tokens: { accessToken: string; refreshToken: string }): SignUpResponseDataDto {
    return SignUpResponseDataDto.from(tokens);
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

  async signUp(props: { email: string; hashedPassword: string; name?: string }): Promise<UserEntity> {
    const { email, hashedPassword, name } = props;

    return await this.commandBus.execute(new SaveUserCommand({ email, password: hashedPassword, name }));
  }

  async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, 10);
  }

  async checkEmailDuplication(email: string): Promise<void> {
    const user = await this.queryBus.execute(new GetOneUserByEmailQuery({ email }));

    if (isDefined(user)) {
      throw new AppException(AUTH_ERRORS.EMAIL_ALREADY_EXISTS);
    }
  }
}

interface SignUpUseCaseProps {
  bodyDto: SignUpRequestBodyDto;
}
