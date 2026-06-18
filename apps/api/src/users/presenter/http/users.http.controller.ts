import { User } from '@@decorators';
import { Body, Controller, Get, HttpCode, HttpStatus, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { ChangePasswordUseCase } from '../../application/use-cases/change-password.use-case';
import { GetMeUseCase } from '../../application/use-cases/get-me.use-case';
import { UpdateProfileUseCase } from '../../application/use-cases/update-profile.use-case';
import { ProfileEntity } from '../../entities/profile.entity';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UsersRouter } from './users.path.presenter';

@ApiTags(UsersRouter.HttpApiTags)
@ApiBearerAuth('accessToken')
@UseGuards(JwtAuthGuard)
@Controller(UsersRouter.Root)
export class UsersHttpController {
  constructor(
    private readonly getMeUseCase: GetMeUseCase,
    private readonly updateProfileUseCase: UpdateProfileUseCase,
    private readonly changePasswordUseCase: ChangePasswordUseCase,
  ) {}

  @ApiOperation({ summary: '내 프로필 조회' })
  @Get(UsersRouter.Http.GetMe)
  async getMe(@User() user: { id: number }): Promise<ProfileEntity> {
    return await this.getMeUseCase.execute({ userId: user.id });
  }

  @ApiOperation({ summary: '프로필 수정' })
  @Patch(UsersRouter.Http.UpdateProfile)
  async updateProfile(@User() user: { id: number }, @Body() bodyDto: UpdateProfileDto): Promise<ProfileEntity> {
    return await this.updateProfileUseCase.execute({ userId: user.id, bodyDto });
  }

  @ApiOperation({ summary: '비밀번호 변경' })
  @HttpCode(HttpStatus.OK)
  @Post(UsersRouter.Http.ChangePassword)
  async changePassword(@User() user: { id: number }, @Body() bodyDto: ChangePasswordDto): Promise<void> {
    await this.changePasswordUseCase.execute({ userId: user.id, bodyDto });
  }
}
