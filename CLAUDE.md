# Watchpoint

> *Quis custodiet ipsos custodes?*

오버워치 패치노트와 영웅별 능력 상세 수치를 한곳에서 추적·열람하는 읽기 전용 공개 서비스. 자세한 도메인/API 명세는 [`SPEC.md`](./SPEC.md), 실행 방법은 [`README.md`](./README.md) 참고.

## 모노레포 구조

```
watchpoint/
├── apps/
│   ├── api/                 # NestJS — 공개 API + Cron 스크래퍼 + 운영 CLI
│   │   └── src/
│   │       ├── app.module.ts
│   │       ├── main.ts
│   │       ├── common/      # cqrs, decorators, exceptions, filters, interceptors, prisma, redis
│   │       ├── hero/
│   │       ├── patch-note/
│   │       ├── scraper/
│   │       └── cli/
│   └── web/                 # Next.js (App Router) — RSC 기반 정적 화면
│       └── src/app/
│           ├── heroes/[codename]/
│           └── patch-notes/[version]/
├── packages/
│   └── shared/              # BE/FE 공유 enum/DTO 타입
├── prisma/                  # apps/api 내부 또는 루트 — schema.prisma
├── docker-compose.yml       # PostgreSQL + Redis
└── pnpm-workspace.yaml
```

## 에이전트 & 스킬

| 이름 | 경로 | 용도 |
|------|------|------|
| `code-reviewer` | `.claude/agents/code-reviewer.md` | 코드 리뷰 |
| `general-convention` | `.claude/skills/code-convention/general-convention/SKILL.md` | TS 코딩 컨벤션 |
| `jsdoc-convention` | `.claude/skills/code-convention/jsdoc-convention/SKILL.md` | JSDoc 작성 규칙 |
| `commit-convention` | `.claude/skills/git-convention/commit-convention/SKILL.md` | 커밋/브랜치 컨벤션 |
| `pull-request-convention` | `.claude/skills/git-convention/pull-request-convention/SKILL.md` | PR 생성 워크플로우 |
| `nestjs-cqrs` | `.claude/skills/be-convention/nestjs-cqrs/SKILL.md` | NestJS CQRS + UseCase 아키텍처 패턴 (`apps/api`) |

## Git 브랜치 전략

- **PR base 브랜치**: 항상 `develop` (핫픽스/릴리스만 `main`)

## 패키지 매니저

**pnpm workspace** 사용. npm/yarn 사용 금지. 워크스페이스 루트에서 다음 스크립트로 양 앱 제어:

```bash
pnpm install
pnpm dev               # api + web 동시 실행
pnpm dev:api / dev:web # 개별 실행
pnpm build
pnpm lint
pnpm check
pnpm db:migrate
pnpm db:generate

# 운영 CLI (apps/api)
pnpm patch:sync                       # 블리자드 패치노트 동기화
pnpm patch:list
pnpm patch:review <version>
pnpm hero:sync <codename>
pnpm hero:sync:all
pnpm hero:edit <codename>
```

## 기술 스택

| 영역 | 기술 |
|---|---|
| Backend | NestJS, Prisma, PostgreSQL, Redis |
| Frontend | Next.js (App Router) |
| CQRS | @nestjs/cqrs |
| Scheduler | @nestjs/schedule (블리자드 패치노트 6시간 Cron) |
| Scraper | undici + cheerio (필요 시 playwright) |
| CLI | nest-commander (운영 보정 명령어) |
| Cache / Lock | ioredis |
| API Docs | Scalar (`/docs`, 개발 환경만) |
| 공유 타입 | `packages/shared` (BE/FE 양쪽 import) |

## Biome 설정

- indent: 2 spaces, lineWidth: 120, quote: single, trailingCommas: all, semicolons: always
- `apps/api`: `*.strategy.ts`, `*.controller.ts`, `*.service.ts`, `*.error.ts` → `useExplicitType: error`
- `apps/web`: jsx 더블쿼터, `noConsole` off (Next.js 디버그 허용)

## 인증/권한 정책

**v1은 인증 없음.** 공개 API + 읽기 전용. 데이터 보정은 HTTP가 아닌 **`apps/api`의 nest-commander CLI로만** 가능. admin HTTP 엔드포인트를 추가하지 말 것.

