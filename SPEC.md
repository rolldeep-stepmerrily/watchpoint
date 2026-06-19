# Watchpoint — 기술 명세

> *Quis custodiet ipsos custodes?* — 감시자들을 위한 감시 지점.

오버워치 패치노트와 영웅별 능력 상세 수치를 한곳에서 추적·열람할 수 있는 읽기 전용 공개 서비스.

---

## 개요

- **목표**: 블리자드 공식 패치노트와 영웅별 능력 수치를 정기적으로 수집·정규화하여 빠른 조회와 영웅별 패치 이력 추적을 제공.
- **범위(v1)**: 패치노트(2026-01 이후) + 모든 영웅의 기본 능력/수치.
- **비범위(v1)**: 유저 인증, 댓글, 즐겨찾기, 통계/메타 분석, 토너먼트/프로 씬 데이터.
- **데이터 적재 정책**: 영웅/패치노트 모두 블리자드 공식 페이지를 스크래핑. 이후 Cron이 주기적으로 신규 패치를 감지·적재. 자동 매핑 실패 건은 `PENDING_REVIEW`로 격리하여 admin CLI로 보정.

---

## 도메인 모델

### 공통 — 다국어 필드 패턴

이름/설명류 필드는 한국어를 기본(`name`/`description`/`title`/`body`/`summary`)으로 두고, 그 옆에
`*Translations Json?`를 둬서 `{ ko, en, ja }` 형태로 보강한다. API의 `?lang=` 파라미터가 요청 로케일을 결정하면
`name-resolver`가 `*Translations[lang]` → 기본 필드 순으로 폴백 해서 응답을 만든다.

### Hero
| 필드 | 타입 | 설명 |
|---|---|---|
| id | Int | PK |
| codename | String | 영문 식별자 (URL slug, unique) — 예: `sierra` |
| name | String | 한글 영웅명 — 예: `시에라` |
| nameTranslations | Json? | `{ ko, en, ja }` 형태의 이름 다국어 |
| role | HeroRole | `TANK` / `DAMAGE` / `SUPPORT` |
| subrole | Subrole | `Bruiser` / `Initiator` / `Stalwart` / `Sharpshooter` / `Flanker` / `Specialist` / `Recon` / `Tactician` / `Medic` / `Survivor` |
| releasedAt | DateTime | 출시일 |
| portraitUrl | String? | 초상화 이미지 URL |
| description | String? | 영웅 소개 (한국어 기본) |
| descriptionTranslations | Json? | 설명 다국어 |
| sourceUrl | String? | 1차 출처 (Blizzard 공식 영웅 페이지) |
| createdAt / updatedAt | DateTime | audit |

### HeroStat
영웅 기본 수치(체력 구성/이동 속도 등). 패치마다 갱신 가능하므로 history는 `HeroStatRevision`으로 별도 보관.

| 필드 | 타입 | 설명 |
|---|---|---|
| id | Int | PK |
| heroId | Int | 영웅 FK (unique — 1:1) |
| health | Int | 일반 체력 |
| armor | Int | 방어구 (기본 0) |
| shield | Int | 보호막 (기본 0) |
| moveSpeed | Float | 이동 속도 (m/s) |
| extras | Json? | 영웅별 특수 수치 (예: 부스트 속도, 브레이크 시간 등) |

### HeroAbility
| 필드 | 타입 | 설명 |
|---|---|---|
| id | Int | PK |
| heroId | Int | 영웅 FK |
| slot | AbilitySlot | `PASSIVE` / `PRIMARY` / `SECONDARY` / `ABILITY_1` / `ABILITY_2` / `ULTIMATE` |
| key | String? | 키 바인드 표기 — 예: `LMB`, `RMB`, `Shift`, `E`, `Q` |
| blizzardId | String? | Blizzard 페이지에서 추출한 능력 식별자. 한국어 sync 시 저장 → 영문 sync 매칭에 사용 |
| name | String | 능력명 (한국어 기본) |
| nameTranslations | Json? | 다국어 |
| description | String | 설명 (한국어 기본) |
| descriptionTranslations | Json? | 다국어 |
| stats | Json? | 데미지/쿨다운/사거리/탄창 등 정형 수치 |
| iconUrl | String? | MinIO 호스팅된 능력 아이콘 URL |
| order | Int | 표시 순서 (기본 0) |

