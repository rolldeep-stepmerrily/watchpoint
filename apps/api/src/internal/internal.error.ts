import { HttpStatus } from '@nestjs/common';

export const INTERNAL_ERRORS = {
  FORBIDDEN: {
    statusCode: HttpStatus.FORBIDDEN,
    errorCode: 'INTERNAL_FORBIDDEN',
    message: '내부 엔드포인트 접근 권한이 없습니다',
  },
} as const;
