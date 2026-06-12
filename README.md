# Watchpoint

> *Quis custodiet ipsos custodes?* — 감시자들을 위한 감시 지점.

오버워치 패치노트와 영웅별 능력 상세 수치를 한곳에서 추적·열람하는 읽기 전용 공개 서비스. Blizzard 공식 페이지를 1차 출처로 자동 스크래핑하고, 한국어 명칭/아이콘 공백/영웅 국적 등은 나무위키(CC BY-NC-SA 2.0 KR)로 보강. 패치마다 변경 이력을 audit으로 남겨 영웅별 사양 history를 추적합니다.

## 데모

| | |
|---|---|
| 🌐 Web | [o-watchpoint.com](https://o-watchpoint.com) |
| 🔌 API | [api.o-watchpoint.com](https://api.o-watchpoint.com) |
| 🖼 CDN | `cdn.o-watchpoint.com/watchpoint-icons/...` (MinIO S3) |

---

## 핵심 특징

- **무인 자동 적재**: `@nestjs/schedule` Cron이 6시간마다 신규 패치 감지 → 한국어 + 영문 sync 자동 실행 (`BlizzardPatchScraper` → `BlizzardPatchEnScraper`).
- **Boot-Seeder 4-phase**: API 부팅 시 데이터 부족(`hero.blizzardId` 비율 < 80%) 감지하면 한국어 → 영문 → portrait → icon 4단계 백그라운드 시드 (약 25분).
- **변경 이력 audit**: 패치별 능력 수치 diff를 `HeroStatRevision` / `hero_change_logs`에 자동 기록.
- **이중 출처 + blizzardId 매핑**: 한국어 sync 시 `ability.blizzardId` 저장 → 영문 sync는 blizzardId 매칭으로 자동 i18n.
- **격리된 PENDING_REVIEW**: 스크래퍼 자동 매핑 실패 패치는 격리, nest-commander CLI(`pnpm patch:review <version>`)로 보정 후 PUBLISHED 승격.
- **이중 출처 + 라이선스 명시**: Blizzard 공식이 1차 출처(영웅 stat/ability/패치노트). 나무위키는 한국어 명칭 우선/아이콘 fallback/국적 등 보강(CC BY-NC-SA 2.0 KR — 비영리 운영 확정).

---

## 아키텍처

```
                 사용자 (브라우저)
                       │
        ┌──────────────┴──────────────┐
        ▼                              ▼
  Vercel (Next.js Web)         Sentry (에러 트래커)
  o-watchpoint.com              · NEXT_PUBLIC_SENTRY_DSN
        │                       · 5xx + render error capture
        │ RSC fetch
        ▼
  Railway (NestJS API)         ─►  Sentry (Node SDK)
  api.o-watchpoint.com              · cron 실패 captureException(phase 태그)
   │     │      │                   · HttpExceptionFilter 5xx capture
   │     │      │
   │     │      └─► MinIO (S3-호환)
   │     │           cdn.o-watchpoint.com  ◄── 영웅/능력/특전 아이콘 523개
   │     │
   │     └─► Redis (ioredis)
   │          · ResponseCache TTL + Throttler storage
   │
   └─► PostgreSQL (Prisma 7)
        · heroes 51 / abilities 264 / perks 204 / patches / change-logs

[Cron 6h]
  └─► Blizzard 공식 페이지
       · overwatch.blizzard.com/ko-kr/news/patch-notes/
       · overwatch.blizzard.com/en-us/news/patch-notes/
       · overwatch.blizzard.com/{locale}/heroes/{codename}/
```

- **Cron 자동화**: `BlizzardPatchCron` (6h) → 한국어 sync → 영문 sync, 둘은 try/catch 분리(한쪽 실패해도 다른 쪽 시도).
- **Boot-Seeder**: `AUTO_SEED_ON_BOOT=true`일 때 `OnApplicationBootstrap`에서 백그라운드 4-phase 시드.
- **캐시**: 영웅 상세 5분 / 패치 목록 1분 / 패치 상세 10분 TTL. 신규 patch 적재 시 전체 invalidate.

---

## 기술 스택

### Backend (`apps/api`)
- **NestJS** + `@nestjs/cqrs` UseCase 패턴 (엔드포인트 1개 = UseCase 1개 1:1)
- **Prisma 7** (PostgreSQL) — type-safe ORM, `@deprecated` 어노테이션으로 enum 점진 폐기
- **Redis** (`ioredis`) — `ResponseCache` + `ThrottlerStorage`
- **`@nestjs/schedule`** — Cron 6시간 주기 + boot lifecycle hook
- **`nest-commander`** — 운영 보정용 CLI (`pnpm patch:sync`, `pnpm hero:edit` 등)
- **`undici` + `cheerio`** — Blizzard 공식 페이지 스크래핑 (동적 렌더링 필요 시 `playwright` fallback 준비됨)
- **Joi** — env validation schema
- **Scalar** (`/docs`, 개발 환경) — Swagger UI 대체

### Frontend (`apps/web`)
- **Next.js 15** (App Router) + RSC 기반 정적/동적 렌더링
- **TypedRoutes** — type-safe routing
- **`generateMetadata`** per route + JSON-LD 구조화 데이터 (WebSite/ItemList/BreadcrumbList/Article)
- **`opengraph-image`** 동적 생성 (홈/hero/patch) — Pretendard 폰트 + 브랜드 색상
- **PWA manifest** + 동적 favicon

### 인프라 / 배포
| 컴포넌트 | 호스팅 | 도메인 |
|---|---|---|
| API | Railway | `api.o-watchpoint.com` |
| Web | Vercel | `o-watchpoint.com` |
| PostgreSQL | Railway (Managed) | private + public proxy |
| Redis | Railway (Managed) | private |
| MinIO (S3 호환) | Railway | `cdn.o-watchpoint.com` (port 9000) |
| DNS | 가비아 | A / CNAME / TXT verification |
| TLS | Let's Encrypt | Railway/Vercel 자동 발급 |

### 관측성 (Observability)
- **Sentry** — `@sentry/nestjs` + `@sentry/nextjs`, DSN 없으면 silent, production `tracesSampleRate: 0.1`
  - API: `instrument.ts` 최상단 init + `HttpExceptionFilter` 5xx + `BlizzardPatchCron` 실패 phase 태그 capture
  - Web: `sentry.{client,server,edge}.config.ts` + `instrumentation.ts` + `withSentryConfig` wrap, `tunnelRoute: '/monitoring'` (adblock 우회)

### CI/CD
- **GitHub Actions** — lint(biome) + typecheck + build, PR마다 자동
- **Vercel** — `main` push 시 자동 prod 배포 (`apps/web/vercel.json` monorepo 설정)
- **Railway** — `main` push 시 자동 prod 배포 (`railway.json` Nixpacks)
- **Dependabot** — 매주 월요일 09:00 KST 자동 PR (target: develop)
  - npm + github-actions ecosystem
  - 카테고리 group: `sentry` / `nestjs` / `prisma` / `nextjs` / `types` / `biome`

### Developer Tooling
- **Biome** — lint + format (indent 2, lineWidth 120, single quote, trailingCommas all)
- **pnpm workspaces** — monorepo (`apps/*`, `packages/*`)
- **Claude Code MCP servers**:
  - `mcp.railway.com` (HTTP) — env vars / deploy / logs 자동화
  - `mcp.vercel.com` (HTTP, read-only) — 배포 조회 / 로그
  - `ghcr.io/github/github-mcp-server` (Docker) — PR / 이슈 관리
  - `@modelcontextprotocol/server-postgres` (stdio, readonly role) — prod DB 안전 조회

### 공유 코드
- **`packages/shared`** — BE/FE 양쪽이 import하는 enum/DTO. Prisma 모델은 web에서 직접 참조 금지, 응답 직전 DTO 변환.

---

## 핵심 기술 결정

### CQRS + UseCase 1:1 패턴
컨트롤러는 얇은 presenter, 비즈니스 로직은 Command/Query handler 1개에 격리. handler가 비대해지면 분기 신호로 해석 → 자연스러운 모듈 분리 강제.

### Prisma 7 + 점진적 enum 폐기
나무위키 출처 제거 시 `ScrapeSource.NAMUWIKI_HERO` enum value는 기존 `ScrapeJob` row 호환 위해 `/// @deprecated` 주석만 추가하고 schema 유지 — DB 마이그레이션 충돌 없이 코드 cleanup.

### Boot-Seeder vs Cron 분리
- **Boot-Seeder**: 데이터 부족 감지 (`abilities.blizzardId` 비율 < 80%) → 백그라운드 4-phase 시드. 새 환경/마이그레이션 후 자동 채움.
- **Cron**: 정기 신규 패치 감지. 영웅 데이터는 cron이 sync (patch.syncAffectedHeroes).
- 두 시스템이 같은 scraper를 호출하지만 트리거 조건 분리 → 운영 환경에서 의도치 않은 폭주 방지.

### Blizzard 공식 단일 출처
나무위키(CC BY-NC-SA NC 조건)에서 Blizzard 공식으로 데이터 출처 일원화. 향후 광고/수익화 시 라이선스 위반 회피. Blizzard Fan Content Policy는 회색지대지만 NC 조항보다는 안전.

### MinIO 자체 cdn
영웅/능력/특전 아이콘 523개를 MinIO에 자체 호스팅 (S3 호환). Vercel/Railway 트래픽 비용 절감 + 외부 image host (`i.namu.wiki`) 의존 제거. `pnpm assets:upload` CLI가 멱등 업로드 + DB URL 일괄 교체.

### 한국어 sync 시 blizzardId 저장 → 영문 자동 매핑
영웅/능력에 `blizzardId`를 저장해두면 영문 sync 시 (1) blizzardId 매칭 → (2) override → (3) fallback 순서로 자동 i18n. 영웅 이름 변경에도 견고.

---

## 시작하기

### 사전 요구사항
- Node.js 22+, pnpm 9+
- Docker Desktop (PostgreSQL + Redis)

### 셋업
```bash
# 1. env 설정
cp .env.example .env

# 2. 인프라 (PG + Redis)
docker-compose up -d

# 3. 의존성 + 마이그레이션
pnpm install
pnpm db:migrate && pnpm db:generate

# 4. 개발 서버
pnpm dev          # api + web 동시
pnpm dev:api      # NestJS 단독 (port 3000)
pnpm dev:web      # Next.js 단독 (port 3001)
```

| 엔드포인트 | URL |
|---|---|
| API | http://localhost:3000 |
| API Docs (Scalar) | http://localhost:3000/docs |
| Web | http://localhost:3001 |

### 1차 시드
```bash
pnpm patch:sync          # Blizzard 패치노트 (2026-01 이후)
pnpm hero:sync:all       # 영웅 전체 (Blizzard 한국어 페이지)
```

또는 `.env`에 `AUTO_SEED_ON_BOOT=true` 설정 후 API 부팅하면 boot-seeder가 백그라운드로 4-phase 자동 실행 (약 25분).

---

## 운영 CLI

```bash
# 패치노트
pnpm patch:sync                       # 최신 페이지만 동기화
pnpm patch:sync:en                    # 영문 보강 (cron이 자동, 디버깅용)
pnpm patch:backfill                   # 페이지네이션 따라 과거 패치 백필
pnpm patch:list                       # PENDING_REVIEW 패치 조회
pnpm patch:review <version>           # 패치 보정 후 PUBLISHED 승격

# 영웅
pnpm hero:sync <codename>             # 단일 영웅 강제 sync
pnpm hero:sync:all                    # 전체 영웅 sync (Blizzard CDN throttle 2초)
pnpm hero:edit <codename>             # 수치/능력 수동 보정
```

---

## 환경 변수

| 변수 | 설명 | 기본값 |
|---|---|---|
| `NODE_ENV` | `local` / `development` / `production` | `development` |
| `API_PORT` | NestJS 포트 (Railway는 `PORT` 자동 주입) | `3000` |
| `DATABASE_URL` | PostgreSQL 연결 URL | — |
| `REDIS_HOST` / `REDIS_PORT` / `REDIS_PASSWORD` | Redis | — |
| `SCRAPER_PATCH_CRON` | 패치노트 Cron | `0 */6 * * *` |
| `SCRAPER_CRON_ENABLED` | Cron 활성 여부 (prod=true, local=false) | `false` |
| `SCRAPER_REQUEST_DELAY_MS` | Blizzard 요청 간 throttle | `2000` |
| `AUTO_SEED_ON_BOOT` | 부팅 시 자동 시드 | `false` |
| `INTERNAL_API_KEY` | `/internal/*` 보호 (옵션, 16자+) | — |
| `MINIO_ENDPOINT` / `MINIO_ACCESS_KEY` / `MINIO_SECRET_KEY` / `MINIO_BUCKET` / `MINIO_PUBLIC_URL` | MinIO | — |
| `SENTRY_DSN` | Sentry API DSN (비어 있으면 silent) | — |
| `WEB_REVALIDATE_URL` | API → Web ISR invalidate 대상 URL (예: `https://o-watchpoint.com`) | — |
| `WEB_REVALIDATE_SECRET` | API ↔ Web 공유 시크릿 (`x-revalidate-secret`, 16자+) | — |
| `WEB_API_BASE_URL` | Web → API base URL | `http://localhost:3000` |
| `WEB_PUBLIC_URL` | Web canonical URL (sitemap/OG) | `http://localhost:3001` |
| `NEXT_PUBLIC_SENTRY_DSN` | Sentry Web DSN (build-time inline) | — |
| `WEB_GOOGLE_SITE_VERIFICATION` / `WEB_NAVER_SITE_VERIFICATION` | Search Console verification | — |

---

## 프로젝트 구조

```
watchpoint/
├── apps/
│   ├── api/                # NestJS
│   │   └── src/
│   │       ├── common/     # cqrs, cache, exceptions, filters, prisma, redis, throttler
│   │       ├── hero/
│   │       ├── patch-note/
│   │       ├── scraper/    # blizzard, minio, common
│   │       ├── cli/        # nest-commander commands
│   │       ├── seeder/     # boot-seeder
│   │       ├── instrument.ts  # Sentry init (최상단 import)
│   │       └── main.ts
│   └── web/                # Next.js (App Router)
│       └── src/app/
│           ├── heroes/[codename]/
│           ├── patch-notes/[version]/
│           ├── opengraph-image.tsx
│           ├── manifest.ts
│           └── layout.tsx
├── packages/
│   └── shared/             # BE/FE 공유 enum/DTO
├── .github/
│   ├── workflows/          # CI
│   └── dependabot.yml
├── docker-compose.yml
├── pnpm-workspace.yaml
├── biome.json
└── prisma.config.ts
```

---

## 추가 문서

- [SPEC.md](./SPEC.md) — 도메인 모델 + API 명세
- [CLAUDE.md](./CLAUDE.md) — 개발 컨벤션 (CQRS/에러처리/스크래퍼/캐시/Sentry)

---

## 데이터 출처 / 라이선스

- 패치노트: [Overwatch 공식 패치노트](https://overwatch.blizzard.com/ko-kr/news/patch-notes/) (2026-01 이후)
- 영웅 정보: [Overwatch 공식 영웅 페이지](https://overwatch.blizzard.com/ko-kr/heroes/) — 한국어/영문 양쪽

영웅 상세 페이지에는 항상 원본 출처 링크(`sourceUrl`)를 표기합니다. 본 사이트는 Blizzard Entertainment와 무관한 비공식 팬 프로젝트이며, 모든 영웅명/이미지/상표의 권리는 Blizzard Entertainment에 있습니다.