`(heroId, slot, order)` unique. `(heroId, blizzardId)` 보조 인덱스.

### HeroPerk
영웅별 4종 특전(MINOR 2, MAJOR 2). 영문 sync는 `(tier, slot)` 복합키로 매칭한다.

| 필드 | 타입 | 설명 |
|---|---|---|
| id | Int | PK |
| heroId | Int | 영웅 FK |
| tier | PerkTier | `MINOR` / `MAJOR` |
| slot | Int | 1 또는 2 (좌/우) |
| name | String | 특전명 (한국어 기본) |
| nameTranslations | Json? | 다국어 |
| description | String | 설명 (한국어 기본) |
| descriptionTranslations | Json? | 다국어 |
| stats | Json? | 정형 수치 |
| iconUrl | String? | MinIO 아이콘 URL |

`(heroId, tier, slot)` unique.

### HeroStatRevision
패치 적용 이력. 영웅 수치/능력이 어떤 패치에서 어떻게 변했는지 추적.

| 필드 | 타입 | 설명 |
|---|---|---|
| id | Int | PK |
| heroId | Int | 영웅 FK |
| patchNoteId | Int | 패치노트 FK |
| diff | Json | 변경 전/후 비교 (예: `{ "ability:fireBlast.damage": { "from": 80, "to": 90 } }`) |
| appliedAt | DateTime | 적용 시각 |

> **현 상태**: schema 정의만 존재하고 cron이 자동으로 row를 생성하지 않음. 후속 작업에서 `BlizzardPatchScraper.syncAffectedHeroes`가 diff를 만들도록 구현 예정. 그동안 영웅별 변경은 `HeroChangeLog`로만 audit된다.

### HeroChangeLog
스크래퍼 + cron이 실제로 작성하는 audit 로그. 이름/설명/능력별 diff를 row 단위로 저장.

| 필드 | 타입 | 설명 |
|---|---|---|
| id | Int | PK |
| heroId | Int | 영웅 FK |
| changeType | HeroChangeType | `NAME` / `DESCRIPTION` / `ABILITY_ADDED` / `ABILITY_REMOVED` / `ABILITY_UPDATED` / `PERK_ADDED` / `PERK_REMOVED` / `PERK_UPDATED` |
| scrapeJobId | Int? | 트리거한 ScrapeJob FK |
| payload | Json | before/after 또는 항목 식별자 |
| createdAt | DateTime | |

### PatchNote
| 필드 | 타입 | 설명 |
|---|---|---|
| id | Int | PK |
| version | String | 패치 식별자 (예: `2026.01.14`) — unique |
| title | String | 패치 제목 (한국어 기본) |
| titleTranslations | Json? | 다국어 |
| releasedAt | DateTime | 공식 발표일 |
| sourceUrl | String | 블리자드 원본 URL — unique |
| summary | String? | 헤드라인 요약 (한국어 기본) |
| summaryTranslations | Json? | 다국어 |
| status | PatchNoteStatus | `DRAFT` / `PUBLISHED` / `PENDING_REVIEW` (기본 `DRAFT`) |

> `BlizzardPatchScraper.persist`는 자동 매핑 성공 시 `PUBLISHED`, 매핑 실패가 있으면 `PENDING_REVIEW`로 저장한다. 공개 API(`/patch-notes*`, `/search`)는 `PUBLISHED`만 노출.

### PatchNoteEntry
패치노트의 개별 항목(영웅 1명 단위 또는 일반 항목 단위로 쪼갠 것).

| 필드 | 타입 | 설명 |
|---|---|---|
| id | Int | PK |
| patchNoteId | Int | 패치노트 FK |
| category | EntryCategory | `HERO_BALANCE` / `BUG_FIX` / `MAP` / `SYSTEM` / `GENERAL` |
| heroId | Int? | 영웅 관련 항목인 경우 FK (없으면 일반 항목) |
| perkId | Int? | 특전 단위 항목인 경우 FK |
| title | String | 항목 제목 (한국어 기본) |
| titleTranslations | Json? | 다국어 |
| body | String | 본문 (한국어 기본, 마크다운) |
| bodyTranslations | Json? | 다국어 |
| order | Int | 표시 순서 (기본 0) |

