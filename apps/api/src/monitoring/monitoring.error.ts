import { HttpStatus } from '@nestjs/common';

export const MONITORING_ERRORS = {
  FORBIDDEN: {
    statusCode: HttpStatus.FORBIDDEN,
    errorCode: 'MONITORING_FORBIDDEN',
    message: '모니터링 엔드포인트 접근 권한이 없습니다',
  },
  RATE_LIMITED: {
    statusCode: HttpStatus.TOO_MANY_REQUESTS,
    errorCode: 'MONITORING_RATE_LIMITED',
    message: '같은 kind의 로그는 10분 이내 1회만 적재할 수 있습니다',
  },
} as const;
