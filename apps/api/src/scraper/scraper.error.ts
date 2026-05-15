import { HttpStatus } from '@nestjs/common';

export const SCRAPER_ERRORS = {
  FETCH_FAILED: {
    statusCode: HttpStatus.BAD_GATEWAY,
    errorCode: 'SCRAPER_FETCH_FAILED',
    message: '원격 페이지 응답 실패',
  },
  PARSE_FAILED: {
    statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    errorCode: 'SCRAPER_PARSE_FAILED',
    message: '응답 본문 파싱 실패',
  },
  TARGET_NOT_FOUND: {
    statusCode: HttpStatus.NOT_FOUND,
    errorCode: 'SCRAPER_TARGET_NOT_FOUND',
    message: '대상 영웅/패치를 페이지에서 찾을 수 없음',
  },
} as const;
