# Watchpoint — 진행 현황 / 남은 작업

> 2026-05-26 기준. SPEC.md의 도메인/엔드포인트 명세 + i18n 릴리스 (#30~#35) 머지 직후 시점의 스냅샷.

## 1. 한눈에

| 영역 | 상태 | 비고 |
|---|---|---|
| 도메인 모델 (Hero/PatchNote/Entry/Scrape) | ✅ 완료 | SPEC 일치 + i18n 필드 6개 추가 |
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

**(M1) 검색어 trim/공백 처리 부재**
- 위치: `apps/api/src/search/presenter/http/dto/search.dto.ts:18` — `@MinLength(1)`만 있고 `@Transform(trim)` 없음
- 동작: `q="   "` 통과 → `contains: "   "` 로 DB 풀스캔 가능
- 권장: `@Transform(({ value }) => value?.trim())` 추가 + `MinLength(1)` 재검증

**(M2) Prisma 에러 코드 분류 부족 → 모든 P-* 가 500**
- 위치: `apps/api/src/common/filters/http-exception.filter.ts:35-42, 87-94`
- 영향: P2002(unique violation), P2025(record not found) 모두 500 DATABASE_ERROR로 응답. 클라이언트가 4xx vs 5xx 구분 못함
- 권장: P2002 → 409 CONFLICT, P2025 → 404 NOT_FOUND 매핑

**(M3) Prisma 인덱스 누락**
- `PatchNote`: `(releasedAt)`, `(status)` 단일 인덱스만. `GetLatestPatchNote`는 `where status='PUBLISHED' orderBy releasedAt desc` — 복합 인덱스 `(status, releasedAt)` 가 더 적합
- `PatchNoteEntry`: `(patchNoteId, order)`, `(heroId)`. `GetHeroPatchHistory`는 `heroId + patchNote.status='PUBLISHED'` — 현재 인덱스로 1차 필터만 가능
- `Hero`: `(role)`만. 이름 검색 + 역할 필터 동시는 인덱스 1개만 활용
- 권장: 데이터 ≥ 수백 패치 / 영웅 100+ 영문 데이터 들어오면 검토. v1 규모(50영웅, 20패치)에서는 미미

**(M4) 스크래퍼 도메인 동시성이 인스턴스 메모리에만 존재**
- 위치: `apps/api/src/scraper/common/scraper-http.client.ts:13-14` — `Map<host, ...>`
- 영향: API 인스턴스 2개 이상 띄우면 동시 요청 가능 → Blizzard rate limit 위반 위험
- 권장: Redis 분산 lock 또는 ScrapeJob.RUNNING 상태 기반 진입 가드. 현재 단일 인스턴스라면 비-블로커

### 4.3 LOW

- **(L1) `/health` (공개) + `/internal/health` (guard) 중복** — Railway probe용으로 의도된 분리지만 SPEC.md에 명시 안 됨. SPEC update만 필요
- **(L2) `BlizzardHeroEnScraper`의 KR-한정 영웅 404 시 ScrapeJob status가 SUCCESS** — 의미상 SKIPPED. `recorder.run` 결과에 skip 분기 추가
- **(L3) `mergeTranslation` 중복 정의** — `blizzard-hero.scraper.ts:160`, `blizzard-patch-en.scraper.ts:165`. `scraper/common`으로 추출
- **(L4) Patch entry 영문 매칭의 sequential update** — `applyEntryTranslations`가 entry별 `await prisma.update()`. `Promise.all` 또는 `$transaction` 묶기
- **(L5) ja path 검색 OR 절이 데이터 없는데 항상 포함됨** — ja 활성화 전엔 제거 가능
- **(L6) Playwright fallback 부재** — SPEC에서 "필요 시"라 미구현. Blizzard가 동적 렌더링 도입 시에만 작업
- **(L7) Ability slot mis-match silent 위험** — DB MATCH_SLOT_ORDER ↔ Blizzard slide 순서가 같다는 가정. 신규 영웅에서 sanity check (parsed.name 길이/유사도) 없음
- **(L8) `.gitattributes` 부재** — Windows 환경에서 매번 100+ 파일 CRLF noise. `* text=auto eol=lf` 한 줄로 해결
- **(L9) search subrole silent drop** — `search.use-case.ts:34` `isSubrole(hero.subrole) ? ... : null`. invalid subrole 들어오면 조용히 null. `Logger.warn` 권장

### 4.4 잘된 부분

- 에러 처리: `AppException` 단일 통일, `HttpExceptionFilter`로 정규화. 응답 포맷 일관
- CQRS + UseCase 1:1 대응 명확
- DTO에 class-validator (MinLength, Max, IsIn, Type 변환) 적절. 페이지/페이지사이즈 `@Min(1) @Max(100)` 정상
- env Joi validation + `abortEarly: true`. helmet/compression production-only
- ThrottlerGuard 글로벌 적용 + Redis storage
- ScrapeJobRecorder로 모든 스크래핑 audit 트레일
- i18n cleanup PR (#35) 후 `resolveDescription` generic화 — type-safe + dead code 없음

---

## 5. 우선순위 다음 단계 (top 5)

| # | 항목 | 노력 | 영향 |
|---|---|---|---|
| 1 | **Prod에서 hero:sync:en:all + patch:sync:en 실행** | 5분 (대기 + 검증) | High — 영문 다국어 실데이터 노출 |
| 2 | **Prod 환경변수에 `INTERNAL_API_KEY` 16자 이상 추가** | 1분 | High — `/internal/*` 접근 회복 |
| 3 | **검색어 trim + Prisma 에러 코드 분기** (M1, M2) | 2시간 | Medium — UX/안정성 |
| 4 | **Prisma 인덱스 보강** (M3) | 0.5일 + migration | Medium (장기) |
| 5 | **스크래퍼 분산 lock** (M4) | 0.5일 | Medium — 인스턴스 ≥2 시 필요 |

H1(Redis 캐시) / H2(internal guard) / H3(patch entries 보호)는 별도 PR로 해결됨.

---

## 6. 장기 / 검토 후 결정

- 통합 테스트 (jest + supertest) — 최소 골든 패스 5개 (heroes list, hero detail, patch list, patch detail, search)
- Cron success 후 web `revalidatePath` 호출 — ISR 즉시 무효화
- `nameTranslations`/`titleTranslations` 검색 case-insensitive (raw SQL `LOWER()` 또는 pg_trgm)
- ja 데이터 수집 (현재 토글 disabled) — Blizzard 일본어 페이지가 영문과 동일 selector 사용 가능성 검토
- KR 한정 영웅(domina/anran/sierra/jetpack-cat/mizuki/wuyang) 영문 명/설명 — Blizzard 페이지 없음. fallback source 또는 manual `hero:edit`
- SUBROLE_PASSIVES 영문 verbatim — `apps/web/src/lib/labels.ts`가 직역. Blizzard 공식 영문 확인 후 갱신
- Playwright fallback (SPEC 옵션) — Blizzard 동적 렌더링 도입 시
- Hero 신규 추가 시 catalog/registry 누락 방지 — script로 hero-catalog ↔ DB diff 비교

---

## 7. 메모리 / 참고

- 메모리 파일: `~/.claude/projects/.../memory/watchpoint_i18n_release.md` — i18n 릴리스 상세
- 메모리 인덱스: `~/.claude/projects/.../memory/MEMORY.md`
- 기획/스펙: `SPEC.md`
- 설치/운영: `README.md`
- 개발 컨벤션: `CLAUDE.md`
