import { HttpStatus } from '@nestjs/common';

export const INTERNAL_ERRORS = {
  FORBIDDEN: {
    statusCode: HttpStatus.FORBIDDEN,
    errorCode: 'INTERNAL_FORBIDDEN',
    message: '내부 엔드포인트는 로컬에서만 접근 가능합니다',
  },
} as const;
