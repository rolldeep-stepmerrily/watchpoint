# Watchpoint — 진행 현황 / 남은 작업

> 2026-06-11 작업 종료 시점. main = `5a95e21` (PR #116 머지), develop = `06c4d1f` (PR #115 머지).
> **운영 인프라 1차 완성 + 데이터 출처 이중화 + 자동화 강화 + 관측성 1단계 + Dependabot 첫 release + 영웅 페이지 리디자인 + 나무위키 재도입(비영리 운영 확정) + hero description seed 버그 수정** — Railway API + Vercel Web + MinIO cdn + SEO + favicon + OG 모두 prod 반영, 나무위키 출처 재도입(CC BY-NC-SA → 비영리 운영 확정), patch cron이 한국어 + 영문 sync 둘 다 자동 실행, Sentry 에러 트래커 코드 도입, MCP 4종 등록 완료, Dependabot 안전한 5종 main release, 영웅 리스트/상세 포트레이트 카드 그리드 리디자인, 나무위키 한국어 ability 명칭 fallback sync, hero description seed 무한 덮어쓰기 버그 수정 + prod 51명 description 공식값 갱신 완료.
> 이번 세션(2026-06-11): Dependabot 8개 PR 검토 후 안전한 5개 main release(PR #103), 영웅 리스트/상세 리디자인(PR #105/#106), 특전/능력 영문 sync(PR #108/#109), **나무위키 source 재도입 1단계 인프라(PR #110/#111), 2단계 한국어 ability 명칭 fallback sync(PR #112/#113), 5단계 hero description seed 버그 수정(PR #115/#116) + Railway CLI(SSH key + DB public proxy)로 prod 51명 description 일괄 갱신**. 3단계(아이콘 fallback)는 나무위키 SSR에 능력 아이콘이 노출되지 않아 스킵, 4단계(국적)도 스킵.
> 직전 세션(2026-06-10): patch cron 영문 sync 자동화(PR #88/#89), Sentry 도입(API + Web, PR #90), Dependabot 설정(PR #91), Sentry + Dependabot main 릴리스(PR #92), README 포트폴리오 갱신(PR #101/#102). MCP 4종 등록: Railway HTTP / Vercel HTTP / GitHub Docker / Postgres-RO npm.

## 0. 다음 작업

### 1순위: 나무위키 재도입 후속 단계
- **1단계 (완료)**: 인프라 + 라이선스 (PR #110/#111)
- **2단계 (완료)**: 한국어 ability 명칭 fallback (PR #112/#113) + Railway CLI로 prod 51명 sync 완료 — 능력 갱신 3 (junker-queen 톱니칼 등). 매칭 실패 35는 namu가 추출한 PASSIVE/하위역할 항목이 DB slot에 없어서 무시된 정상 케이스
- **3단계 (스킵 확정)**: 아이콘 fallback — 나무위키 SSR 페이지에 능력 아이콘이 노출되지 않음(SPA 동적 렌더). 자동 fallback 불가. 누락 5개(freja PRIMARY, mauga PRIMARY/SECONDARY, junker-queen SECONDARY, bastion SECONDARY)는 수작업 업로드로 처리 가능
- **4단계 (스킵 확정)**: 영웅 국적 표기 — 블리자드 페이지에 `blz-list-item.location` 안 `p[slot=description]`로 활동 지역 일관 노출되지만 첫 토큰이 도시/기지인 케이스(zarya/winston/wuyang/anran/soldier-76 등) 정확도 ↓. 정적 매핑 51명 작성하는 게 정확하지만 ROI 낮아 보류
- **5단계 (완료)**: hero description seed 버그 수정 + prod 51명 갱신 (PR #115/#116). 원인: `apps/api/prisma/seeds/hero-details.ts`의 `applyHeroMeta()`가 매 부팅 `seed.description`을 무조건 덮어씀. 수정: 기존 description 비어있을 때만 placeholder로 채움. prod 적용: Railway CLI(`railway ssh keys add` + Postgres `DATABASE_PUBLIC_URL` + Redis `REDIS_PUBLIC_URL`)로 로컬에서 `pnpm hero:sync:ko:all` 실행 → 51/51 영웅 갱신, 264 abilities upserted

### 1순위: 검색엔진 등록 (대부분 user 수작업)
- **Google Search Console** 도메인 등록 → DNS TXT 또는 HTML 메타 verification
- **Naver Search Advisor** 도메인 등록 (한국 검색 트래픽)
- **Bing Webmaster** 등록 (선택)
- verification 토큰 받으면 Vercel env에 `WEB_GOOGLE_SITE_VERIFICATION` / `WEB_NAVER_SITE_VERIFICATION` 추가 → Vercel Redeploy → `<meta name="...-site-verification">` 자동 노출 → Console에서 verify 클릭 → sitemap 제출
- env 주입 구조는 `apps/web/src/app/layout.tsx`의 `buildVerification()`에 마련됨. 토큰만 채우면 됨

### 2순위: 운영 데이터 보강 + 모니터링
- **`INTERNAL_API_KEY`** Railway env 설정 (16자 이상 랜덤) → `/internal/*` 엔드포인트 회복
- 첫 cron tick 모니터링 (6h 주기, `SCRAPER_PATCH_CRON='0 */6 * * *'`) — 이제 tick당 한국어+영문 sync 둘 다 실행. `hero_change_logs` audit + 영문 translations 채워지는지 확인

### Sentry / Dependabot / MCP 활성화 후속
- **Sentry env**: Railway `SENTRY_DSN`, Vercel `NEXT_PUBLIC_SENTRY_DSN` 모두 등록 완료. Vercel은 PR #103 main 배포로 build inline 재반영됨. Sentry dashboard에 prod 이벤트 도착 여부만 확인 남음.
- **Dependabot 보류 PR (major 3개, 사용자 결정 필요)**:
  - **#97 Next.js 16** (15.5.18 → 16.2.9): turbopack 변경, React 19 흐름. release note 검토 필요
  - **#98 @types/node 25** (22.19.19 → 25.9.2): Node 22 LTS 런타임과 type 버전 어긋남. 호환 검증 필요
  - **#100 undici 8** (6.25.0 → 8.4.1): scraper에서 사용 중. fetch API 호환 검증 필요
- **GitHub PAT/PG superuser 비번 노출 후속 (user 직접)**:
  - GitHub PAT revoke: https://github.com/settings/tokens
  - PG superuser 비번 rotate: Railway dashboard (readonly role 비번은 이미 교체 완료)

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
- web의 `revalidatePath` ISR 무효화 훅 (cron이 새 패치 적재 후 호출)

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
| **Google/Naver Search Console 등록** | 🔲 | verification env 채우기 후 |
| **`INTERNAL_API_KEY`** | 🔲 | Railway env 설정 |
| **prod 영문 패치노트 보강** | 🔲 | 다음 cron tick에 자동 처리 |
| **첫 cron tick 모니터링** | 🔲 | 6h 주기 |
| **URL 기반 locale routing** | 🔲 | hreflang/generateStaticParams 위한 선행 작업 |
| **테스트 (jest/e2e)** | 🔲 | 미작성 |
| **홈 페이지 디자인** | 🟡 placeholder | |
| **`revalidatePath` (web ISR 무효화)** | 🔲 | 미구현 |

---

## 2. 이번 세션 주요 작업 (2026-06-11)

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

## 3. 직전 세션 주요 작업 (2026-06-10)

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

## 4. 직전 세션 작업 (2026-06-08)

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

## 5. 2026-06-07 세션

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

## 6. 인프라 현황

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

## 7. 자동화 시스템 요약

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

## 8. 알려진 이슈

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

## 9. 최근 머지

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

---

## 10. 메모리 / 참고

- 메모리 인덱스: `~/.claude/projects/.../memory/MEMORY.md`
- 운영 인프라 컨텍스트: `~/.claude/projects/.../memory/watchpoint_post_deploy.md`
- 기획/스펙: `SPEC.md`
- 설치/운영: `README.md`
- 개발 컨벤션: `CLAUDE.md`

## 11. MinIO 운영 메모

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