---

## NestJS 아키텍처 (`apps/api`)

### Path Aliases

ticketing 컨벤션 그대로 `apps/api/tsconfig.json`에 정의. import는 항상 alias 우선.

```typescript
import { AppException, GLOBAL_ERRORS } from '@@exceptions';
import { BaseEntity } from '@@entities';
import { TypedCommandBus, TypedQueryBus } from '@@cqrs';
import { RedisService } from '@@redis';
import { PrismaService } from '@@db';
import { PrismaClient } from '@@prisma';
```

### CQRS + UseCase 패턴

엔드포인트 1개 = UseCase 1개 (1:1 대응). 자세한 규칙은 `nestjs-cqrs` 스킬 참고.

```
apps/api/src/<feature>/
├── <feature>.module.ts
├── <feature>.error.ts
├── presenter/
│   └── http/
│       ├── <feature>.http.controller.ts
│       ├── <feature>.path.presenter.ts
│       └── dto/
└── application/
    ├── use-cases/
    ├── commands/
    └── queries/
```

### 에러 처리

`AppException` 사용 통일. `new Error()` / `HttpException` 직접 사용 금지.

```typescript
// apps/api/src/<feature>/<feature>.error.ts
export const HERO_ERRORS = {
  NOT_FOUND: {
    statusCode: HttpStatus.NOT_FOUND,
    errorCode: 'HERO_NOT_FOUND',
    message: 'Hero not found',
  },
};

throw new AppException(HERO_ERRORS.NOT_FOUND);
```

### 스크래퍼 패턴

- **자동(Cron)**: 블리자드 패치노트만. `@Cron(SCRAPER_PATCH_CRON)` 6시간 주기.
- **수동(CLI)**: 나무위키 영웅 동기화 (`pnpm hero:sync <codename>`). 일괄 자동 크롤링 금지(차단 리스크).
- 모든 스크래핑은 `ScrapeJob` 레코드를 남김 — RUNNING/SUCCESS/FAILED/SKIPPED.
- HTTP fetch는 `undici` + `cheerio` 우선. 동적 렌더링 필요 시에만 `playwright`.
- 단일 도메인 동시 요청 1, 요청 간 최소 2초 (`SCRAPER_REQUEST_DELAY_MS`).
- User-Agent는 항상 `SCRAPER_USER_AGENT`로 명시.
- 자동 매핑 실패 패치는 `PatchNote.status=PENDING_REVIEW`로 격리, CLI로 보정 후 PUBLISHED 승격.

### 캐시 전략

- 영웅 상세 5분 / 패치노트 목록 1분 / 패치노트 상세 10분 TTL.
- Next.js ISR `revalidate=3600`. 새 패치 적재 시 web의 `revalidatePath` 호출.

### 환경 변수

새 env 변수는 `app.module.ts` Joi 스키마에 반드시 추가.

```typescript
this.configService.getOrThrow<string>('MY_ENV');
```

## Docker

```bash
docker-compose up -d    # PostgreSQL + Redis 실행
```

---

## Next.js 가이드 (`apps/web`)

- App Router + RSC. 데이터 페치는 서버 컴포넌트에서 NestJS API 직접 호출 (`WEB_API_BASE_URL`).
- 정적 페이지는 ISR (`export const revalidate = 3600`).
- 클라이언트 컴포넌트는 인터랙션 필요한 곳만 (`'use client'` 최소화).
- 공유 타입은 `packages/shared`에서 import — Prisma 모델을 직접 web에서 참조하지 말 것.

## packages/shared

- `enums/`: `HeroRole`, `AbilitySlot`, `EntryCategory`, `ScrapeStatus` 등
- `dto/`: 외부 노출 응답 타입 (`HeroDto`, `PatchNoteDto`)
- BE는 응답 직전 Prisma 모델 → DTO 변환. FE는 DTO만 신뢰.

## 데이터 출처 / 라이선스

- 패치노트: [Overwatch 공식](https://overwatch.blizzard.com/ko-kr/news/patch-notes/) (2026-01 이후)
- 영웅 정보: [나무위키](https://namu.wiki/) — CC BY-NC-SA 2.0 KR. 영웅 상세 페이지에 `sourceUrl` 항상 노출.
