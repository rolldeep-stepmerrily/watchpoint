import { User } from '@@decorators';
import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, Res, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';

import { GithubCallbackUseCase } from '../../application/use-cases/github-callback.use-case';
import { LoginUseCase } from '../../application/use-cases/login.use-case';
import { LogoutUseCase } from '../../application/use-cases/logout.use-case';
import { RefreshUseCase } from '../../application/use-cases/refresh.use-case';
import { SignUpUseCase } from '../../application/use-cases/sign-up.use-case';
import { GithubAuthGuard } from '../../guards/github-auth.guard';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { JwtRefreshGuard } from '../../guards/jwt-refresh.guard';
import { AuthRouter } from './auth.path.presenter';
import { LoginRequestBodyDto, LoginResponseDataDto } from './dto/login.dto';
import { LogoutDto } from './dto/logout.dto';
import { RefreshResponseDataDto } from './dto/refresh.dto';
import { SignUpRequestBodyDto, SignUpResponseDataDto } from './dto/signup.dto';

@Controller(AuthRouter.Root)
@ApiTags(AuthRouter.HttpApiTags)
export class AuthHttpController {
  constructor(
    private readonly configService: ConfigService,
    private readonly signUpUseCase: SignUpUseCase,
    private readonly loginUseCase: LoginUseCase,
    private readonly githubCallbackUseCase: GithubCallbackUseCase,
    private readonly refreshUseCase: RefreshUseCase,
    private readonly logoutUseCase: LogoutUseCase,
  ) {}

  @ApiOperation({ summary: '이메일/비밀번호 회원가입' })
  @ApiBody({ type: SignUpRequestBodyDto })
  @Post(AuthRouter.Http.SignUp)
  async signup(@Body() bodyDto: SignUpRequestBodyDto): Promise<SignUpResponseDataDto> {
    return await this.signUpUseCase.execute({ bodyDto });
  }

  @ApiOperation({ summary: '이메일/비밀번호 로그인' })
  @ApiBody({ type: LoginRequestBodyDto })
  @HttpCode(HttpStatus.OK)
  @Post(AuthRouter.Http.Login)
  async login(@Body() bodyDto: LoginRequestBodyDto): Promise<LoginResponseDataDto> {
    return await this.loginUseCase.execute({ bodyDto });
  }

  @ApiOperation({ summary: 'GitHub OAuth 로그인 (GitHub 인증 페이지로 리디렉트)' })
  @Get(AuthRouter.Http.GithubLogin)
  @UseGuards(GithubAuthGuard)
  githubLogin(): void {
    // GithubAuthGuard가 GitHub OAuth 페이지로 리디렉션 처리
  }

  @ApiOperation({ summary: 'GitHub OAuth 콜백 — 웹 콜백 페이지로 토큰 전달' })
  @Get(AuthRouter.Http.GithubCallback)
  @UseGuards(GithubAuthGuard)
  async githubCallback(@User() user: { id: number; email: string }, @Res() res: Response): Promise<void> {
    const { accessToken, refreshToken } = await this.githubCallbackUseCase.execute({
      userId: user.id,
      email: user.email,
    });

    const webPublicUrl = this.configService.getOrThrow<string>('WEB_PUBLIC_URL');

    // Next.js route handler (BFF)에 토큰 전달 → 거기서 httpOnly cookie로 옮기고 query 없는 URL로 redirect.
    res.redirect(`${webPublicUrl}/api/auth/github-callback?accessToken=${accessToken}&refreshToken=${refreshToken}`);
  }

  @ApiOperation({ summary: 'Access token 갱신' })
  @ApiBearerAuth('refreshToken')
  @UseGuards(JwtRefreshGuard)
  @HttpCode(HttpStatus.OK)
  @Post(AuthRouter.Http.Refresh)
  async refresh(@User() user: { id: number; email: string; refreshToken: string }): Promise<RefreshResponseDataDto> {
    return await this.refreshUseCase.execute({ userId: user.id, email: user.email, oldToken: user.refreshToken });
  }

  @ApiOperation({ summary: '로그아웃 — refresh token 폐기 + access token 블랙리스트' })
  @ApiBearerAuth('accessToken')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Post(AuthRouter.Http.Logout)
  async logout(@User() user: { id: number }, @Body() dto: LogoutDto, @Req() req: Request): Promise<void> {
    const authHeader = req.headers.authorization;
    const accessToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : '';

    await this.logoutUseCase.execute({ userId: user.id, refreshToken: dto.refreshToken, accessToken });
  }
}
