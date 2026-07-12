# Watchpoint 코드 리뷰 이슈 목록

리뷰 일자: 2026-07-09
리뷰 범위: `apps/api`, `apps/web`, `packages/shared`, 인프라 설정

---

## 1. 프로젝트 요약

오버워치 공식 패치노트/영웅 정보를 스크래핑·정규화해서 다국어(ko/en/ja)로 제공하는 **읽기 전용 공개 팬 서비스**.

- 모노레포 (pnpm workspace): `apps/api` (NestJS + CQRS + Prisma + Redis), `apps/web` (Next.js App Router RSC), `packages/shared`
- Cron 6시간 주기 Blizzard 스크래핑 → 영향 영웅 재동기화 → `HeroChangeLog` audit → Next.js `revalidatePath`
- 나무위키 CC BY-NC-SA 라이선스 준수 → 비영리 운영 확정

---

## 2. 정상 작동 판단

| 시나리오 | 상태 |
|---|---|
| 로컬 `pnpm dev` | ✅ 정상 (PrismaService가 런타임에 DATABASE_URL을 어댑터에 직접 주입) |
| `pnpm db:migrate` / `db:seed` | ❌ `datasource db`에 `url` 필드 없음 |
| Railway `start:prod` | ❌ `prisma db seed` 실행되지만 `package.json`에 `"prisma": { "seed": "..." }` 블록 없음 → 컨테이너 즉시 종료 |
| Next.js 빌드/런타임 | ⚠️ 컨벤션 위반, avatar URL CSS 주입 취약점, `error.tsx` Sentry 미연동 |

---

## 3. 이슈 목록

### 🔴 CRITICAL

#### C-1. Prisma `datasource db`에 `url` 필드 누락
- 파일: `apps/api/prisma/schema.prisma:6-8`
- 문제: `url = env("DATABASE_URL")` 선언이 없어 모든 Prisma CLI(`migrate deploy`, `db seed`, `generate`) 명령이 DB URL을 찾지 못함
- 수정: `datasource db { provider = "postgresql"; url = env("DATABASE_URL") }` 추가

#### C-2. `start:prod`의 `prisma db seed` 설정 블록 미등록
- 파일: `apps/api/package.json:9`, top-level
- 문제: `"prisma": { "seed": "..." }` 블록 없이 CLI 호출 → Railway 부팅 실패. 프로덕션 재시작마다 seed 실행되는 것도 부적절
- 수정: `start:prod`에서 `prisma db seed` 제거하고 앱 내부 `AUTO_SEED_ON_BOOT` 플래그로 처리

#### C-3. SPEC.md의 `HeroChangeLog` 모델이 실제 schema와 불일치
- 파일: `SPEC.md:104-114` vs `apps/api/prisma/schema.prisma:178-198`
- 문제: SPEC은 `payload Json`, 스키마는 `target/targetKey/before/after` 4필드. `HeroChangeType` enum도 다름
- 수정: 실구현에 맞게 SPEC.md 갱신

#### C-4. `SignUpUseCase`에서 `PrismaService` 직접 사용 + 트랜잭션 파괴
- 파일: `apps/api/src/auth/application/use-cases/sign-up.use-case.ts:26,36-40`
- 문제: `this.prisma.$transaction` UseCase 직접 호출 (CQRS 위반). 트랜잭션 내에서 `commandBus.execute` 호출 시 Command Handler는 트랜잭션에 참여하지 않아 정합성 파괴 가능
- 수정: `SignUpCommand` 하나로 유저 생성 + refresh 토큰 저장을 묶어 Handler에서 `prisma.$transaction`

#### C-5. `RecordMonitoringLogUseCase`에서 `PrismaService` 직접 주입
- 파일: `apps/api/src/monitoring/application/use-cases/record-monitoring-log.use-case.ts:28-53`
- 수정: `CreateMonitoringLogCommand` 생성 → Handler로 이관

#### C-6. `JwtStrategy` / `JwtRefreshStrategy`에서 `PrismaService` 직접 주입
- 파일: `apps/api/src/auth/strategies/jwt-refresh.strategy.ts`, `jwt.strategy.ts`
- 문제: CQRS + 모듈 경계 위반
- 수정: `GetRefreshTokenQuery`, `GetUserByIdQuery`를 `TypedQueryBus`로 호출

