import 'dotenv/config';
import { defineConfig } from 'prisma/config';

// DATABASE_URL은 migrate/push/studio 등 DB 연결이 필요한 명령에서만 필수.
// prisma generate는 DB 연결 없이 실행되므로 undefined여도 무방.
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
