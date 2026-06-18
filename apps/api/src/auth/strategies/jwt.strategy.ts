import { PrismaService } from '@@db';
import { AppException } from '@@exceptions';
import { RedisService } from '@@redis';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { isDefined } from 'class-validator';
import type { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { AUTH_ERRORS } from '../auth.error';

interface JwtPayload {
  sub: number;
  email: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
      passReqToCallback: true,
    });
  }

  /**
   * JWT 페이로드로 사용자를 조회하여 반환
   *
   * @param {Request} req Express Request 객체
   * @param {JwtPayload} payload JWT 페이로드
   * @returns {Promise<object>} 조회된 사용자 정보
   * @throws {AppException} 토큰이 블랙리스트에 있거나 사용자를 찾을 수 없는 경우
   */
  async validate(req: Request, payload: JwtPayload): Promise<object> {
    const token = ExtractJwt.fromAuthHeaderAsBearerToken()(req);

    if (token && (await this.redisService.isBlacklisted(token))) {
      throw new AppException(AUTH_ERRORS.REVOKED_TOKEN);
    }

    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });

    if (!isDefined(user)) {
      throw new AppException(AUTH_ERRORS.USER_NOT_FOUND);
    }

    return user;
  }
}
