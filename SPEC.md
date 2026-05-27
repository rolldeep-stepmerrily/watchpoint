# Watchpoint — 기술 명세

> *Quis custodiet ipsos custodes?* — 감시자들을 위한 감시 지점.

오버워치 패치노트와 영웅별 능력 상세 수치를 한곳에서 추적·열람할 수 있는 읽기 전용 공개 서비스.

---

## 개요

- **목표**: 블리자드 공식 패치노트와 영웅별 능력 수치를 정기적으로 수집·정규화하여 빠른 조회와 영웅별 패치 이력 추적을 제공.
- **범위(v1)**: 패치노트(2026-01 이후) + 모든 영웅의 기본 능력/수치.
- **비범위(v1)**: 유저 인증, 댓글, 즐겨찾기, 통계/메타 분석, 토너먼트/프로 씬 데이터.
- **데이터 적재 정책**: 1차 시드는 나무위키(영웅) + 블리자드(패치노트)를 스크래핑, 이후 Cron이 주기적으로 신규 패치를 감지·적재. 자동 매핑 실패 건은 `PENDING_REVIEW`로 격리하여 admin CLI로 보정.

---

## 도메인 모델

### Hero
| 필드 | 타입 | 설명 |
|---|---|---|
| id | Int | PK |
| codename | String | 영문 식별자 (URL slug, unique) — 예: `sierra` |
| name | String | 한글 영웅명 — 예: `시에라` |
| role | HeroRole | `TANK` / `DAMAGE` / `SUPPORT` |
| releasedAt | DateTime | 출시일 |
| portraitUrl | String? | 초상화 이미지 URL |
| description | String? | 영웅 소개 |
| sourceUrl | String? | 1차 출처 (나무위키 등) |

### HeroStat
영웅 기본 수치(체력 구성/이동 속도 등). 패치마다 갱신 가능하므로 history는 `HeroStatRevision`으로 별도 보관.

| 필드 | 타입 | 설명 |
|---|---|---|
| id | Int | PK |
| heroId | Int | 영웅 FK (unique — 1:1) |
| health | Int | 일반 체력 |
| armor | Int | 방어구 |
| shield | Int | 보호막 |
| moveSpeed | Float | 이동 속도 (m/s) |
| extras | Json | 영웅별 특수 수치 (예: 부스트 속도, 브레이크 시간 등) |

### HeroAbility
| 필드 | 타입 | 설명 |
|---|---|---|
| id | Int | PK |
| heroId | Int | 영웅 FK |
| slot | AbilitySlot | `PASSIVE` / `PRIMARY` / `SECONDARY` / `ABILITY_1` / `ABILITY_2` / `ULTIMATE` |
| key | String? | 키 바인드 표기 — 예: `LMB`, `RMB`, `Shift`, `E`, `Q` |
| name | String | 능력명 |
| description | String | 설명 |
| stats | Json | 데미지/쿨다운/사거리/탄창 등 정형 수치 |
| order | Int | 표시 순서 |

`(heroId, slot, order)` unique.

### HeroStatRevision
패치 적용 이력. 영웅 수치/능력이 어떤 패치에서 어떻게 변했는지 추적.

| 필드 | 타입 | 설명 |
|---|---|---|
| id | Int | PK |
| heroId | Int | 영웅 FK |
| patchNoteId | Int | 패치노트 FK |
| diff | Json | 변경 전/후 비교 (예: `{ "ability:fireBlast.damage": { "from": 80, "to": 90 } }`) |
| appliedAt | DateTime | 적용 시각 |

### PatchNote
| 필드 | 타입 | 설명 |
|---|---|---|
| id | Int | PK |
| version | String | 패치 식별자 (예: `2026.01.14`) — unique |
| title | String | 패치 제목 |
| releasedAt | DateTime | 공식 발표일 |
| sourceUrl | String | 블리자드 원본 URL — unique |
| summary | String? | 헤드라인 요약 |
| status | PatchNoteStatus | `DRAFT` / `PUBLISHED` / `PENDING_REVIEW` |

### PatchNoteEntry
패치노트의 개별 항목(영웅 1명 단위 또는 일반 항목 단위로 쪼갠 것).

| 필드 | 타입 | 설명 |
|---|---|---|
| id | Int | PK |
| patchNoteId | Int | 패치노트 FK |
| category | EntryCategory | `HERO_BALANCE` / `BUG_FIX` / `MAP` / `SYSTEM` / `GENERAL` |
| heroId | Int? | 영웅 관련 항목인 경우 FK (없으면 일반 항목) |
| title | String | 항목 제목 (예: `시에라` / `궁극기 충전 속도 조정`) |
| body | String | 본문 (마크다운) |
| order | Int | 표시 순서 |

