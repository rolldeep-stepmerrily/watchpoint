import { ApiProperty } from '@nestjs/swagger';

import { USER_ROLES, type UserRoleValue } from './user.entity';

export class ProfileEntity {
  @ApiProperty()
  id!: number;

  @ApiProperty()
  email!: string;

  @ApiProperty({ nullable: true })
  name!: string | null;

  @ApiProperty({ nullable: true })
  avatarUrl!: string | null;

  @ApiProperty({ enum: USER_ROLES })
  role!: UserRoleValue;

  @ApiProperty({ description: '이메일/비밀번호 로그인 사용 여부' })
  hasPassword!: boolean;

  @ApiProperty()
  createdAt!: Date;
}
