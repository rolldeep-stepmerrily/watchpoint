import { PrismaService } from '@@db';
import { AppException } from '@@exceptions';
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
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(
    configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      passReqToCallback: true,
    });
  }

  /**
   * 리프레시 토큰 유효성을 검증하고 사용자 정보를 반환
   *
   * @param {Request} req Express 요청 객체
   * @param {JwtPayload} payload JWT 페이로드
   * @returns {Promise<object>} 검증된 사용자 정보 (리프레시 토큰 포함)
   * @throws {AppException} 토큰이 없거나 만료/미존재인 경우
   */
  async validate(req: Request, payload: JwtPayload): Promise<object> {
    const token = req.headers.authorization?.split(' ')[1];

    if (!isDefined(token)) {
      throw new AppException(AUTH_ERRORS.INVALID_REFRESH_TOKEN);
    }

    const stored = await this.prisma.refreshToken.findUnique({ where: { token } });

    if (!isDefined(stored) || stored.expiresAt < new Date()) {
      throw new AppException(AUTH_ERRORS.INVALID_REFRESH_TOKEN);
    }

    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });

    if (!isDefined(user)) {
      throw new AppException(AUTH_ERRORS.USER_NOT_FOUND);
    }

    return { ...user, refreshToken: token };
  }
}
