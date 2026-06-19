import { HttpStatus } from '@nestjs/common';

export const BOOKMARK_ERRORS = {
  LIMIT_REACHED: {
    statusCode: HttpStatus.CONFLICT,
    errorCode: 'BOOKMARK_LIMIT_REACHED',
    message: '북마크 한도를 초과했습니다',
  },
  NOT_FOUND: {
    statusCode: HttpStatus.NOT_FOUND,
    errorCode: 'BOOKMARK_NOT_FOUND',
    message: '북마크를 찾을 수 없습니다',
  },
} as const;

export const BOOKMARK_LIMIT_PER_KIND = 100;
