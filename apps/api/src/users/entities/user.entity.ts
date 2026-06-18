import { BaseEntity } from '@@entities';
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsIn, IsNumber, IsOptional, IsString } from 'class-validator';

export type UserRoleValue = 'USER' | 'ADMIN';

export const USER_ROLES = ['USER', 'ADMIN'] as const satisfies readonly UserRoleValue[];

export class UserEntity extends BaseEntity {
  @ApiProperty()
  @IsNumber()
  id!: number;

  @ApiProperty()
  @IsEmail()
  email!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  name!: string | null;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  avatarUrl!: string | null;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  password!: string | null;

  @ApiProperty({ enum: USER_ROLES })
  @IsIn(USER_ROLES)
  role!: UserRoleValue;
}
