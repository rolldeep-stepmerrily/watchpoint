// `.env`에 SENTRY_DSN을 둔 로컬/개발 환경에서도 Sentry.init이 동작하도록 dotenv를 먼저 로드.
// 이 파일은 main.ts 최상단에서 import되므로 NestJS ConfigModule이 env를 읽기 전에 process.env가 채워져야 한다.
import 'dotenv/config';
import * as Sentry from '@sentry/nestjs';

const dsn = process.env.SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV ?? 'development',
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 0,
    sendDefaultPii: false,
  });
}
