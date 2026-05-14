# Watchpoint

> *Quis custodiet ipsos custodes?* — 감시자들을 위한 감시 지점.

오버워치 패치노트와 영웅별 능력 상세 수치를 한곳에서 추적·열람하는 읽기 전용 공개 서비스.

## 기술 스택

| 영역 | 기술 |
|---|---|
| Monorepo | pnpm workspaces |
| Backend | NestJS, Prisma, PostgreSQL |
| Frontend | Next.js (App Router) |
| Cache | Redis (ioredis) |
| Scraper | undici + cheerio (필요 시 playwright) |
| Scheduler | @nestjs/schedule |
| CLI | nest-commander |
| CQRS | @nestjs/cqrs |
| API Docs | Scalar (`/docs`, 개발 환경만) |
| Linter | Biome |
| Package Manager | pnpm |

## 시작하기

### 1. 환경 변수 설정

```bash
cp .env.example .env
```

### 2. 인프라 실행

```bash
docker-compose up -d
```

| 서비스 | 포트 |
|---|---|
| PostgreSQL | 5432 |
| Redis | 6379 |

### 3. 의존성 설치 & DB 마이그레이션

```bash
pnpm install
pnpm db:migrate
pnpm db:generate
```

### 4. 개발 서버 실행

```bash
pnpm dev          # api + web 동시 실행
pnpm dev:api      # NestJS만
pnpm dev:web      # Next.js만
```

- API: http://localhost:3000
- API 문서: http://localhost:3000/docs
- Web: http://localhost:3001

### 5. 1차 시드 (패치노트 + 영웅)

```bash
pnpm patch:sync                       # 블리자드 패치노트 (2026-01부터)
pnpm hero:sync sierra                 # 단일 영웅
pnpm hero:sync:all                    # 전체 영웅
```

## 스크립트

```bash
pnpm dev               # api + web 동시 실행
pnpm build             # 전체 빌드
pnpm lint              # biome lint
pnpm check             # biome check (자동 수정)
pnpm test              # jest

pnpm db:migrate        # Prisma 마이그레이션
pnpm db:generate       # Prisma 클라이언트 생성

# 운영 CLI (apps/api)
pnpm patch:sync                       # 블리자드 패치노트 동기화
pnpm patch:list                       # PENDING_REVIEW 패치 조회
pnpm patch:review <version>           # 패치 보정
pnpm hero:sync <codename>             # 단일 영웅 동기화
pnpm hero:sync:all                    # 전체 영웅 동기화
pnpm hero:edit <codename>             # 영웅 수치/능력 수정
```

## 프로젝트 구조

```
watchpoint/
├── apps/
│   ├── api/              # NestJS — 공개 API + Cron + CLI
│   │   └── src/
│   │       ├── common/   # cqrs, exceptions, filters, prisma, redis
│   │       ├── hero/
│   │       ├── patch-note/
│   │       ├── scraper/
│   │       └── cli/
│   └── web/              # Next.js (App Router)
│       └── src/app/
│           ├── heroes/[codename]/
│           └── patch-notes/[version]/
├── packages/
│   └── shared/           # 공유 타입/DTO/enum
├── pnpm-workspace.yaml
├── docker-compose.yml
├── biome.json
├── SPEC.md
└── README.md
```

## 환경 변수

| 변수 | 설명 | 기본값 |
|---|---|---|
| `NODE_ENV` | 환경 (`local`\|`development`\|`production`) | `development` |
| `API_PORT` | NestJS 포트 | `3000` |
| `WEB_PORT` | Next.js 포트 | `3001` |
| `DATABASE_URL` | PostgreSQL 연결 URL | — |
| `REDIS_HOST` | Redis 호스트 | — |
| `REDIS_PORT` | Redis 포트 | `6379` |
| `REDIS_PASSWORD` | Redis 비밀번호 | — |
| `SCRAPER_USER_AGENT` | 스크래퍼 User-Agent | `WatchpointBot/0.1` |
| `SCRAPER_PATCH_CRON` | 패치노트 Cron 표현식 | `0 */6 * * *` |
| `WEB_API_BASE_URL` | Next.js → API 호출 base URL | `http://localhost:3000` |

## 데이터 출처

- 패치노트: [Overwatch 공식 패치노트](https://overwatch.blizzard.com/ko-kr/news/patch-notes/) (2026-01 이후)
- 영웅 정보: [나무위키](https://namu.wiki/) (CC BY-NC-SA 2.0 KR)

영웅 상세 페이지에는 항상 원본 출처 링크를 표기한다.
