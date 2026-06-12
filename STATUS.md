# Watchpoint — 진행 현황 / 남은 작업

> 2026-06-12 작업 종료 시점. main = `593ef5c` (PR #120 머지), develop = `4c10874` (PR #119 머지).
> **운영 인프라 1차 완성 + 데이터 출처 이중화 + 자동화 강화 + 관측성 1단계 + Dependabot 첫 release + 영웅 페이지 리디자인 + 나무위키 재도입(비영리 운영 확정) + hero description seed 버그 수정 + 검색엔진 등록 + ISR revalidate + 한국어 SEO 별칭** — Railway API + Vercel Web + MinIO cdn + SEO + favicon + OG 모두 prod 반영, 나무위키 출처 재도입(CC BY-NC-SA → 비영리 운영 확정), patch cron이 한국어 + 영문 sync 둘 다 자동 실행, Sentry 에러 트래커 코드 도입, MCP 4종 등록 완료, Dependabot 안전한 5종 main release, 영웅 리스트/상세 포트레이트 카드 그리드 리디자인, 나무위키 한국어 ability 명칭 fallback sync + prod 51명 적용, hero description seed 무한 덮어쓰기 버그 수정 + prod 51명 갱신, Google/Naver Search Console verification + sitemap 제출, web ISR revalidate 훅 + Railway/Vercel env 적용, 한국어 검색 노출용 '감시기지 Watchpoint' 별칭 추가.
> 이번 세션(2026-06-12): **Google Search Console + Naver Search Advisor 등록 + sitemap 제출 완료, `INTERNAL_API_KEY` Railway 등록, web ISR `revalidatePath` 훅 도입(PR #118 → #120) + Railway/Vercel env 등록, 한국어 검색용 '감시기지' 별칭(PR #119 → #120) — 홈 `<title>`/keywords/JSON-LD `alternateName`에만 노출**. STATUS.md 보안 후속 항목 정리.
> 직전 세션(2026-06-11): Dependabot safe 5종 main release(PR #103), 영웅 리스트/상세 리디자인(PR #105/#106), 특전/능력 영문 sync(PR #108/#109), 나무위키 1단계 인프라(PR #110/#111) + 2단계 한국어 ability 명칭 fallback(PR #112/#113), 5단계 hero description seed 버그 수정(PR #115/#116), Railway CLI(SSH key + DB public proxy)로 prod 51명 namu/description 적용. 3·4단계는 스킵.

## 0. 다음 작업

### 1순위: 운영 모니터링 (즉시 가능)
- **첫 cron tick 모니터링** (6h 주기, `SCRAPER_PATCH_CRON='0 */6 * * *'`) — Railway logs에서 `revalidate ok: N paths` + `sync ok` / `sync:en ok` 로그 확인. 처음 한 번 정상이면 자동화 검증 완료
- **Sentry dashboard** prod 이벤트 도착 여부 확인 (Railway/Vercel env 둘 다 등록 완료)
- **검색엔진 인덱싱 추적** — Google Search Console / Naver Search Advisor에서 sitemap 처리 / 인덱싱 진행도 확인 (며칠~몇 주 단위)

### 2순위: Dependabot major PR 검토 (사용자 결정 필요)
- **#97 Next.js 16** (15.5.18 → 16.2.9): turbopack 변경, React 19 흐름. release note 검토 필요
- **#98 @types/node 25** (22.19.19 → 25.9.2): Node 22 LTS 런타임과 type 버전 어긋남. 호환 검증 필요
- **#100 undici 8** (6.25.0 → 8.4.1): scraper에서 사용 중. fetch API 호환 검증 필요

### 3순위 (큰 작업, 보류): URL 기반 locale routing
- 현재 cookie 기반 i18n → 페이지 전부 Dynamic Rendering, hreflang/alternates.languages 미설정
- `/ko/...`, `/en/...` URL 라우팅으로 옮기면:
  - `generateStaticParams` 가능 → 정적 프리렌더로 SEO/속도 향상
  - `hreflang` + `alternates.languages` 가능 → 다국어 검색 인덱싱
- 라우팅/링크/lang-toggle/middleware 전체 리팩토링 필요

### 4순위 (큰 작업, 보류): 테스트 작성
- API: 핸들러 단위 + e2e 통합 테스트
- Web: RSC 페이지 스냅샷 + 핵심 인터랙션 e2e

### 기타 미진행
- 홈 페이지 디자인 (현재 placeholder)
- RSS feed (패치노트 적재 시 푸시 — 현재 트래픽 수준에선 ROI 낮음)

### 최근 종료된 항목 (참고)
- **나무위키 재도입 1·2·5단계 + prod 적용** (2026-06-11 PR #110~#116). 3·4단계는 스킵 확정 — 사유는 `memory/watchpoint_pending_review.md`
- **검색엔진 등록** (2026-06-12): Google Search Console + Naver Search Advisor verification + sitemap.xml 제출 완료
- **`INTERNAL_API_KEY` Railway 등록** (2026-06-12, 32자 base64url)
- **web ISR revalidate 훅** (PR #118 → #120): API/Web 코드 + Railway/Vercel env 모두 적용. 다음 cron tick에서 `revalidate ok` 로그 발생 예정
- **한국어 SEO 별칭** (PR #119 → #120): 홈 `<title>` / keywords / JSON-LD `alternateName`에 '감시기지 Watchpoint' 노출. 본문/Header/Footer/OG는 `Watchpoint` 그대로

---

## 1. 한눈에

| 영역 | 상태 | 비고 |
|---|---|---|
| **Railway API prod 배포** | ✅ | `api.o-watchpoint.com` |
| **Vercel Web prod 배포** | ✅ | `o-watchpoint.com` |
| **도메인 연결 (apex + api + cdn)** | ✅ | 가비아 DNS — A/CNAME/TXT |
| **MinIO 자산 prod 업로드** | ✅ | 523개, `cdn.o-watchpoint.com/watchpoint-icons/...` |
| **cdn.o-watchpoint.com 서브도메인** | ✅ | Railway custom domain → port 9000 |
| **boot-seeder 4-phase 자동화** | ✅ | ko/en/portrait/icons (PR #74) |
| **Prisma 7 runtime deps** | ✅ | PR #76 |
| **Vercel monorepo build (vercel.json)** | ✅ | PR #79 |
| **SEO 메타데이터 (페이지별 generateMetadata)** | ✅ | OG/Twitter/canonical 적용 |
| **SEO JSON-LD 구조화 데이터** | ✅ | PR #80 |
| **sitemap.xml + robots.txt** | ✅ | 동적 영웅/패치 포함 + `/_next/` 차단 + host |
| **opengraph-image (홈/영웅/패치)** | ✅ | PR #82/#83 핫픽스 (Pretendard URL 교체) |
| **동적 favicon (icon.png/apple-icon.png)** | ✅ | PR #81, Watchpoint 로고 |
| **PWA manifest** | ✅ | PR #81, `theme_color: #fa9c1d` |
| **검색엔진 verification 메타 구조** | ✅ | PR #81, env 미설정 시 메타 생략 |
| **나무위키 출처 제거 (Blizzard 일원화)** | ↩ 되돌림 | PR #84/#85 → PR #110/#111로 재도입 |
| **나무위키 source 재도입 (1단계 인프라)** | ✅ | PR #110/#111, footer/SPEC/README/CLAUDE 라이선스 명시 + 비영리 운영 확정 |
| **나무위키 한국어 ability 명칭 fallback (2단계)** | ✅ | PR #112/#113 + Railway CLI로 prod 51명 sync 완료 (능력 갱신 3, 톱니칼 등 적용) |
| **나무위키 아이콘 fallback (3단계)** | ⏭ 스킵 | namuwiki SSR에 능력 아이콘 미노출, 수작업 업로드만 가능 |
| **영웅 국적 표기 (4단계)** | ⏭ 스킵 | 블리자드 location 첫 토큰이 도시/기지인 케이스 多, 정적 매핑 ROI ↓ |
| **hero description sync 버그 (5단계)** | ✅ | PR #115/#116 + Railway CLI로 prod 51명 description 공식값 갱신 완료 |
| **영문 patch cron 자동화** | ✅ | PR #88/#89, tick당 ko + en sync 둘 다 실행 |
| **Sentry 에러 트래커 (API + Web)** | 🟡 env 등록 완료 | PR #90/#92. Railway/Vercel env 등록 완료, dashboard 이벤트 도착 확인만 남음 |
| **Dependabot** | ✅ | PR #91/#92 설정, PR #103로 첫 release 5종 적용 |
| **MCP (Railway/Vercel/GitHub/Postgres-RO)** | ✅ | user scope 등록 완료. 4종 정상 동작 (GitHub은 공식 Docker 이미지) |
| **Google/Naver Search Console 등록** | ✅ | 2026-06-12, verification + sitemap 제출 완료. 인덱싱은 며칠~몇 주 |
| **`INTERNAL_API_KEY`** | ✅ | Railway env 설정 완료 (2026-06-12, 32자 base64url) |
| **prod 영문 패치노트 보강** | 🔲 | 다음 cron tick에 자동 처리 |
| **첫 cron tick 모니터링** | 🔲 | 6h 주기 |
| **URL 기반 locale routing** | 🔲 | hreflang/generateStaticParams 위한 선행 작업 |
| **테스트 (jest/e2e)** | 🔲 | 미작성 |
| **홈 페이지 디자인** | 🟡 placeholder | |
| **`revalidatePath` (web ISR 무효화)** | ✅ | PR #118 → #120, Railway + Vercel env 양쪽 적용 완료 |
| **한국어 SEO 별칭 ('감시기지')** | ✅ | PR #119 → #120, 메타에만 노출 (홈 title / keywords / JSON-LD alternateName) |

---

## 2. 이번 세션 주요 작업 (2026-06-12)

### 검색엔진 등록 — Google + Naver
**Why**: 사이트 검색 노출의 1순위 외부 단계. 인덱싱 시작은 며칠~몇 주지만 등록 자체는 1회성 작업이라 미루지 않는 게 효율적.

**진행 결과**:
- **Google Search Console**: URL 접두어(`https://o-watchpoint.com`) 방식 + HTML 메타 verification → Vercel Production env `WEB_GOOGLE_SITE_VERIFICATION` 등록 → 자동 redeploy → verify 클릭 성공 → sitemap `sitemap.xml` 제출 완료
- **Naver Search Advisor**: 동일 패턴 — `WEB_NAVER_SITE_VERIFICATION` env 등록 + 소유확인 + sitemap 제출 완료
- **Bing**: 사용자 선택으로 스킵
- `apps/web/src/app/layout.tsx`의 `buildVerification()` 구조가 이미 마련돼 있어서 env 채우기만으로 메타 자동 노출

### `INTERNAL_API_KEY` Railway 등록
**Why**: `/internal/*` 가드(`IsLocalhostGuard`)가 prod 환경에서 reverse proxy 뒤라 loopback 매칭 불가 → env 미설정 시 항상 차단되던 상태.

**진행**: `node -e "crypto.randomBytes(24).toString('base64url')"`로 32자 키 생성 → `railway variables --service watchpoint --set "INTERNAL_API_KEY=<값>"`. `IsLocalhostGuard`가 `x-internal-key` 헤더 매칭 모드로 자동 전환.

### web ISR `revalidatePath` 무효화 훅 도입 (PR #118 → #120)
**Why**: web ISR `revalidate=300`(영웅) / `600`(패치) / `3600`(목록)로 캐시. cron이 새 patch 적재해도 web은 최대 1h 동안 옛 캐시 노출. CLAUDE.md "캐시 전략"에 명시돼 있었지만 호출 코드 없었음.

**구조**:
- **web** `apps/web/src/app/api/revalidate/route.ts` — POST endpoint
  - `x-revalidate-secret` 헤더 timing-safe 비교 (`crypto.timingSafeEqual`)
  - body `{ paths: string[] }` sanitize (`/`로 시작 필수, 개행 차단, MAX 200개)
  - 통과한 경로마다 `revalidatePath(path)` 호출
- **api** `apps/api/src/scraper/web/web-revalidator.service.ts` — undici로 web 호출
  - `WEB_REVALIDATE_URL` + `WEB_REVALIDATE_SECRET` 둘 다 set일 때만 호출 (없으면 silent skip — 로컬 개발 영향 없음)
  - 네트워크 실패는 warn 로그만 — sync 자체는 이미 성공한 후 호출되니 무효화 실패가 데이터 무결성과 무관
- **`BlizzardPatchScraper`**
  - `SyncSummary`에 `affectedVersions` 추가 (created + non-PUBLISHED updated 패치 version 집계)
  - sync 직후 patch path(`/patch-notes`, `/patch-notes/<version>`, 홈) 즉시 revalidate
  - 백그라운드 `syncAffectedHeroes` 끝에 hero path(`/heroes/<codename>`, `/heroes`, 홈) revalidate
- `app.module.ts` Joi 스키마에 `WEB_REVALIDATE_URL` / `WEB_REVALIDATE_SECRET` 등록

**env 적용**: Railway watchpoint 서비스 `WEB_REVALIDATE_URL=https://o-watchpoint.com` + `WEB_REVALIDATE_SECRET` (24자 base64url), Vercel watchpoint-web Production `WEB_REVALIDATE_SECRET` 동일 값.

### 한국어 SEO 별칭 — '감시기지 Watchpoint' (PR #119 → #120)
**Why**: 사이트 공식 명칭은 `Watchpoint` 유지하되, 한국어 사용자가 '감시기지' / '감시기지 Watchpoint' / '오버워치 감시기지'로 검색해도 인덱싱되도록 메타에만 별칭 추가. UI / 본문 / Header 로고 / Footer / OG/Twitter 카드는 깨끗하게 유지(사용자 명시 요구).

**변경 표면 (ko만 적용, en/ja는 `Watchpoint` 그대로)**:
- `apps/web/src/app/page.tsx` 홈 `<title>`: `Watchpoint — ...` → `감시기지 Watchpoint — ...`
- `apps/web/src/app/layout.tsx` default title fallback (404 등 자체 title 미지정 페이지): `Watchpoint` → `감시기지 Watchpoint`
- `KEYWORDS_BY_LOCALE.ko`에 `감시기지`, `감시기지 Watchpoint`, `오버워치 감시기지` 추가
- `apps/web/src/lib/seo.ts` `buildWebSiteJsonLd`에 `alternateName: ['감시기지', '감시기지 Watchpoint', '오버워치 감시기지']` 추가 (전역)

**손 안 댄 표면**: description / 본문 콘텐츠 / Header 로고 / Footer / OG title / Twitter title — 모두 `Watchpoint` 그대로 유지.

검색 엔진이 사이트 식별자로 '감시기지'를 인식하기까지 며칠~몇 주 걸림. 즉시 효과 X.

### STATUS.md 보안 후속 항목 정리 (PR #118 포함)
**Why**: STATUS.md는 git 공개 리포에 올라가는 문서. 노출 위험이 있는 보안 후속 항목(특정 토큰 revoke 안내 등)이 평문으로 들어있어 공격 단서가 될 수 있음.

**조치**: STATUS.md에서 해당 텍스트 제거. 사용자 본인 참고용 내용은 메모리(`watchpoint_pending_review.md`)에만 유지.

---

## 3. 직전 세션 주요 작업 (2026-06-11)

### 나무위키 source 재도입 — 비영리 운영 확정 (PR #110/#111, #112/#113)
**Why**: 블리자드 공식 페이지에 없는 한국어 ability 명칭(예: 정커퀸 톱니칼 ← 'jagged-blade'), 누락 아이콘 5개(freja PRIMARY / mauga PRIMARY+SECONDARY / junker-queen SECONDARY / bastion SECONDARY), 영웅 국적 등 메타 데이터가 나무위키에만 존재. 비영리 운영으로 영구 확정하면 CC BY-NC-SA 2.0 KR 만족 가능.

**1단계 인프라 (PR #110/#111)**:
- `ScrapeSource.NAMUWIKI_HERO` enum에서 `@deprecated` 제거
- `NamuwikiHeroParser` / `NamuwikiHeroScraper` 모듈 재등록
- web `next.config.ts`에 `i.namu.wiki` remotePattern 복원
- footer/`labels.ts` `footerAttribution`에 "나무위키 (CC BY-NC-SA 2.0 KR)" 복원
- SPEC.md/README.md/CLAUDE.md/cSpell에 라이선스 명시 + **비영리 운영 영구 확정** 문구 추가
- memory `watchpoint_post_deploy.md`에 2026-06-11 비영리 결정 기록

**2단계 한국어 ability 명칭 fallback (PR #112/#113)**:
- `NamuwikiHeroParser` rewrite: anchor id(`#s-X.Y`) + 본문 TOC 텍스트 패턴 `^[\d.]+\. <키표시> - <한글>(<영문>)$` 사용 (Vue class 불안정성 우회)
- `NamuwikiHeroScraper` rewrite: blizzardId 직매칭 → `ABILITY_ID_TO_SLOT` override → 실패 시 unmatched
- `NAMUWIKI_PAGE_TITLES` 51명 codename → 나무위키 페이지 제목 매핑 (e.g., `'junker-queen': '정커퀸'`)
- `ABILITY_ID_TO_SLOT['junker-queen']`에 `'jagged-blade': 'SECONDARY'` 추가 (톱니칼 → SECONDARY 슬롯)
- CLI 신설: `hero:sync:namu <codename>` / `hero:sync:namu:all`
- DB의 `ability.name`(한국어)만 덮어쓰고 `nameTranslations.en`은 보존(블리자드 영문 sync 데이터)
- 활성화: Railway shell에서 `pnpm hero:sync:namu junker-queen` 단일 시험 → 정상이면 `:all`로 51명 일괄 적용

**3단계 (스킵)**: 아이콘 fallback — 나무위키 raw HTML 검증 결과 능력 아이콘이 SSR에 포함되지 않음(SPA 동적 렌더링 + 텍스트 위주 위키). 자동 fallback 불가. 누락 5개는 인게임 스크린샷 수작업 업로드(`apps/web/public/icons/heroes/<codename>/abilities/<slot>.png`)로만 처리 가능.

### 영웅 리스트/상세 리디자인 (PR #105 → develop, PR #106 → main)
**Why**: 기존 32px 썸네일 + 데이터 테이블 형태는 게임 콘텐츠 사이트에 어울리지 않음. portrait가 시각 정보로 기능하지 못함. 오버워치 공식 영웅 페이지 패턴(portrait 중심 카드)으로 전환.

**영웅 리스트 (`/heroes`)**:
- 테이블 → `aspect-[4/5]` portrait 카드 그리드 (`HeroCard` + `HeroGrid` 신설, 기존 `HeroListTable` 제거)
- 카드: full-bleed portrait + role 색상 top bar + 우상단 role badge + 하단 25% 옅은 그라데이션(from-black/40)
- 텍스트 가독성: text-shadow로 그라데이션 의존도 낮춤, subrole 한글에 font-mono 제거하고 12px font-semibold
- hover: portrait scale 1.1 + role color ring + 카드 lift
- role tab/정렬 토글을 segmented control로 정리 (`SortToggle` 신설)
- 그리드: `grid-cols-2 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5` (기존 대비 컬럼 -1씩, 카드 폭 약 20% 증가)

**영웅 상세 (`/heroes/[codename]`)**:
- `HeroPortrait` `xl` 사이즈 추가 (h-52 md:h-64 — 208/256px)
- 타이틀 4xl → 6xl, role gradient radial 배경 강조
- stat을 chip 형태(border + bg + 모노 숫자)로 분리

**기타**: `loading.tsx` 카드 그리드 비율로 맞춤, biome 자동 포맷 적용. 사용자 피드백 반영하여 그라데이션 옅게(2회), subrole 폰트 변경, 카드 크기 20% 확대.

### Dependabot 8개 PR 검토 + 안전한 5종 main release (PR #103)
**검토 결과 (8개)**:
- ✅ **머지(5종)**: #93 `actions/checkout v4→v6`, #94 `actions/setup-node v4→v6`, #95 `pnpm/action-setup v4→v6`, #96 `@nestjs/* 11.1.20→11.1.26 patch`, #99 `@biomejs/biome 2.4.15→2.4.16 patch`
- 🟡 **보류(3종, major)**: #97 `next 15→16`, #98 `@types/node 22→25`, #100 `undici 6→8` — 사용자 결정 후 별도 진행
- 5종 develop 머지 후 `release: Dependabot safe 5종` PR #103 main 머지. Railway/Vercel auto-redeploy 확인.
- target-branch=develop 컨벤션 그대로 동작, grouped PR 흐름 검증 완료.

### MCP 4종 등록 완료 (직전 세션 연장)
- **Railway**: HTTP (Bearer)
- **Vercel**: HTTP (Bearer, read-only scope)
- **GitHub**: 공식 Docker `ghcr.io/github/github-mcp-server` (PAT) — 기존 npm `@modelcontextprotocol/server-github`는 deprecated
- **Postgres-RO**: npm stdio, readonly role (`watchpoint_readonly`) + `sslmode=no-verify` (Railway 자체 서명 cert)

### Sentry env 등록 + Vercel build inline 반영
- Railway `SENTRY_DSN` + Vercel `NEXT_PUBLIC_SENTRY_DSN` 모두 등록. PR #102/#103 main 머지로 Vercel build 재실행 → `NEXT_PUBLIC_SENTRY_DSN` inline 반영.
- 남은 작업: Sentry dashboard에 prod 이벤트 도착 여부 확인.

---

## 4. 이전 세션 작업 (2026-06-10)

### 영문 patch cron 자동화 (PR #88 → develop, PR #89 → main)
- `BlizzardPatchCron.run()`에서 한국어 sync 다음에 `BlizzardPatchEnScraper.sync()`도 자동 호출. tick(6h)마다 ko + en 둘 다 실행.
- 둘은 try/catch 분리 — 한쪽 실패해도 다른 쪽 별도 시도.
- 결과: 수동 `pnpm patch:sync:en`은 디버깅용만, 새 패치 영문 보강 자동화.

### Sentry 에러 트래커 도입 (PR 진행 중)
**Why**: cron 실패/prod 5xx/Next.js render 에러 가시성 0 → 1인 운영에서 장애 빠른 감지 필수. 무료 Developer 플랜(5K errors/month) 사용.

**API**:
- `apps/api/src/instrument.ts`가 `SENTRY_DSN`을 읽어 `Sentry.init`. `main.ts` 최상단 `import './instrument'`.
- `HttpExceptionFilter`가 5xx 발생 시 자동 `Sentry.captureException` (4xx는 noise라 skip).
- `BlizzardPatchCron`이 sync 실패 시 phase 태그(ko/en)와 함께 capture.
- Joi schema에 `SENTRY_DSN` optional 추가.

**Web**:
- `sentry.{client,server,edge}.config.ts` + `instrumentation.ts` (Next.js 15 hook) + `next.config.ts`의 `withSentryConfig` wrap.
- `NEXT_PUBLIC_SENTRY_DSN`이 build 시 inline.
- `tunnelRoute: '/monitoring'` (adblock 우회), `hideSourceMaps`, `disableLogger`, `widenClientFileUpload` 옵션.

**둘 다**: DSN env 비어 있으면 init 스킵 (silent). production만 `tracesSampleRate: 0.1`. Session replay는 일단 끔.

**활성화 절차 (남은 작업)**:
- API: Railway env `SENTRY_DSN` 설정 → 자동 재배포
- Web: Vercel env `NEXT_PUBLIC_SENTRY_DSN` 설정 → 수동 Redeploy (NEXT_PUBLIC_ build-time inline)

---

## 5. 이전 세션 작업 (2026-06-08)

### 나무위키 데이터 출처 제거 (PR #84 → develop, PR #85 → main)
**Why**: 나무위키 콘텐츠는 CC BY-NC-SA 2.0 KR — NC(비영리) 조건 명시. 광고/수익화 시 명백한 라이선스 위반. Blizzard 공식만 쓰면 NC 제약 사라짐 (단 Blizzard Fan Content Policy상 영리 운영은 여전히 회색지대).

**삭제/교체**:
- `apps/api/src/scraper/namuwiki/` 디렉토리 전체 제거 (parser/scraper/dto)
- `scraper.module.ts`에서 namuwiki provider/export 제거
- `blizzard-patch.scraper.ts`의 `syncAffectedHeroes` → `BlizzardHeroKoScraper.sync`로 교체 (boot-seeder의 ko-sync가 이미 동일 데이터 채우므로 손실 없음)
- `hero:sync` / `hero:sync:all` CLI → `BlizzardHeroKoScraper`로 재배선 (단일 영웅 강제 sync 유지)
- `hero-catalog.ts` / `hero-registry.ts`의 `pageTitle` 필드(나무위키용) 제거
- `seed.ts`의 `sourceUrl` 초기값(`https://namu.wiki/w/...`) 제거 → ko-sync가 Blizzard URL로 채움
- `ScrapeSource.NAMUWIKI_HERO` enum value는 기존 ScrapeJob row 호환 위해 `@deprecated` 주석만, schema는 유지
- Web: footer 나무위키 링크/CC 라이선스 라벨 제거 → "Blizzard 공식 영웅 정보" 링크로 교체
- Web: `next.config.ts` `i.namu.wiki` remotePatterns 제거
- Web: `labels.ts` ko/en `footerAttribution` + `home.description` 갱신
- Web: 홈 StatCard "데이터" sub `+ 나무위키` → `공식 출처`
- Docs: CLAUDE/README/SPEC/STATUS 데이터 출처 섹션 동기화

**검증 (prod)**:
- `curl https://o-watchpoint.com/` → "나무위키"/"namu.wiki"/"Namuwiki"/"CC BY-NC-SA" 표기 0건
- footer "Blizzard 공식 패치노트", "Blizzard 공식 영웅 정보", "Blizzard Entertainment와 무관한 팬 프로젝트" 정상 노출

**DB 후속 (예정)**:
- prod hero 중 `sourceUrl`이 `namu.wiki/*`인 row는 boot-seeder 재가동 / `pnpm hero:sync:all` 1회 실행하면 자연 갱신

---

## 6. 2026-06-07 세션

### 도메인 연결 (`o-watchpoint.com`)
1. **apex Vercel 연결**: 가비아 DNS A 레코드 `@ → 216.198.79.1`
2. **api 서브도메인 Railway**: CNAME `api → xxxxx.up.railway.app` + TXT `_railway-verify.api → <토큰>` — Railway Custom Domain 추가 (Target Port 8080) + Let's Encrypt 자동 발급
3. **cdn 서브도메인 Railway MinIO**: 동일 방식, Target Port **9000(API)**

### MinIO cdn 전환 (PR 없음, prod 직접 실행)
1. MinIO bucket `watchpoint-icons` public-read 정책 (`mc anonymous set download`)
2. `pnpm --filter @watchpoint/api assets:upload` 로컬에서 prod env로 실행:
   - 523개 자산 업로드 (`apps/web/public/icons/...` → `cdn.o-watchpoint.com/watchpoint-icons/icons/...`)
   - DB URL 일괄 교체: **heroes 51 / abilities 264 / perks 204**
3. Railway/Vercel `MINIO_PUBLIC_URL=https://cdn.o-watchpoint.com/watchpoint-icons` env 갱신 + 재배포
4. 검증: hero 상세 페이지 img src가 cdn 도메인, GET 200 OK

### SEO 보강 (PR #80 머지)
- **JSON-LD 구조화 데이터**: 홈 `WebSite+SearchAction`, 영웅/패치 목록 `ItemList+BreadcrumbList`, 영웅 상세 `WebPage(Thing)+BreadcrumbList`, 패치 상세 `Article+BreadcrumbList`
- 홈 전용 `generateMetadata` (absolute title)
- locale별 `keywords` (ko/en/ja 각 9~10개)
- `viewport` 분리 — `themeColor` 라이트/다크 분기, `colorScheme`
- `robots.ts`: `/_next/` 차단 + `host` 필드 추가

### 동적 favicon + PWA manifest + verification 메타 (PR #81 머지)
- `apps/web/src/app/icon.png` (192×192), `apple-icon.png` (180×180) — Watchpoint 로고 (crosshair + W)
- `apps/web/public/icons/icon-{96,192,512}.png` — PWA manifest 멀티 사이즈
- `apps/web/src/app/manifest.ts` — PWA (`theme_color: #fa9c1d`, standalone)
- `apps/web/src/app/layout.tsx` — `WEB_GOOGLE_SITE_VERIFICATION` / `WEB_NAVER_SITE_VERIFICATION` env로 verification 메타 주입 (env 없으면 메타 생략)

### OG image 핫픽스 (PR #82 → develop, PR #83 → main)
- 증상: 홈/hero/patch 모든 OG endpoint `500` 반환
- 원인: `apps/web/src/lib/og.ts`의 Pretendard 폰트 URL이 깨짐
  - gh 경로 `cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/packages/pretendard/dist/public/static/Pretendard-Bold.ttf` → jsdelivr 50MB 제한으로 403/404
  - npm 패키지엔 `packages/` prefix 없음, 루트 `dist/public/static/`엔 .otf만 있고 .ttf는 `alternative/` 하위에만 존재
- 수정: `cdn.jsdelivr.net/npm/pretendard@1.3.9/dist/public/static/alternative/Pretendard-Bold.ttf` → 200 OK

---

## 7. 인프라 현황

### 배포
| 컴포넌트 | 호스팅 | 도메인 |
|---|---|---|
| NestJS API | Railway | `api.o-watchpoint.com` (port 8080) |
| Next.js Web | Vercel | `o-watchpoint.com` |
| PostgreSQL | Railway (Managed) | private + public proxy(`acela.proxy.rlwy.net:18408`) |
| Redis | Railway (Managed) | private |
| MinIO (S3-호환) | Railway | API: `cdn.o-watchpoint.com` (port 9000) / Console: Railway 기본 URL (port 9001) |

### 빌드 / 배포 자동화
- **Railway API**: `main` 머지 시 자동 트리거. `railway.json` Nixpacks
- **Vercel Web**: `main` 푸시 시 자동 트리거. `apps/web/vercel.json`에 monorepo cd 설정. Root Directory = `apps/web`. env 변경은 수동 Redeploy 필요
- **boot-seeder**: API 부팅 시 `AUTO_SEED_ON_BOOT=true`면 perks/blizzardId 검사 → 부족하면 4-phase 시드 백그라운드 실행

### env 필수 변수
- **Vercel Web**: `WEB_API_BASE_URL=https://api.o-watchpoint.com`, `WEB_PUBLIC_URL=https://o-watchpoint.com`, `MINIO_PUBLIC_URL=https://cdn.o-watchpoint.com/watchpoint-icons`
- **Vercel Web (선택)**: `WEB_GOOGLE_SITE_VERIFICATION`, `WEB_NAVER_SITE_VERIFICATION`
- **Railway API**: `DATABASE_URL`, `REDIS_URL`(또는 HOST/PORT/PASSWORD), `MINIO_ENDPOINT=https://cdn.o-watchpoint.com`, `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY`, `MINIO_BUCKET=watchpoint-icons`, `MINIO_PUBLIC_URL=https://cdn.o-watchpoint.com/watchpoint-icons`, `AUTO_SEED_ON_BOOT=true`, `SCRAPER_CRON_ENABLED=true`, `NODE_ENV=production`, `API_PORT`

### 가비아 DNS 레코드
| 타입 | 호스트 | 값 |
|---|---|---|
| A | `@` | `216.198.79.1` (Vercel) |
| CNAME | `api` | `<Railway xxxxx.up.railway.app>` |
| CNAME | `cdn` | `<Railway xxxxx.up.railway.app>` |
| TXT | `_railway-verify.api` | Railway 토큰 |
| TXT | `_railway-verify.cdn` | Railway 토큰 |

---

## 8. 자동화 시스템 요약

### 부트 자동 시더 (`AUTO_SEED_ON_BOOT=true`)
- `OnApplicationBootstrap` → perks 부족 OR `abilities.blizzardId` 비율 < 80% 감지 시 백그라운드 4-phase 시드
- 4 phase: 한국어 sync → 영문 sync → portrait 다운로드 → ability/perk 아이콘 다운로드
- Blizzard CDN throttle(2초)로 51명 × 4 phase ≈ 25분 소요

### 패치 cron 자동 영웅 sync (`SCRAPER_CRON_ENABLED=true`)
- `BlizzardPatchCron` 6시간마다 (`0 */6 * * *`)
- tick당 한국어 sync(`BlizzardPatchScraper`) → 영문 sync(`BlizzardPatchEnScraper`) 순서로 둘 다 실행
- 새 패치/non-PUBLISHED 업데이트 → 영웅별 `BlizzardHeroKoScraper.sync` + `HeroIconMatcher.downloadFor`
- 영문 sync는 기존 PatchNote에 영문 translations 병합 (한국어 sync 실패해도 별도 시도)
- `hero_change_logs`에 audit

### blizzardId 기반 영문 매핑
- 한국어 sync 시 `ability.blizzardId` 자동 저장
- 영문 sync는 (1) blizzardId 매칭 → (2) override → (3) fallback 순서

---

## 9. 알려진 이슈

### 8.1 데이터
- PASSIVE 아이콘 대부분 영문 페이지에 카드 없음 (역할군 패시브). 8명만 추가 다운로드됨
- KR-only 영웅 7명: ability 부족 (anran/domina=0, emre/jetpack-cat/mizuki/vendetta/wuyang=1)
- mauga 무기, junker-queen SECONDARY, bastion SECONDARY — Blizzard 영문 페이지에 카드 없음, 영문 빈값

### 8.2 운영
- `INTERNAL_API_KEY` 미설정
- 통합 테스트 미작성
- 홈 페이지 디자인 placeholder (영웅 페이지는 리디자인 완료, 홈/패치노트도 같은 톤으로 점진 적용 검토)

### 8.3 SEO 한계 (현재 cookie i18n 때문에)
- 페이지 전부 Dynamic Rendering (cookies 사용)
- hreflang/alternates.languages 미설정
- `generateStaticParams` 미사용 → 빌드 타임 프리렌더 안 됨

---

## 10. 최근 머지

| PR | 내용 |
|---|---|
| #74 | release: 영웅 데이터 자동 동기화 (Blizzard 단일 소스) |
| #75 | release: Railway 빌드 fix + boot-seeder 4-phase 자동화 |
| #76 | release: prod runtime deps fix (ts-node + @prisma/client-runtime-utils) |
| #77 | release: boot-seeder 트리거 조건 보강 (blizzardId 비율) |
| #78 | release: Next.js 빌드 경고 정리 |
| #79 | release: Vercel 배포 경로 픽스 + 코드 컨벤션 정리 |
| #80 | release: SEO 보강 (JSON-LD + 메타 + viewport + robots + favicon + PWA manifest) |
| #81 | chore: 동적 favicon + PWA manifest + verification 메타 구조 |
| #82 | fix(web): OG image용 Pretendard 폰트 URL을 npm 경로로 교체 |
| #83 | hotfix: OG image용 Pretendard 폰트 URL 깨짐 (500 → 200) |
| #84 | chore: 나무위키 데이터 출처 제거 (Blizzard 공식만 사용) |
| #85 | release: 나무위키 제거를 main으로 |
| #86 | chore: 나무위키 잔재 정리 (SPEC.md/API DTO/cSpell) |
| #87 | release: 잔재 정리를 main으로 |
| #88 | chore: patch cron tick에 영문 sync 통합 |
| #89 | release: 영문 cron 자동화를 main으로 |
| #90 | chore: Sentry 에러 트래커 도입 (API + Web) |
| #91 | chore(ci): Dependabot 설정 — npm + github-actions 주간 PR |
| #92 | release: Sentry + Dependabot을 main으로 |
| #101 | docs(readme): 포트폴리오용 전면 갱신 |
| #102 | release: 포트폴리오용 README 전면 갱신 |
| #93 | chore(deps): bump actions/checkout v4→v6 |
| #94 | chore(deps): bump actions/setup-node v4→v6 |
| #95 | chore(deps): bump pnpm/action-setup v4→v6 |
| #96 | chore(deps): bump nestjs group 11.1.20→11.1.26 (patch) |
| #99 | chore(deps-dev): bump @biomejs/biome 2.4.15→2.4.16 (patch) |
| #103 | release: Dependabot safe 5종 (actions v6 + nestjs patch + biome patch) |
| #105 | feat(web): 영웅 리스트/상세 리디자인 — 큰 portrait 카드 그리드 |
| #106 | release: 영웅 리스트/상세 리디자인 |
| #108 | feat(api): 특전 EN 번역 sync (blizzard EN scraper에 parsePerks 추가) |
| #109 | release: 특전 영문 sync 신규 구현 |
| #110 | feat(api): 나무위키 source 재도입 — 1단계 인프라 + 라이선스 |
| #111 | release: 나무위키 source 재도입 (1단계 — 인프라 + 라이선스) |
| #112 | feat(api): 나무위키 한국어 ability 명칭 fallback sync (2단계) |
| #113 | release: 나무위키 한국어 ability 명칭 fallback (2단계) |
| #115 | fix(api): hero description seed가 ko sync 결과를 덮어쓰던 버그 수정 (5단계) |
| #116 | release: hero description seed 버그 수정 (5단계) |
| #117 | docs(status): 5단계 완료 + 3·4단계 스킵 반영 |
| #118 | feat: web ISR revalidate 훅 도입 (+ STATUS 보안 후속 항목 정리) |
| #119 | feat(web): 한국어 검색 노출용 '감시기지' 별칭 추가 |
| #120 | release: web ISR revalidate 훅 + 한국어 SEO 별칭 (감시기지) |

---

## 11. 메모리 / 참고

- 메모리 인덱스: `~/.claude/projects/.../memory/MEMORY.md`
- 운영 인프라 컨텍스트: `~/.claude/projects/.../memory/watchpoint_post_deploy.md`
- 기획/스펙: `SPEC.md`
- 설치/운영: `README.md`
- 개발 컨벤션: `CLAUDE.md`

## 12. MinIO 운영 메모

### bucket 정책 설정 (mc CLI)
```bash
mc alias set watchpoint https://cdn.o-watchpoint.com <ACCESS_KEY> <SECRET_KEY>
mc anonymous set download watchpoint/watchpoint-icons
mc anonymous get watchpoint/watchpoint-icons  # 확인용
```

### 자산 재업로드 (`assets:upload` 다시 실행 시)
- 멱등 — 같은 키에 덮어쓰기, DB URL은 패턴 동일하니 noop
- 로컬에서 prod env로:
  ```
  env DATABASE_URL=... NODE_ENV=production REDIS_HOST=localhost \
      MINIO_ENDPOINT=https://cdn.o-watchpoint.com \
      MINIO_ACCESS_KEY=... MINIO_SECRET_KEY=... \
      MINIO_BUCKET=watchpoint-icons \
      MINIO_PUBLIC_URL=https://cdn.o-watchpoint.com/watchpoint-icons \
      pnpm --filter @watchpoint/api assets:upload
  ```

### 헷갈리는 포트
- **9000 = API (S3 protocol)** ← mc/SDK 접근, `cdn.o-watchpoint.com` 연결됨
- **9001 = Console (UI)** ← 브라우저 접근, Railway 기본 URL
- Custom Domain 추가 시 Target Port 잘못 설정하면 모든 자산 요청이 console로 가서 깨짐