#### C-7. GitHub OAuth 콜백 토큰이 URL 쿼리스트링으로 노출
- 파일: `apps/api/src/auth/presenter/http/auth.http.controller.ts`
- 문제: `${WEB_PUBLIC_URL}/auth/callback?accessToken=...&refreshToken=...` redirect. Referer, 브라우저 히스토리, 서버 액세스 로그에 유출
- 수정: 단회용 code를 Redis에 저장하고 code만 redirect

#### C-8. `new Error()` 직접 throw
- 파일: `apps/api/src/seeder/hero-icon-matcher.service.ts:109`
- 문제: CLAUDE.md 규약 (AppException만 사용) 위반
- 수정: `AppException` 또는 Logger.error 대체

---

### 🟠 WARNING

#### W-1. UseCase 서브 메서드가 `private` 없이 `public` 노출
- 파일: `apps/api/src/auth/application/use-cases/sign-up.use-case.ts:45,49,71,77,83,87`
- 파일: `apps/api/src/auth/application/use-cases/login.use-case.ts:46,50,72,78`
- 파일: `apps/api/src/auth/application/use-cases/github-callback.use-case.ts:24,46`
- 파일: `apps/api/src/auth/application/use-cases/refresh.use-case.ts:30,34,56,62`
- 파일: `apps/api/src/auth/application/use-cases/find-or-create-github-user.use-case.ts:41,45,49,73`
- 파일: `apps/api/src/users/application/use-cases/update-profile.use-case.ts:29,41`
- 문제: nestjs-cqrs 스킬 위반 (execute만 public, 나머지 private)
- 수정: 각 메서드에 `private` 접근 제한자 명시

#### W-2. `function` 키워드 사용 (화살표 함수 컨벤션 위반)
- API: `career/application/use-cases/get-career-stats.use-case.ts:45,54,66,76,89`
- API: `career/application/use-cases/get-career-summary.use-case.ts:40,56,67,79,95`
- API: `career/application/use-cases/search-career.use-case.ts:38,52`
- API: `scraper/common/merge-translation.ts:10`
- API: `search/application/queries/search.query.ts:47`
- API: `scraper/web/web-revalidator.service.ts:95`
- Web: `apps/web/src/app/api/**/route.ts` 다수
- Web: `apps/web/src/lib/format.ts:9,24,245,257,269`
- Web: `apps/web/src/hooks/use-locale.tsx:16`
- Web: `apps/web/src/lib/use-bookmarks.ts:31,57,73,94,107,114`
- Web: `apps/web/src/app/[lang]/**/page.tsx` 서버 컴포넌트 다수

#### W-3. `isDefined` 미사용 (null/undefined 비교)
- API: `career/application/use-cases/get-career-stats.use-case.ts:48,55,60,61,62,67`
- API: `career/application/use-cases/get-career-summary.use-case.ts:57,68,80`
- API: `career/application/use-cases/search-career.use-case.ts:53`
- API: `seeder/hero-diff-logger.service.ts:268,293`
- API: `common/cache/cache-keys.ts:23`
- Web: `apps/web/src/lib/use-bookmarks.ts:69,87-88`

#### W-4. `else` / `else if` 남용 (early return 컨벤션 위반)
- API: `scraper/blizzard/blizzard-patch.scraper.ts:324`
- API: `scraper/blizzard/blizzard-hero-ko.scraper.ts:184`
- API: `cli/commands/assets-upload.command.ts:61`
- Web: `apps/web/src/app/[lang]/career/[playerId]/stats/hero-stats-table.tsx:63-69`
- Web: `apps/web/src/lib/use-bookmarks.ts:29-51`
- Web: `apps/web/src/components/search-bar.tsx:137-154`
- Web: `apps/web/src/app/[lang]/auth/auth-form.tsx:15-26`
- Web: `apps/web/src/app/[lang]/me/account-panel.tsx:14-28`

