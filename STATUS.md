# Watchpoint — 진행 현황 / 남은 작업

> 2026-05-28 기준. 특전(Perks) 시스템 인프라 도입(PR #52 develop 머지) 직후 시점의 스냅샷.

## 0. 다음 작업 순서 (사용자 합의 2026-05-28)

1. **main 릴리스** — PR #52 (HeroPerk 시스템 + PR #50 search 컬럼명 핫픽스). search 핫픽스가 prod에 가야 search 정상화. develop = `e28efee`, main = `275043f`
2. **perks UI 추가** — `apps/web` 영웅 상세 페이지에 perks 섹션. 현재 API에는 나오지만 화면에 렌더링 안 됨
3. **perks 데이터 삽입** — 영웅별로 사용자가 namu.wiki 본문 붙여넣기 → 정리 후 `pnpm hero:perks:edit` 또는 seed 추가. subrole 그룹 단위로 진행 권장

## 1. 한눈에

| 영역 | 상태 | 비고 |
|---|---|---|
| 도메인 모델 (Hero/PatchNote/Entry/Scrape/HeroPerk) | ✅ 완료 | SPEC 일치 + i18n 필드 6개 + HeroPerk 추가 |
| 특전 시스템 (HeroPerk + tier/slot + iconUrl) | 🟡 인프라/API/CLI 완료, 데이터 1/53 영웅 | D.Va만 입력. UI 미구현. 데이터 입력은 수동 |
| 공개 API (GET 7종) | ✅ 완료 | `?lang=` 지원, validation 적용 |
| 인증/권한 | ✅ v1 정책 통과 | 공개 read-only, `/internal/*`은 localhost guard |
| 스크래퍼 (Blizzard 패치노트, 나무위키 영웅, Blizzard 영문 영웅/패치) | ✅ 코드 완료 | Cron + CLI |
| CLI 보정 도구 | ✅ 완료 | patch:list/review, hero:edit/sync, hero/patch:sync:en |
| Throttler (Redis 기반) | ✅ 완료 | 60s / 240req |
| Helmet / Compression / ValidationPipe | ✅ 완료 | production 분기 |
| Prisma 마이그레이션 | ✅ 완료 | 8개 (i18n 3개 포함) |
| Redis 응답 캐시 | ✅ 완료 | SPEC TTL 준수 + scraper/CLI 무효화 (PR feat-redis-response-cache) |
| 테스트 (jest/e2e) | 🔲 **미작성** | CI는 lint + tsc + build만 |
| `revalidatePath` 트리거 (web ISR 무효화) | 🔲 **미구현** | 새 패치 적재 후 web 정적 페이지 갱신 신호 없음 |
| Playwright fallback | 🔲 **미구현** | SPEC에 옵션으로만 언급 |
| ja(일본어) 데이터 | 🔲 **미수집** | UI 토글은 disabled, search 쿼리만 ja path 포함 |
| Prod 영문 데이터 보강 (hero/patch:sync:en) | 🟡 **대기 중** | 코드 머지 + 마이그레이션 OK, prod CLI 실행만 남음 |

---

## 2. 최근 완료 (2026-05-25 ~ 26 i18n 릴리스)

PR #34 (develop → main, merge commit `9893be6`)에 5개 PR 묶여 main 진입.

| PR | 내용 |
|---|---|
| #29 | i18n toggle flow 3 버그 (search lang, html lang hydration, 토글 시 html lang 갱신) |
| #30 | Hero description 다국어 + Blizzard 영문 영웅 스크래퍼 + 검색 nameTranslations 매칭 |
| #31 | Ability name/description 다국어 (slot 순서 + PRIMARY/SECONDARY 통합 매칭) |
| #32 | PatchNote title/summary 다국어 + Blizzard 영문 patch notes 스크래퍼 |
| #33 | PatchNoteEntry title/body 다국어 (heroName 기반 매칭) |
| #35 | refactor: `resolveDescription` generic화 + body→resolveDescription + dead fallback / unused param 제거 |

### 추가된 자산
- 스키마: `Hero.descriptionTranslations`, `HeroAbility.descriptionTranslations`, `PatchNote.titleTranslations`/`summaryTranslations`, `PatchNoteEntry.titleTranslations`/`bodyTranslations`
- Enum: `ScrapeSource.BLIZZARD_HERO_EN`, `BLIZZARD_PATCH_NOTES_EN`
- 헬퍼: `resolveName(string)` / `resolveDescription<T extends string | null>(T)` (apps/api/src/hero/application/name-resolver.ts)
- 스크래퍼: `BlizzardHeroEnScraper`, `BlizzardHeroParser`, `BlizzardPatchEnScraper`
- CLI: `pnpm hero:sync:en <codename>`, `pnpm hero:sync:en:all`, `pnpm patch:sync:en`
- 검색 OR 절: `nameTranslations.en`, `nameTranslations.ja`, `titleTranslations.en`, `summaryTranslations.en` 매칭

---

## 3. 즉시 할 일 (현재 차단되어 있음 — prod 배포 후)

### 3.1 Prod에서 영문 데이터 보강
```bash
railway run pnpm hero:sync:en:all   # 51영웅 영문 이름/설명/능력 (~2분)
railway run pnpm patch:sync:en      # 패치 title/summary + entry 영문
```
순서 중요: `hero:sync:en:all`이 채워야 `patch:sync:en`의 entry 매칭이 동작 (heroName→hero.id 인덱스를 `hero.nameTranslations.en`에서 만듦).

미실행 상태에서도 사이트는 정상 동작 — `?lang=en`은 KO fallback.

### 3.2 보강 후 검증
- `/heroes/:codename?lang=en` — 능력 description이 EN으로 나오는지 spot-check
- `/patch-notes/:version?lang=en` — title/summary/entry body EN 확인
- Ability slot mis-match 의심 영웅 (Blizzard 카드 순서가 DB와 다른 경우): 신규 영웅 1~2명에서 확인 권장
- `?q=` 검색에 영문 영웅명 입력 — 대문자 시작이어야 매칭됨 (case-sensitive 한계)

---

## 4. 서버 코드 전면 검토 결과 (i18n 외)

### 4.1 HIGH (운영 안정성 영향)

**(H1) ~~SPEC 명시 Redis 응답 캐시 미구현~~ → 해결됨 (PR feat-redis-response-cache)**
- 8개 use-case에 `ResponseCache.wrap` 적용 (Hero detail/list/abilities/patch-history, PatchNote list/latest/detail/entries)
- 키에 `lang` 포함, TTL은 SPEC 준수 (HERO 5분 / PATCH_LIST·LATEST 1분 / PATCH_DETAIL·ENTRIES 10분)
- scraper 4종 + hero:edit / patch:review CLI 성공 후 `invalidateAll()` (hero:* + patch:*) 호출
- Search는 결과 변동성과 캐시 효율 트레이드오프 고려해 미적용

**(H2) ~~`IsLocalhostGuard` Railway 환경에서 항상 차단됨~~ → 해결됨**
- `INTERNAL_API_KEY` env 설정 시 `x-internal-key` 헤더 매칭 모드, 미설정이면 기존 loopback IP fallback (dev 호환)
- prod 배포 시 Railway env에 `INTERNAL_API_KEY` (16자 이상) 추가하면 `/internal/*` 접근 가능

**(H3) ~~PENDING_REVIEW 패치의 수동 보정 entries가 다음 cron에서 삭제됨~~ → 해결됨**
- `existing.status === PUBLISHED`면 entries 변경 skip, 메타(title/summary/releasedAt)만 갱신
- DRAFT/PENDING_REVIEW는 기존처럼 replace 유지 — 검수 전 재파싱 워크플로우 보존
- 영문 번역(`titleTranslations`/`bodyTranslations`)도 PUBLISHED 보호 대상에 포함됨

### 4.2 MEDIUM

**(M1) ~~검색어 trim/공백 처리 부재~~ → 해결됨**
- `SearchRequestDto.q`에 `@Transform(({ value }) => value?.trim())` 적용. `ValidationPipe`가 `transform: true`라 동작 보장
- `q="   "`는 trim 후 빈 문자열 → `@MinLength(1)`에서 400 INVALID_REQUEST

**(M2) ~~Prisma 에러 코드 분류 부족 → 모든 P-* 가 500~~ → 해결됨**
- `HttpExceptionFilter.resolvePrismaError`에 코드별 분기 추가
- P2002 → 409 RESOURCE_CONFLICT, P2025 → 404 RESOURCE_NOT_FOUND, 그 외 P-* → 500 DATABASE_ERROR (기존 유지)
- `GLOBAL_ERRORS`에 `RESOURCE_CONFLICT`/`RESOURCE_NOT_FOUND` 추가

**(M3) Prisma 인덱스 누락**
- `PatchNote`: `(releasedAt)`, `(status)` 단일 인덱스만. `GetLatestPatchNote`는 `where status='PUBLISHED' orderBy releasedAt desc` — 복합 인덱스 `(status, releasedAt)` 가 더 적합
- `PatchNoteEntry`: `(patchNoteId, order)`, `(heroId)`. `GetHeroPatchHistory`는 `heroId + patchNote.status='PUBLISHED'` — 현재 인덱스로 1차 필터만 가능
- `Hero`: `(role)`만. 이름 검색 + 역할 필터 동시는 인덱스 1개만 활용
- 권장: 데이터 ≥ 수백 패치 / 영웅 100+ 영문 데이터 들어오면 검토. v1 규모(50영웅, 20패치)에서는 미미

**(M4) ~~스크래퍼 도메인 동시성이 인스턴스 메모리에만 존재~~ → 해결됨**
- `scraper-http.client.ts`를 Redis 기반 분산 lock으로 교체. `SET NX PX` + Lua script로 token 매칭 release
- 호스트별 lock(`scraper:lock:<host>`, TTL 30s) + 마지막 요청 시각(`scraper:last:<host>`, TTL = delay×5)으로 다중 인스턴스에서도 도메인별 직렬화 + 2초 delay 보장
- ConfigService 외 RedisService inject. 기존 in-memory Map(`inFlight`, `lastRequestAt`) 제거

**(M5) ~~스크래퍼 fetch 전 요청 단계에서 throw — undici v7 글로벌 dispatcher와 `maxRedirections` 옵션 비호환~~ → 해결됨**
- `apps/api/package.json`은 `undici@^6.20.0` 핀이지만 transitive로 undici@7.25.0이 함께 설치돼 글로벌 dispatcher가 v7로 잡힘
- v7에서 `maxRedirections`는 제거됨 → 호출 시 `InvalidArgumentError: maxRedirections is not supported, use the redirect interceptor`로 모든 스크래핑이 502 실패
- 해결: ScraperHttpClient가 자체 `Agent().compose(interceptors.redirect({maxRedirections}))` dispatcher를 보유, `request(url, { dispatcher })`로 명시 주입. v6/v7 모두 호환

### 4.3 LOW

- **(L1) ~~`/health` (공개) + `/internal/health` (guard) 중복~~ → 해결됨** — SPEC.md에 두 라우트와 접근 정책(공개 throttler vs guard) 명시
- **(L2) ~~`BlizzardHeroEnScraper`의 KR-한정 영웅 404 시 ScrapeJob status가 SUCCESS~~ → 해결됨** — `ScrapeJobRecorder.run`에 `skipped` 옵션 추가, 4xx 시 SKIPPED 상태로 기록
- **(L3) ~~`mergeTranslation` 중복 정의~~ → 해결됨** — `scraper/common/merge-translation.ts`로 추출, hero/patch-en 양쪽 import
- **(L4) ~~Patch entry 영문 매칭의 sequential update~~ → 해결됨** — `applyEntryTranslations` 매칭은 동기로 모으고 `Promise.all`로 일괄 update
- **(L5) ~~ja path 검색 OR 절이 데이터 없는데 항상 포함됨~~ → 해결됨** — `SearchQueryHandler`에서 `nameTranslations.ja` 절 제거. ja 데이터 수집 시 재추가
- **(L6) Playwright fallback 부재** — namuwiki Vue SPA로 메타 외 자동 추출 봉쇄됨. 능력/스탯 자동 보정 원하면 필수
- **(L7) ~~Ability slot mis-match silent 위험~~ → 해결됨** — `BlizzardHeroEnScraper.warnSuspiciousMatches` 추가. parsed.name이 비정상(빈값/2자 미만)이거나 KR name보다 현저히 짧으면 slot별 매핑을 warn 로그로 출력
- **(L8) ~~`.gitattributes` 부재~~ → 해결됨** — `* text=auto eol=lf` + 이미지/폰트 binary 표기 추가. Windows 체크아웃 시 CRLF noise 차단
- **(L9) ~~search subrole silent drop~~ → 해결됨** — `SearchUseCase.resolveSubrole`에서 invalid 시 `logger.warn(codename, subrole)` 후 null

### 4.4 잘된 부분

- 에러 처리: `AppException` 단일 통일, `HttpExceptionFilter`로 정규화. 응답 포맷 일관
- CQRS + UseCase 1:1 대응 명확
- DTO에 class-validator (MinLength, Max, IsIn, Type 변환) 적절. 페이지/페이지사이즈 `@Min(1) @Max(100)` 정상
- env Joi validation + `abortEarly: true`. helmet/compression production-only
- ThrottlerGuard 글로벌 적용 + Redis storage
- ScrapeJobRecorder로 모든 스크래핑 audit 트레일
- i18n cleanup PR (#35) 후 `resolveDescription` generic화 — type-safe + dead code 없음

---

## 5. 우선순위 다음 단계 (2026-05-28 갱신)

| # | 항목 | 노력 | 영향 |
|---|---|---|---|
| 1 | **main 릴리스 (PR #52)** | 2분 | **Critical** — search 핫픽스 prod 진입 |
| 2 | **apps/web 영웅 상세에 perks 섹션** | 0.5일 | High — perks가 사용자 화면에 표시됨 |
| 3 | **영웅별 perks 데이터 입력** | 영웅당 5~10분 × 52명 | High — D.Va 외 모두 빈 배열 |
| 4 | **Prod에서 hero:sync:en:all + patch:sync:en 실행** | 5분 (Railway 켤 때) | High — 영문 다국어 실데이터 노출 |
| 5 | **Prod 환경변수에 `INTERNAL_API_KEY` 16자 이상 추가** | 1분 | High — `/internal/*` 접근 회복 |
| 6 | **통합 테스트 골든패스 5개** | 0.5일 | Medium — 안전망 |
| 7 | **이미지 자체 호스팅 (S3 등)** | 1일 | Medium — perks iconUrl 채움 + portrait 핫링크 회피 |
| 8 | **Prisma 인덱스 보강** (M3) | 0.5일 + migration | Low (v1 규모) |

H1(Redis 캐시) / H2(internal guard) / H3(patch entries 보호) / M1(검색 trim) / M2(Prisma 4xx 분기) / M4(스크래퍼 분산 lock) / M5(undici redirect) / search case-insensitive(PR #50+#52) / HeroPerk 모델(PR #52)은 별도 PR로 해결됨.

Railway 배포 작업(#4, #5)은 사용자가 "한참 미룬다" 결정 — 우선순위에 있지만 차단 상태.

---

## 6. 장기 / 검토 후 결정

- **HeroPerk i18n 영문 데이터** — 컬럼은 있지만 데이터 0건. Blizzard 영문 perk 페이지 구조 미검증. 일단 KO만 채우고 영문은 후속
- **PatchNoteEntry.perkId 자동 매핑** — FK는 있지만 patch scraper는 perk 변경을 인식 못 함. 패치마다 perk 수치 바뀔 때 entry에 perkId 채우는 워크플로우/CLI 미구현
- **이미지 자체 호스팅 (S3 등)** — 현재 `hero.portraitUrl`이 `i.namu.wiki` 핫링크. namu Cloudflare가 referrer 기반으로 부분 차단(403)해서 사용자 화면에서 이미지 깨짐. perks의 iconUrl도 같은 문제. 작업 범위: scraper 또는 별도 cron이 portraitUrl/iconUrl을 fetch → S3/R2/Railway volume에 저장 → DB URL을 자체 도메인으로 치환. 이미지 의존도 namu→0, hotlink 차단 회피 + 로딩 속도 개선
- **불완전 영웅 능력/스탯 수동 보정** — 현재 1 ability만 있는 emre/jetpack-cat/mizuki/vendetta/wuyang + 0 ability인 anran/domina는 `pnpm hero:edit <codename>` + Prisma Studio로 채워야 함 (parser는 og:meta만 추출하는 정책. namuwiki Vue SPA로 자동 추출 불가)
- 통합 테스트 (jest + supertest) — 최소 골든 패스 5개 (heroes list, hero detail, patch list, patch detail, search)
- Cron success 후 web `revalidatePath` 호출 — ISR 즉시 무효화
- `nameTranslations`/`titleTranslations` 검색 case-insensitive (raw SQL `LOWER()` 또는 pg_trgm)
- ja 데이터 수집 (현재 토글 disabled) — Blizzard 일본어 페이지가 영문과 동일 selector 사용 가능성 검토
- KR 한정 영웅(domina/anran/sierra/jetpack-cat/mizuki/wuyang) 영문 명/설명 — Blizzard 페이지 없음. fallback source 또는 manual `hero:edit`
- SUBROLE_PASSIVES 영문 verbatim — `apps/web/src/lib/labels.ts`가 직역. Blizzard 공식 영문 확인 후 갱신
- Playwright fallback — namuwiki Vue SPA로 메타 외 자동 추출 봉쇄됨. 능력/스탯 자동 보정 원하면 필수
- Hero 신규 추가 시 catalog/registry 누락 방지 — script로 hero-catalog ↔ DB diff 비교

---

## 7. 메모리 / 참고

- 메모리 파일: `~/.claude/projects/.../memory/watchpoint_i18n_release.md` — i18n 릴리스 상세
- 메모리 인덱스: `~/.claude/projects/.../memory/MEMORY.md`
- 기획/스펙: `SPEC.md`
- 설치/운영: `README.md`
- 개발 컨벤션: `CLAUDE.md`
