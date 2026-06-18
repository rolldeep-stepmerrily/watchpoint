import { Module } from '@nestjs/common';

import { SaveGithubUserCommandHandler } from './application/commands/save-github-user.command';
import { SaveUserCommandHandler } from './application/commands/save-user.command';
import { UpdateUserPasswordCommandHandler } from './application/commands/update-user-password.command';
import { UpdateUserProfileCommandHandler } from './application/commands/update-user-profile.command';
import { GetOneUserByEmailQueryHandler } from './application/queries/get-one-user-by-email.query';
import { GetUserByIdQueryHandler } from './application/queries/get-user-by-id.query';
import { ChangePasswordUseCase } from './application/use-cases/change-password.use-case';
import { GetMeUseCase } from './application/use-cases/get-me.use-case';
import { UpdateProfileUseCase } from './application/use-cases/update-profile.use-case';
import { UsersHttpController } from './presenter/http/users.http.controller';

@Module({
  controllers: [UsersHttpController],
  providers: [
    /** query-handlers */
    GetOneUserByEmailQueryHandler,
    GetUserByIdQueryHandler,

    /** command-handlers */
    SaveUserCommandHandler,
    SaveGithubUserCommandHandler,
    UpdateUserProfileCommandHandler,
    UpdateUserPasswordCommandHandler,

    /** use-cases */
    GetMeUseCase,
    UpdateProfileUseCase,
    ChangePasswordUseCase,
  ],
})
export class UsersModule {}