#### W-5. JSDoc 누락
- `auth` 모듈 UseCase 전반 (execute, issueTokens, getUserByEmail, findOrCreateUser 등)
- `apps/web/src/lib/api.ts:102-104,107-114,148-155,161-165` (getHero, getPatchNote, getCareer* 등)

#### W-6. Props 인터페이스가 파일 하단이 아닌 상단에 선언
- `career/application/use-cases/get-career-summary.use-case.ts:13-15`
- `career/application/use-cases/get-career-stats.use-case.ts`
- `career/application/use-cases/search-career.use-case.ts`

#### W-7. DTO의 내부 상태/DB PK 유출 (packages/shared)
- `packages/shared/src/dto/patch-note.dto.ts:10` — `PatchNoteSummaryDto.status: PatchNoteStatus` (DRAFT/PENDING_REVIEW 외부 노출)
- `packages/shared/src/dto/patch-note.dto.ts:20` — `PatchNoteEntryDto.heroId: number | null` (DB FK 유출)
- 수정: status 제거, heroId → heroCodename 변환

#### W-8. 로컬 Locale 타입 재정의
- `apps/web/src/app/[lang]/me/account-panel.tsx:9`
- `apps/web/src/app/[lang]/auth/auth-form.tsx:9`
- 수정: `import type { Locale } from '@@shared'`

#### W-9. Web `error.tsx`가 Sentry 미연동
- 파일: `apps/web/src/app/[lang]/error.tsx:18`
- 문제: `console.error`만 사용. CLAUDE.md의 Sentry 활용 원칙 위반
- 수정: `Sentry.captureException(error)` 추가

#### W-10. Biome 설정 CLAUDE.md와 불일치
- `biome.json:6` — `vcs.defaultBranch: "main"` (CLAUDE.md는 `develop`)
- `biome.json:108` — `noExplicitAny: "warn"` (컨벤션은 `error`)
- CLAUDE.md는 `useExplicitType: error` 명시했으나 실제는 `noInferrableTypes: error`만 있음
- 수정: 문서/설정 정합화

#### W-11. `SafeEqual` 타이밍 공격 방어가 길이 불일치 시 무력화
- 파일: `apps/api/src/internal/guards/is-localhost.guard.ts:50-54`
- 파일: `apps/api/src/monitoring/guards/monitoring-token.guard.ts:44-48`
- 수정: HMAC 기반 비교로 강화 검토

#### W-12. `DeleteRefreshTokenCommand`의 `userId` 조건 분기
- 파일: `apps/api/src/auth/application/command/delete-refresh-token.command.ts:17-19`
- 문제: `isDefined` 미사용 + userId 없이 token만으로 삭제 시 이론상 충돌 가능
- 수정: RefreshToken 테이블의 `@unique(token)` 확인 후 로직 정비

#### W-13. Avatar URL이 CSS injection에 노출
- 파일: `apps/web/src/components/auth-menu.tsx:116`
- 문제: `style={{ backgroundImage: \`url(${url})\` }}`에 미검증 URL 주입. `javascript:`, `data:` 스킴 방어 없음
- 수정: URL 스킴 검증 후 `<img>` 태그로 대체

#### W-14. `PrismaService` 생성자가 `process.env.DATABASE_URL` 직접 접근
- 파일: `apps/api/src/common/prisma/prisma.service.ts:8-9`
- 문제: Joi 검증 우회
- 수정: `ConfigService.getOrThrow` 이관

#### W-15. `ImportBookmarksUseCase.applyKindCaps`의 N+1 쿼리
- 파일: `apps/api/src/bookmark/application/use-cases/import-bookmarks.use-case.ts:50-53`
- 수정: `GROUP BY kind`로 카운트 한 번에 조회

#### W-16. `CODENAME_TO_BLIZZARD_SLUG` 중복 선언
- 파일: `apps/api/src/scraper/blizzard/blizzard-hero.scraper.ts:16-18`
- 파일: `apps/api/src/scraper/blizzard/blizzard-hero-ko.scraper.ts:17-19`
- 수정: 공통 상수 파일로 추출