### ScrapeJob
스크래핑 실행 로그. 멱등성 보장 및 운영 가시성용.

| 필드 | 타입 | 설명 |
|---|---|---|
| id | Int | PK |
| source | ScrapeSource | `BLIZZARD_PATCH_NOTES` / `BLIZZARD_PATCH_NOTES_EN` / `BLIZZARD_HERO_KO` / `BLIZZARD_HERO_EN` / `NAMUWIKI_HERO` |
| target | String | 대상 식별자 (URL 또는 영웅 codename) |
| status | ScrapeStatus | `RUNNING` / `SUCCESS` / `FAILED` / `SKIPPED` |
| startedAt | DateTime | 시작 시각 |
| finishedAt | DateTime? | 종료 시각 |
| error | String? | 실패 사유 |
| diffSummary | Json? | 변경 요약 (신규/수정/삭제 카운트) |

### Enum 요약

- **HeroRole**: `TANK` / `DAMAGE` / `SUPPORT`
- **Subrole**: `Bruiser` / `Initiator` / `Stalwart` / `Sharpshooter` / `Flanker` / `Specialist` / `Recon` / `Tactician` / `Medic` / `Survivor`
- **AbilitySlot**: `PASSIVE` / `PRIMARY` / `SECONDARY` / `ABILITY_1` / `ABILITY_2` / `ULTIMATE`
- **PerkTier**: `MINOR` / `MAJOR`
- **EntryCategory**: `HERO_BALANCE` / `BUG_FIX` / `MAP` / `SYSTEM` / `GENERAL`
- **PatchNoteStatus**: `DRAFT` / `PUBLISHED` / `PENDING_REVIEW`
- **HeroChangeType**: `NAME` / `DESCRIPTION` / `ABILITY_ADDED` / `ABILITY_REMOVED` / `ABILITY_UPDATED` / `PERK_ADDED` / `PERK_REMOVED` / `PERK_UPDATED`
- **ScrapeSource**: `BLIZZARD_PATCH_NOTES` / `BLIZZARD_PATCH_NOTES_EN` / `BLIZZARD_HERO_KO` / `BLIZZARD_HERO_EN` / `NAMUWIKI_HERO`
- **ScrapeStatus**: `RUNNING` / `SUCCESS` / `FAILED` / `SKIPPED`
- **Locale** (`?lang=`): `ko` / `en` / `ja` (기본 `ko`)

---

## API 명세

모든 엔드포인트는 **인증 불필요**, 응답은 전역 `TransformInterceptor`가 `null`/`undefined`을 빈 객체로 정규화하는 정도. 별도 envelope(예: `{ data: ... }`)는 적용하지 않는다.

### 공통 쿼리

- `?lang=ko|en|ja` — 응답 내 이름/설명류 필드의 로케일 선택. 누락 또는 invalid 값은 `ko`로 fallback.
- 목록 엔드포인트(`/heroes`, `/patch-notes`)는 `?page=` (default 1) + `?pageSize=` (default 50, max 100) 페이지네이션. 100 초과 요청은 400 응답이라 sitemap/크롤러는 페이지네이션 사용 필수.

### Heroes

| Method | Path | 설명 |
|---|---|---|
| `GET` | `/heroes` | 영웅 목록. `?role=TANK\|DAMAGE\|SUPPORT`, `?q=` 이름 검색, 공통 쿼리 |
| `GET` | `/heroes/:codename` | 영웅 상세 (기본 정보 + stats + abilities + perks). `?lang=` |
| `GET` | `/heroes/:codename/abilities` | 능력 목록만. 응답 shape `{ abilities: HeroAbilityDto[] }` |
| `GET` | `/heroes/:codename/patch-history` | 해당 영웅이 등장한 패치 이력 (최신순). `PUBLISHED`만 노출 |

### Patch Notes

