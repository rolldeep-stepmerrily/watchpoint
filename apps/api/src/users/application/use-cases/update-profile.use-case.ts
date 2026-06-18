import { TypedCommandBus } from '@@cqrs';
import { Injectable } from '@nestjs/common';
import { isDefined } from 'class-validator';

import { ProfileEntity } from '../../entities/profile.entity';
import { UserEntity } from '../../entities/user.entity';
import { UpdateProfileDto } from '../../presenter/http/dto/update-profile.dto';
import { UpdateUserProfileCommand } from '../commands/update-user-profile.command';

@Injectable()
export class UpdateProfileUseCase {
  constructor(private readonly commandBus: TypedCommandBus<UpdateUserProfileCommand>) {}

  async execute(props: UpdateProfileUseCaseProps): Promise<ProfileEntity> {
    const { userId, bodyDto } = props;

    const user = await this.updateProfile(userId, bodyDto);

    return this.buildProfileEntity(user);
  }

  /**
   * 프로필 정보 수정
   *
   * @param {number} userId 사용자 ID
   * @param {UpdateProfileDto} dto 수정할 프로필 정보
   * @returns {Promise<UserEntity>} 수정된 사용자 정보
   */
  async updateProfile(userId: number, dto: UpdateProfileDto): Promise<UserEntity> {
    return await this.commandBus.execute(
      new UpdateUserProfileCommand({ userId, name: dto.name, avatarUrl: dto.avatarUrl }),
    );
  }

  /**
   * 프로필 엔티티 생성
   *
   * @param {UserEntity} user 사용자 정보
   * @returns {ProfileEntity} 프로필 엔티티
   */
  buildProfileEntity(user: UserEntity): ProfileEntity {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      role: user.role,
      hasPassword: isDefined(user.password),
      createdAt: user.createdAt,
    };
  }
}

interface UpdateProfileUseCaseProps {
  userId: number;
  bodyDto: UpdateProfileDto;
}