#### W-17. `toBattleTag` 함수가 3개 파일에 중복 정의
- `apps/web/src/app/[lang]/career/favorites-list.tsx:119`
- `apps/web/src/app/[lang]/career/[playerId]/page.tsx:339`
- `apps/web/src/app/[lang]/career/[playerId]/stats/page.tsx:283`
- 수정: `apps/web/src/lib/format.ts`로 통합

#### W-18. CLI에서 `new Error` 직접 throw
- `apps/api/src/cli/commands/hero-perks-edit.command.ts:151,176`
- `apps/api/src/cli/commands/patch-backfill.command.ts:33,42`
- 수정: Logger 처리로 대체 (CLI 맥락에서는 AppException 대신)

#### W-19. `CareerLookupLogInterceptor`가 `PrismaService` 직접 사용
- 파일: `apps/api/src/career/*`
- 문제: 인터셉터에서 DB 직접 write → CQRS 계층 우회
- 수정: Command로 이관

---

### 🟡 SUGGESTION

- S-1. Dead code in shared: `CareerPlatform`, `CareerStatsRole`, `isPerkTier`, `isSubrole`
- S-2. `ScrapeSource`/`ScrapeStatus`/`PatchNoteStatus`가 shared에 있으나 FE 미사용 → BE 전용으로 이동 검토
- S-3. `docker-compose.yml`의 MinIO 헬스체크가 존재하지 않는 `mc` 바이너리 호출
- S-4. `tsconfig.base.json`의 `moduleResolution: "node"` → `nodenext` 검토
- S-5. `next.config.ts`의 `new URL(MINIO_PUBLIC_URL)`가 유효하지 않은 문자열 시 빌드 실패 → try-catch
- S-6. `HERO_CATALOG_BY_CODENAME`의 타입을 `Partial<Record<...>>`로 변경
- S-7. `hero.dto.ts`의 `extras: Record<string, unknown>` JSDoc 문서화
- S-8. `career` UseCase의 순수 변환 함수들을 `career.mapper.ts`로 분리
- S-9. `SearchResponseDto` → `SearchResultDto` 네이밍 일관성
- S-10. Web `bookmarks-section.tsx`의 `displayHeroName`/`displayPlayerName` 동일 로직 → 하나로 통합
- S-11. `SiteHeader`의 하드코딩된 locale 정규식 → shared LOCALES로 동적 생성
- S-12. Web `[lang]/layout.tsx`의 `resolveLang` 로컬 재정의 → shared 함수로 통합
- S-13. `revalidate/route.ts`의 경로 검증에 `../` 방어 추가
- S-14. `.env.example`에 `WEB_PORT` 있으나 Joi 스키마 미정의
- S-15. `sentry.server.config.ts`가 `NEXT_PUBLIC_SENTRY_DSN` 사용 (관례상 서버 전용 env 분리)

---

## 4. 수정 진행 상황

- [x] 이슈 문서화 (본 문서)
- [x] C-1 schema.prisma url 필드 추가
- [x] C-2 start:prod 정리 (`prisma db seed` 제거, `"prisma": { "seed": "..." }` 블록 추가; AUTO_SEED_ON_BOOT는 이미 배선돼 있음)
- [x] C-3 SPEC.md HeroChangeLog 갱신 (실제 스키마 필드/enum과 정합화)
- [x] C-4 SignUpUseCase 트랜잭션 정리 — `SignUpCommand` 신규 생성 후 트랜잭션 내에서 유저+refresh token 원자 저장, UseCase는 PrismaService 제거
- [x] C-5 RecordMonitoringLogUseCase CQRS 정리 — `CreateMonitoringLogCommand`로 이관
- [x] C-6 Jwt Strategies CQRS 정리 — `GetUserByIdQuery`(기존), `GetRefreshTokenByTokenQuery`(신규) 사용
- [x] C-7 GitHub OAuth code 방식으로 변경 — Redis 60초 TTL 단회용 code 발급 + `/auth/oauth-exchange` POST 신설. Web BFF도 code → 토큰 교환 방식으로 갱신
- [x] C-8 new Error 제거 — Logger warn + skipped 결과 반환으로 대체
