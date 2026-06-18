import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { UsersModule } from '../users/users.module';
import { CreateOAuthAccountCommandHandler } from './application/command/create-oauth-account.command';
import { DeleteRefreshTokenCommandHandler } from './application/command/delete-refresh-token.command';
import { SaveRefreshTokenCommandHandler } from './application/command/save-refresh-token.command';
import { UpdateOAuthAccountAccessTokenCommandHandler } from './application/command/update-oauth-account-access-token.command';
import { GetOAuthAccountByProviderQueryHandler } from './application/queries/get-oauth-account-by-provider.query';
import { FindOrCreateGithubUserUseCase } from './application/use-cases/find-or-create-github-user.use-case';
import { GithubCallbackUseCase } from './application/use-cases/github-callback.use-case';
import { LoginUseCase } from './application/use-cases/login.use-case';
import { LogoutUseCase } from './application/use-cases/logout.use-case';
import { RefreshUseCase } from './application/use-cases/refresh.use-case';
import { SignUpUseCase } from './application/use-cases/sign-up.use-case';
import { AdminGuard } from './guards/admin.guard';
import { GithubAuthGuard } from './guards/github-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import { AuthHttpController } from './presenter/http/auth.http.controller';
import { GithubStrategy } from './strategies/github.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';

@Module({
  imports: [PassportModule, JwtModule.register({}), UsersModule],
  controllers: [AuthHttpController],
  providers: [
    /** strategies */
    JwtStrategy,
    JwtRefreshStrategy,
    GithubStrategy,

    /** guards */
    JwtAuthGuard,
    JwtRefreshGuard,
    GithubAuthGuard,
    AdminGuard,

    /** query-handlers */
    GetOAuthAccountByProviderQueryHandler,

    /** command-handlers */
    SaveRefreshTokenCommandHandler,
    DeleteRefreshTokenCommandHandler,
    CreateOAuthAccountCommandHandler,
    UpdateOAuthAccountAccessTokenCommandHandler,

    /** use-cases */
    SignUpUseCase,
    LoginUseCase,
    FindOrCreateGithubUserUseCase,
    GithubCallbackUseCase,
    RefreshUseCase,
    LogoutUseCase,
  ],
  exports: [JwtAuthGuard, JwtRefreshGuard, AdminGuard],
})
export class AuthModule {}
