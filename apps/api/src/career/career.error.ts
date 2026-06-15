import { HttpStatus } from '@nestjs/common';

export const CAREER_ERRORS = {
  NOT_FOUND: {
    statusCode: HttpStatus.NOT_FOUND,
    errorCode: 'CAREER_NOT_FOUND',
    message: '해당 플레이어를 찾을 수 없거나 프로필이 비공개 상태입니다',
  },
  INVALID_PLAYER_ID: {
    statusCode: HttpStatus.BAD_REQUEST,
    errorCode: 'CAREER_INVALID_PLAYER_ID',
    message: 'playerId 형식이 올바르지 않습니다 (battletag는 # 대신 - 사용, 예: TeKrop-2217)',
  },
  UPSTREAM_UNAVAILABLE: {
    statusCode: HttpStatus.BAD_GATEWAY,
    errorCode: 'CAREER_UPSTREAM_UNAVAILABLE',
    message: '전적 조회 서비스가 일시적으로 응답하지 않습니다 (베타 기능)',
  },
  UPSTREAM_RATE_LIMITED: {
    statusCode: HttpStatus.TOO_MANY_REQUESTS,
    errorCode: 'CAREER_UPSTREAM_RATE_LIMITED',
    message: '전적 조회 요청이 일시적으로 제한되었습니다. 잠시 후 다시 시도해 주세요',
  },
} as const;
