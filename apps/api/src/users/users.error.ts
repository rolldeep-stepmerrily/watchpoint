import { HttpStatus } from '@nestjs/common';

export const USERS_ERRORS = {
  NOT_FOUND: {
    statusCode: HttpStatus.NOT_FOUND,
    errorCode: 'USER_NOT_FOUND',
    message: '사용자를 찾을 수 없습니다',
  },
  NO_PASSWORD: {
    statusCode: HttpStatus.BAD_REQUEST,
    errorCode: 'USER_NO_PASSWORD',
    message: '비밀번호 로그인을 사용하지 않는 계정입니다',
  },
  WRONG_PASSWORD: {
    statusCode: HttpStatus.UNAUTHORIZED,
    errorCode: 'USER_WRONG_PASSWORD',
    message: '현재 비밀번호가 올바르지 않습니다',
  },
  PASSWORD_SAME: {
    statusCode: HttpStatus.BAD_REQUEST,
    errorCode: 'USER_PASSWORD_SAME',
    message: '새 비밀번호가 현재 비밀번호와 동일합니다',
  },
} as const;
