import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export class SignUpRequestBodyDto {
  @ApiProperty({ example: 'user@example.com', type: String })
  @IsEmail()
  @MaxLength(254)
  email!: string;

  @ApiProperty({ example: 'password123!', type: String, description: '영문/숫자/특수문자 포함 8자 이상' })
  @IsString()
  @Matches(/^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/)
  password!: string;

  @ApiProperty({ example: 'John Doe', required: false, type: String })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  name?: string;
}

export class SignUpResponseDataDto {
  @ApiProperty()
  @IsString()
  accessToken!: string;

  @ApiProperty()
  @IsString()
  refreshToken!: string;

  static from(data: SignUpResponseDataDto): SignUpResponseDataDto {
    return {
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
    };
  }
}