| Method | Path | 설명 |
|---|---|---|
| `GET` | `/patch-notes` | 패치노트 목록 (페이지네이션, 최신순). `PUBLISHED`만 노출 |
| `GET` | `/patch-notes/latest` | 가장 최근 패치노트 1건 (bare 객체) |
| `GET` | `/patch-notes/:version` | 패치노트 상세 (모든 entry 포함) |
| `GET` | `/patch-notes/:version/entries` | entry 목록. `?category=HERO_BALANCE` 등 필터. 응답 shape `{ entries: PatchNoteEntryDto[] }` |

### Search

| Method | Path | 설명 |
|---|---|---|
| `GET` | `/search?q=` | 영웅·패치노트 통합 검색. `q`는 1~50자 trim. `PUBLISHED`만 노출. `?lang=` |

응답 shape: `{ heroes: HeroSummaryDto[], patchNotes: PatchNoteSummaryDto[] }`.

### Career (Beta) — 전적조회

[OverFast API](https://github.com/TeKrop/overfast-api)(MIT, 비공식 Overwatch API)를 우리 NestJS가 프록시. Blizzard 공식 OAuth API에는 Overwatch가 빠져있어 OverFast가 `overwatch.blizzard.com/career/...` 페이지를 스크래핑·JSON 변환해주는 형태.

`OVERFAST_API_BASE_URL` env로 upstream을 지정. 기본값은 public 인스턴스(`https://overfast-api.tekrop.fr`), 트래픽 증가 시 Docker self-host URL로 교체.

| Method | Path | 설명 |
|---|---|---|
| `GET` | `/career?q=` | 플레이어 이름/BattleTag 검색. `q` 1~40자, `page` 기본 1, `pageSize` 기본 20, max 50. 응답 5분 캐시 |
| `GET` | `/career/:playerId` | 프로필 + 경쟁전 랭크 요약. `playerId`는 BattleTag의 `#`를 `-`로 치환 (예: `TeKrop-2217`). 응답 10분 캐시 |

응답 shape는 `CareerSearchResultDto` / `CareerSummaryDto` (`packages/shared/src/dto/career.dto.ts`).

**제약 / 베타 표시 사유**:
- 플레이어가 게임 내에서 "경력 프로필 공개"를 **Public**으로 설정해야 데이터 노출. private 프로필은 404.
- OverFast가 Blizzard 페이지 구조 변경에 의존 — 며칠~수주 단위 깨질 수 있음.
- public 인스턴스 사용 시 30 req/s/IP rate limit을 우리 Railway IP가 전부 부담. 429 발생 시 `CAREER_UPSTREAM_RATE_LIMITED`(429) 반환.
- upstream 5xx/네트워크 에러는 `CAREER_UPSTREAM_UNAVAILABLE`(502)로 매핑되며 캐시되지 않음 (일시 장애가 캐싱돼 굳어버리는 것 방지).
- UI에 **Beta 라벨 + 디스클레이머 필수**.

**Audit log (`career_lookup_logs`)**: 두 엔드포인트 호출은 `requestId`, `eventType`(SEARCH|SUMMARY), `query`(q 또는 playerId), `ip`(raw, X-Forwarded-For 우선), `success`, `errorCode`, `createdAt`로 적재된다. 상세 수치/응답 본문은 저장하지 않음. 오남용 추적·OverFast 의존도 모니터링 용도.

### 헬스체크

| Method | Path | 접근 | 설명 |
|---|---|---|---|
| `GET` | `/health` | 공개 | Railway/배포 환경 probe용 DB+Redis 헬스체크. throttler 적용 |
| `GET` | `/internal/health` | localhost / `x-internal-key` | guard 적용한 동일 헬스체크 (내부 운영 도구가 부하 분리할 때 사용) |

응답 shape: `{ status: 'ok'|'degraded', db: 'ok'|'fail', redis: 'ok'|'fail', timestamp: string }`.

### 운영(내부, 외부 노출 금지)

| Method | Path | 설명 |
|---|---|---|
| `GET` | `/internal/scrape-jobs` | 최근 스크래핑 잡 상태. `?source=`, `?status=`, `?limit=` (1~200, default 50) |
| `POST` | `/internal/monitoring-log` | 외부 routine 결과 적재. `x-monitoring-key` 헤더 + `MONITORING_INGEST_KEY` env 매칭 (timing-safe). body: `{ kind, status: 'pass'\|'fail'\|'transient', total, passed, failed, durationMs?, fixPrUrl?, notes? }`. **kind별 10분 1회 rate limit** (Redis SET NX EX). |
| `GET` | `/internal/monitoring-log` | 적재된 모니터링 로그 조회. `?kind=`, `?status=`, `?limit=` (1~200, default 30). 동일 token 인증. |

### 인증 (Auth)

회원 가입/로그인. 비밀번호 hash는 bcrypt cost 10. JWT access (15분) + refresh (7일, DB whitelist).

| Method | Path | 인증 | 설명 |
|---|---|---|---|
| `POST` | `/auth/sign-up` | 공개 | 이메일/비밀번호 회원가입. body: `{ email, password, name? }`. password는 영문/숫자/특수문자 포함 8자 이상. 응답: `{ accessToken, refreshToken }` |
| `POST` | `/auth/login` | 공개 | 이메일/비밀번호 로그인. body: `{ email, password }`. 응답: `{ accessToken, refreshToken }` |
| `GET` | `/auth/github` | 공개 | GitHub OAuth 시작 — passport-github2가 GitHub authorize URL로 302 redirect |
| `GET` | `/auth/github/callback` | 공개 (GitHub callback) | OAuth 콜백. 성공 시 `${WEB_PUBLIC_URL}/auth/callback?accessToken=...&refreshToken=...`로 redirect |
| `POST` | `/auth/refresh` | `Bearer <refreshToken>` | refresh token 회전 — 새 access + refresh 쌍 발급, 기존 refresh는 폐기 |
| `POST` | `/auth/logout` | `Bearer <accessToken>` + body `{ refreshToken }` | refresh token 폐기 + access token Redis 블랙리스트 등록 (잔여 TTL만큼) |

### 사용자 (Users)

모두 `Bearer <accessToken>` (JwtAuthGuard) 필수.

| Method | Path | 설명 |
|---|---|---|
| `GET` | `/users/me` | 내 프로필. 응답: `{ id, email, name, avatarUrl, role, hasPassword, createdAt }` |
| `PATCH` | `/users/me` | 프로필 수정. body: `{ name?, avatarUrl? }` |
| `POST` | `/users/me/password` | 비밀번호 변경. body: `{ currentPassword, newPassword }` |

### 북마크 (Bookmarks)

모두 `Bearer <accessToken>` (JwtAuthGuard) 필수. `kind` = `HERO` (영웅 codename) \| `PLAYER` (OverFast playerId). kind별 한도 100건, 초과 시 `BOOKMARK_LIMIT_REACHED` (409).

| Method | Path | 설명 |
|---|---|---|
| `GET` | `/users/me/bookmarks` | 내 북마크 목록. query: `?kind=HERO\|PLAYER` 선택 필터. 응답: `{ items: [{ id, kind, targetId, metadata, createdAt }] }` (createdAt desc) |
| `POST` | `/users/me/bookmarks` | 북마크 추가. body: `{ kind, targetId, metadata? }`. idempotent — 같은 `(kind, targetId)` 재호출 시 metadata만 갱신 |
| `DELETE` | `/users/me/bookmarks/:kind/:targetId` | 북마크 삭제. 멱등 (없어도 204) |
| `POST` | `/users/me/bookmarks/import` | 게스트 localStorage 1회 흡수. body: `{ items: [{ kind, targetId, metadata? }] }` (max 200). 응답: `{ inserted, skipped }`. 중복/한도 초과는 silent skip |

**권한 모델**: `User.role` = `USER` | `ADMIN`. 관리자 전용 라우트는 `@UseGuards(JwtAuthGuard, AdminGuard)`로 강제.

### Web ↔ API ISR 콘트랙트

| Method | Path | 호스팅 | 설명 |
|---|---|---|---|
| `POST` | `/api/revalidate` | Web(Next.js route handler) | API의 `WebRevalidatorService`가 신규 patch/hero sync 종료 후 호출. `x-revalidate-secret` 헤더 검증 + `{ paths: string[] }` body. timing-safe compare로 200/403/503 응답 |

---

## 데이터 적재 전략

### 1. 패치노트 — 블리자드 공식 페이지

대상: `https://overwatch.blizzard.com/ko-kr/news/patch-notes/`

```
BlizzardPatchCron (6시간 주기, in-process 동시 실행 가드)
  ├─ 한국어 인덱스 페이지 fetch (BlizzardPatchScraper)
  │    └─ 신규 version 감지 (DB와 diff)
  │         └─ 각 신규 패치 본문 fetch + 파싱
  │              ├─ 영웅 섹션 매핑 성공 → PatchNote(status=PUBLISHED) + PatchNoteEntry 생성
  │              │     └─ HeroChangeLog audit + (TODO) HeroStatRevision 생성
  │              └─ 매핑 실패 → status=PENDING_REVIEW
  │         └─ affectedVersions 모아 WebRevalidatorService 호출
  │         └─ affectedHeroIds는 백그라운드로 BlizzardHeroKoScraper + HeroIconMatcher 자동 재동기화
  └─ 영문 인덱스 페이지 fetch (BlizzardPatchEnScraper)
       └─ 기존 PatchNote(version)에 영문 title/summary translations mergeTranslation 병합
            └─ 영웅 entry는 hero.nameTranslations.en 매칭으로 영문 body 병합
            └─ affectedVersions로 WebRevalidator 호출
```

- HTTP fetch는 우선 `undici` + `cheerio`로 처리. 동적 렌더링이 필요해지면 `playwright` fallback.
- 멱등성: `(sourceUrl, version)` unique 제약. 재시도해도 중복 적재되지 않음.

### 2. 영웅 정보 — 블리자드 공식 영웅 페이지 + 나무위키 보강

대상 예시: `https://overwatch.blizzard.com/ko-kr/heroes/sierra/` / `https://overwatch.blizzard.com/en-us/heroes/sierra/` / `https://namu.wiki/w/시에라(오버워치)`

- 부팅 시 자동 보강: `boot-seeder`가 ko/en 페이지를 순차 스크래핑해 한국어/영문 이름·설명·능력을 채움 (`BlizzardHeroKoScraper` + `BlizzardHeroEnScraper`).
- 패치 cron이 새 패치 적재 시 영향 받은 영웅을 `BlizzardHeroKoScraper.sync`로 자동 재동기화.
- 나무위키 보강(`NamuwikiHeroScraper`): 블리자드 페이지에 없는 정보를 보완. 한국어 ability/perk 명칭 우선 적용(예: 정커퀸 "톱니칼" vs 블리자드 "재기드 블레이드"), 블리자드 페이지에 카드 없는 능력의 아이콘 fallback, 영웅 국적 등 메타. 라이선스: CC BY-NC-SA 2.0 KR (BY 표기 + NC 비영리 + SA 동일조건).
- CLI: `pnpm hero:sync <codename>` — 단일 영웅을 즉시 강제 sync. 일괄 자동 크롤링은 Blizzard CDN throttle(요청 간 2초)로 보수적 운영.

### 라이선스/저작권 표기

- 블리자드 공식 페이지 데이터: Blizzard Entertainment 자산. 본 서비스는 비공식 팬 프로젝트이며 Blizzard와 무관.
- 나무위키 본문/이미지: **CC BY-NC-SA 2.0 KR** — 비영리 한정 + 동일조건 재배포. 본 사이트는 비영리 운영으로 광고/도네이션/유료 기능을 도입하지 않음. footer + 영웅 상세에 출처 표기.

### 3. 보정 워크플로우 — Admin CLI

읽기 전용 공개 API라 admin HTTP 엔드포인트는 두지 않는다. 데이터 보정은 모두 CLI로:

```bash
pnpm patch:list                       # 최근 PENDING_REVIEW 패치 조회
pnpm patch:review <version>           # JSON으로 열어서 수정 → PUBLISHED 승격
pnpm hero:edit <codename>             # 단일 영웅 수치/능력 수정
pnpm hero:sync <codename>             # Blizzard 한국어 페이지에서 다시 가져와 갱신
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
│   │       └── blizzard-hero.parser.ts
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
- **저작권**: 본 사이트는 Blizzard Entertainment와 무관한 비공식 팬 프로젝트. Blizzard 공식 페이지에서 가져온 데이터는 영웅 상세 페이지에 출처 링크(`sourceUrl`)를 항상 표시.
