import { HttpStatus } from '@nestjs/common';

export const PATCH_NOTE_ERRORS = {
  NOT_FOUND: {
    statusCode: HttpStatus.NOT_FOUND,
    errorCode: 'PATCH_NOTE_NOT_FOUND',
    message: '패치노트를 찾을 수 없습니다',
  },
} as const;