### ScrapeJob
스크래핑 실행 로그. 멱등성 보장 및 운영 가시성용.

| 필드 | 타입 | 설명 |
|---|---|---|
| id | Int | PK |
| source | ScrapeSource | `BLIZZARD_PATCH_NOTES` / `NAMUWIKI_HERO` |
| target | String | 대상 식별자 (URL 또는 영웅 codename) |
| status | ScrapeStatus | `RUNNING` / `SUCCESS` / `FAILED` / `SKIPPED` |
| startedAt | DateTime | 시작 시각 |
| finishedAt | DateTime? | 종료 시각 |
| error | String? | 실패 사유 |
| diffSummary | Json? | 변경 요약 (신규/수정/삭제 카운트) |

---

## API 명세

모든 엔드포인트는 **인증 불필요**, 응답은 전역 `TransformInterceptor`로 래핑된다.

### Heroes

| Method | Path | 설명 |
|---|---|---|
| `GET` | `/heroes` | 영웅 목록 (`?role=TANK\|DAMAGE\|SUPPORT`, `?q=` 이름 검색) |
| `GET` | `/heroes/:codename` | 영웅 상세 (기본 정보 + stats + abilities) |
| `GET` | `/heroes/:codename/abilities` | 능력 목록만 |
| `GET` | `/heroes/:codename/patch-history` | 해당 영웅이 등장한 패치 이력 (최신순) |

### Patch Notes

| Method | Path | 설명 |
|---|---|---|
| `GET` | `/patch-notes` | 패치노트 목록 (페이지네이션, 최신순) |
| `GET` | `/patch-notes/latest` | 가장 최근 패치노트 1건 |
| `GET` | `/patch-notes/:version` | 패치노트 상세 (모든 entry 포함) |
| `GET` | `/patch-notes/:version/entries` | entry 목록 (`?category=HERO_BALANCE` 등으로 필터) |

### Search

| Method | Path | 설명 |
|---|---|---|
| `GET` | `/search?q=` | 영웅·패치노트 통합 검색 |

### 헬스체크

| Method | Path | 접근 | 설명 |
|---|---|---|---|
| `GET` | `/health` | 공개 | Railway/배포 환경 probe용 DB+Redis 헬스체크. throttler 적용 |
| `GET` | `/internal/health` | localhost / `x-internal-key` | guard 적용한 동일 헬스체크 (내부 운영 도구가 부하 분리할 때 사용) |

### 운영(내부, 외부 노출 금지)

| Method | Path | 설명 |
|---|---|---|
| `GET` | `/internal/scrape-jobs` | 최근 스크래핑 잡 상태 (로컬·내부망에서만 접근) |

---

## 데이터 적재 전략

### 1. 패치노트 — 블리자드 공식 페이지

대상: `https://overwatch.blizzard.com/ko-kr/news/patch-notes/`

```
ScrapePatchNotesUseCase (Cron, 6시간 주기)
  └─ 패치노트 인덱스 페이지 fetch
       └─ 신규 version 감지 (DB와 diff)
            └─ 각 신규 패치 본문 fetch + 파싱
                 ├─ 영웅 섹션 매핑 성공 → PatchNoteEntry 생성 (status=PUBLISHED)
                 │     └─ HeroStatRevision 자동 생성
                 └─ 매핑 실패 → status=PENDING_REVIEW
```

- HTTP fetch는 우선 `undici` + `cheerio`로 처리. 동적 렌더링이 필요해지면 `playwright` fallback.
- 멱등성: `(sourceUrl, version)` unique 제약. 재시도해도 중복 적재되지 않음.

### 2. 영웅 정보 — 나무위키

대상 예시: `https://namu.wiki/w/시에라(오버워치)`

- v1은 **수동 트리거 시드**. (일괄 자동 크롤링은 나무위키 약관·차단 리스크가 있어 보수적으로 운영.)
- CLI: `pnpm hero:sync <codename>` — 단일 영웅의 페이지를 가져와 파싱 후 DB 갱신.
- 파서는 영웅별 능력/수치 섹션을 정규식·DOM 쿼리로 추출. 실패 시 raw HTML을 `data/raw/heroes/<codename>.html`에 보관하여 수동 보정.

### 3. 보정 워크플로우 — Admin CLI

읽기 전용 공개 API라 admin HTTP 엔드포인트는 두지 않는다. 데이터 보정은 모두 CLI로:

```bash
pnpm patch:list                       # 최근 PENDING_REVIEW 패치 조회
pnpm patch:review <version>           # JSON으로 열어서 수정 → PUBLISHED 승격
pnpm hero:edit <codename>             # 단일 영웅 수치/능력 수정
pnpm hero:sync <codename>             # 나무위키에서 다시 가져와 갱신
```

