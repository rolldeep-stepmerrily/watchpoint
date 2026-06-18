import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class RefreshResponseDataDto {
  @ApiProperty()
  @IsString()
  accessToken!: string;

  @ApiProperty()
  @IsString()
  refreshToken!: string;

  static from(data: RefreshResponseDataDto): RefreshResponseDataDto {
    return {
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
    };
  }
}
