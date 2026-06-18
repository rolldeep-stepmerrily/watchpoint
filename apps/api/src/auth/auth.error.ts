import { HttpStatus } from '@nestjs/common';

export const AUTH_ERRORS = {
  EMAIL_ALREADY_EXISTS: {
    statusCode: HttpStatus.CONFLICT,
    errorCode: 'AUTH_EMAIL_ALREADY_EXISTS',
    message: '이미 사용 중인 이메일입니다',
  },
  INVALID_CREDENTIALS: {
    statusCode: HttpStatus.UNAUTHORIZED,
    errorCode: 'AUTH_INVALID_CREDENTIALS',
    message: '이메일 또는 비밀번호가 올바르지 않습니다',
  },
  INVALID_REFRESH_TOKEN: {
    statusCode: HttpStatus.UNAUTHORIZED,
    errorCode: 'AUTH_INVALID_REFRESH_TOKEN',
    message: '유효하지 않은 리프레시 토큰입니다',
  },
  USER_NOT_FOUND: {
    statusCode: HttpStatus.NOT_FOUND,
    errorCode: 'AUTH_USER_NOT_FOUND',
    message: '사용자를 찾을 수 없습니다',
  },
  REVOKED_TOKEN: {
    statusCode: HttpStatus.UNAUTHORIZED,
    errorCode: 'AUTH_REVOKED_TOKEN',
    message: '이미 로그아웃된 토큰입니다',
  },
  FORBIDDEN: {
    statusCode: HttpStatus.FORBIDDEN,
    errorCode: 'AUTH_FORBIDDEN',
    message: '권한이 없습니다',
  },
} as const;
