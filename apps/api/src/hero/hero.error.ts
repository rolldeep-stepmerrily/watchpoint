import { HttpStatus } from '@nestjs/common';

export const HERO_ERRORS = {
  NOT_FOUND: {
    statusCode: HttpStatus.NOT_FOUND,
    errorCode: 'HERO_NOT_FOUND',
    message: '영웅을 찾을 수 없습니다',
  },
} as const;
