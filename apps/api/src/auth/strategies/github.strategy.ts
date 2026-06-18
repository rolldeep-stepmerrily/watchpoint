import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy } from 'passport-github2';

import { UserEntity } from '../../users/entities/user.entity';
import { FindOrCreateGithubUserUseCase } from '../application/use-cases/find-or-create-github-user.use-case';

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(
    configService: ConfigService,
    private readonly findOrCreateGithubUserUseCase: FindOrCreateGithubUserUseCase,
  ) {
    super({
      // dev에서 GitHub OAuth env가 없어도 부팅은 되도록 placeholder 허용.
      // 실제 /auth/github 호출 시 GitHub 측에서 client_id mismatch로 reject — 부팅 영향 없음.
      clientID: configService.get<string>('GITHUB_CLIENT_ID') ?? 'unset',
      clientSecret: configService.get<string>('GITHUB_CLIENT_SECRET') ?? 'unset',
      callbackURL: configService.get<string>('GITHUB_CALLBACK_URL') ?? 'http://localhost:3000/auth/github/callback',
      scope: ['user:email'],
    });
  }

  /**
   * GitHub OAuth 프로필로 사용자를 조회하거나 생성하여 반환
   *
   * @param {string} accessToken GitHub 액세스 토큰
   * @param {string} _refreshToken GitHub 리프레시 토큰 (미사용)
   * @param {Profile} profile GitHub OAuth 프로필
   * @returns {Promise<UserEntity>} 조회 또는 생성된 사용자 정보
   */
  validate(accessToken: string, _refreshToken: string, profile: Profile): Promise<UserEntity> {
    return this.findOrCreateGithubUserUseCase.execute({ profile, accessToken });
  }
}
