import { TypedCommandBus, TypedQueryBus } from '@@cqrs';
import { AppException } from '@@exceptions';
import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { isDefined } from 'class-validator';

import { UserEntity } from '../../entities/user.entity';
import { ChangePasswordDto } from '../../presenter/http/dto/change-password.dto';
import { USERS_ERRORS } from '../../users.error';
import { UpdateUserPasswordCommand } from '../commands/update-user-password.command';
import { GetUserByIdQuery } from '../queries/get-user-by-id.query';

@Injectable()
export class ChangePasswordUseCase {
  constructor(
    private readonly commandBus: TypedCommandBus<UpdateUserPasswordCommand>,
    private readonly queryBus: TypedQueryBus<GetUserByIdQuery>,
  ) {}

  async execute(props: ChangePasswordUseCaseProps): Promise<void> {
    const { userId, bodyDto } = props;
    const { currentPassword, newPassword } = bodyDto;

    const user = await this.getUser(userId);

    await this.verifyCurrentPassword(currentPassword, user.password);
    await this.checkPasswordNotSame(newPassword, user.password);

    const hashedPassword = await this.hashPassword(newPassword);

    await this.updatePassword(userId, hashedPassword);
  }

  /**
   * ID로 사용자 조회 — 비밀번호가 설정된 경우만 반환
   *
   * @param {number} userId 사용자 ID
   * @returns {Promise<UserEntity & { password: string }>} 비밀번호가 있는 사용자 정보
   * @throws {AppException} 사용자를 찾을 수 없거나 비밀번호 로그인 미사용 계정인 경우
   */
  async getUser(userId: number): Promise<UserEntity & { password: string }> {
    const user = await this.queryBus.execute(new GetUserByIdQuery({ userId }));

    if (!isDefined(user?.password)) {
      throw new AppException(USERS_ERRORS.NO_PASSWORD);
    }

    return user as UserEntity & { password: string };
  }

  /**
   * 현재 비밀번호 검증
   *
   * @param {string} currentPassword 입력된 현재 비밀번호
   * @param {string} currentHash 저장된 비밀번호 해시
   * @throws {AppException} 비밀번호가 일치하지 않는 경우
   */
  async verifyCurrentPassword(currentPassword: string, currentHash: string): Promise<void> {
    const isMatch = await bcrypt.compare(currentPassword, currentHash);

    if (!isMatch) {
      throw new AppException(USERS_ERRORS.WRONG_PASSWORD);
    }
  }

  /**
   * 새 비밀번호가 현재 비밀번호와 동일한지 검사
   *
   * @param {string} newPassword 새 비밀번호
   * @param {string} currentHash 저장된 비밀번호 해시
   * @throws {AppException} 동일한 비밀번호인 경우
   */
  async checkPasswordNotSame(newPassword: string, currentHash: string): Promise<void> {
    const isSame = await bcrypt.compare(newPassword, currentHash);

    if (isSame) {
      throw new AppException(USERS_ERRORS.PASSWORD_SAME);
    }
  }

  /**
   * 비밀번호 해시
   *
   * @param {string} password 비밀번호
   * @returns {Promise<string>} 해시된 비밀번호
   */
  async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, 10);
  }

  /**
   * 비밀번호 업데이트
   *
   * @param {number} userId 사용자 ID
   * @param {string} hashedPassword 해시된 새 비밀번호
   */
  async updatePassword(userId: number, hashedPassword: string): Promise<void> {
    await this.commandBus.execute(new UpdateUserPasswordCommand({ userId, hashedPassword }));
  }
}

interface ChangePasswordUseCaseProps {
  userId: number;
  bodyDto: ChangePasswordDto;
}
