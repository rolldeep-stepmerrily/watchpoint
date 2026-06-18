import { TypedQueryBus } from '@@cqrs';
import { AppException } from '@@exceptions';
import { Injectable } from '@nestjs/common';
import { isDefined } from 'class-validator';

import { ProfileEntity } from '../../entities/profile.entity';
import { UserEntity } from '../../entities/user.entity';
import { USERS_ERRORS } from '../../users.error';
import { GetUserByIdQuery } from '../queries/get-user-by-id.query';

@Injectable()
export class GetMeUseCase {
  constructor(private readonly queryBus: TypedQueryBus<GetUserByIdQuery>) {}

  async execute(props: GetMeUseCaseProps): Promise<ProfileEntity> {
    const { userId } = props;

    const user = await this.getUser(userId);

    return this.buildProfileEntity(user);
  }

  /**
   * ID로 사용자 조회
   *
   * @param {number} userId 사용자 ID
   * @returns {Promise<UserEntity>} 사용자 정보
   * @throws {AppException} 사용자를 찾을 수 없는 경우
   */
  async getUser(userId: number): Promise<UserEntity> {
    const user = await this.queryBus.execute(new GetUserByIdQuery({ userId }));

    if (!isDefined(user)) {
      throw new AppException(USERS_ERRORS.NOT_FOUND);
    }

    return user;
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

interface GetMeUseCaseProps {
  userId: number;
}