CLI는 `apps/api`의 NestJS standalone application 컨텍스트로 실행 (`nest-commander`).

---

## 아키텍처

### 모노레포 레이아웃

```
watchpoint/
├── apps/
│   ├── api/                          # NestJS — 공개 API + Cron + CLI
│   └── web/                          # Next.js (App Router)
├── packages/
│   └── shared/                       # 공유 타입/DTO/enum (Hero, PatchNote 등)
├── pnpm-workspace.yaml
├── docker-compose.yml                # PostgreSQL + Redis
├── biome.json                        # ticketing 컨벤션 동일 적용
├── SPEC.md
└── README.md
```

### apps/api (NestJS)

ticketing의 CQRS + UseCase 패턴을 그대로 적용. 엔드포인트 1개 = UseCase 1개.

```
apps/api/src/
├── common/
│   ├── cqrs/         # TypedCommandBus, TypedQueryBus
│   ├── exceptions/   # AppException, GLOBAL_ERRORS
│   ├── filters/      # HttpExceptionFilter
│   ├── interceptors/ # TransformInterceptor
│   ├── prisma/       # PrismaModule
│   └── redis/        # RedisModule (응답 캐시)
├── hero/
│   ├── hero.module.ts
│   ├── presenter/http/
│   └── application/use-cases/
├── patch-note/
│   ├── patch-note.module.ts
│   ├── presenter/http/
│   └── application/use-cases/
├── scraper/
│   ├── scraper.module.ts
│   ├── application/
│   │   ├── use-cases/
│   │   │   ├── scrape-patch-notes.use-case.ts
│   │   │   └── sync-hero.use-case.ts
│   │   └── parsers/
│   │       ├── blizzard-patch.parser.ts
│   │       └── namuwiki-hero.parser.ts
│   └── infrastructure/
│       └── http-fetcher.ts
└── cli/
    └── commands/
        ├── patch-review.command.ts
        ├── hero-edit.command.ts
        └── hero-sync.command.ts
```

### apps/web (Next.js)

- App Router + RSC. 데이터 페치는 서버 컴포넌트에서 직접 NestJS API 호출.
- ISR(`revalidate`)로 패치노트/영웅 페이지 정적 캐싱 (기본 1시간).
- 페이지 구성:
  - `/` — 최신 패치 헤드라인 + 영웅 그리드
  - `/heroes` — 역할별 필터 가능한 전체 목록
  - `/heroes/[codename]` — 영웅 상세 (능력 수치 카드 + 패치 이력 타임라인)
  - `/patch-notes` — 페이지네이션
  - `/patch-notes/[version]` — 패치 상세 (영웅 변경사항을 영웅별로 그룹핑)

### packages/shared

- `enums/`: `HeroRole`, `AbilitySlot`, `EntryCategory` 등
- `dto/`: API 응답 타입 (`HeroDto`, `PatchNoteDto` 등)
- BE/FE 양쪽이 import. Prisma 모델과는 분리하여 DB 스키마 변경이 곧바로 외부 노출 형태로 새지 않게 함.

---

## 캐싱 / 부하 전략

- **Redis**: 영웅 상세 5분, 패치노트 목록 1분, 패치노트 상세 10분 TTL.
- **Next.js ISR**: revalidate=3600. 새 패치 적재 시 `revalidatePath` 호출로 즉시 무효화.
- **Rate Limiting**: ticketing과 동일한 `RedisThrottlerStorage`. 분당 240 요청/IP (읽기 전용이라 ticketing보다 관대).

---

## 에러 처리

ticketing과 동일하게 `AppException` 단일 통일.

```typescript
export const HERO_ERRORS = {
  NOT_FOUND: {
    statusCode: HttpStatus.NOT_FOUND,
    errorCode: 'HERO_NOT_FOUND',
    message: 'Hero not found',
  },
};

throw new AppException(HERO_ERRORS.NOT_FOUND);
```

응답:
```json
{
  "statusCode": 404,
  "errorCode": "HERO_NOT_FOUND",
  "message": "Hero not found"
}
```

---

## 스크래핑 운영 원칙

- **속도**: 단일 도메인 동시 요청 1, 요청 간 최소 2초 간격.
- **User-Agent**: `WatchpointBot/0.1 (+contact)` 형태로 명시.
- **robots.txt**: 매 도메인 시작 시 한 번 확인.
- **차단 감지**: HTTP 403/429 또는 Cloudflare 챌린지 감지 시 즉시 중단·`ScrapeJob.status=FAILED` 기록.
- **저작권**: 나무위키 콘텐츠는 CC BY-NC-SA 2.0 KR. 노출 시 출처 링크(`sourceUrl`)를 영웅 상세 페이지에 항상 표시.
