# Watchpoint — 진행 현황 / 남은 작업

> 2026-06-06 작업 종료 시점. develop = `ca96da0` (SEO 보강), main = `278da86` (PR #78 머지, Vercel 정상 배포 중).
> **Railway API + Vercel Web 모두 prod 배포 완료**. 도메인 `o-watchpoint.com` 연결됨.
> 이번 세션: vercel.json 위치 픽스, 코드 컨벤션 정리 12건, SEO JSON-LD/메타데이터 일괄 추가.

## 0. 다음 작업

### 1순위: SEO 보강 release PR → main 머지 → Vercel 자동 배포
- develop의 `ca96da0` (SEO 커밋) 아직 main에 없음
- 새 release PR 만들어 머지 → Vercel 재배포 → JSON-LD/메타 반영 확인
- 검증: 배포된 페이지에서 `view-source:` → `<script type="application/ld+json">` 확인, `/robots.txt`/`/sitemap.xml` 200 응답

### 2순위: MinIO 자산 업로드 + cdn 서브도메인
- 현재 영웅 portrait/ability/perk 아이콘은 `apps/web/public/icons/...` 로컬 호스팅
- `pnpm assets:upload` 실행 → MinIO bucket에 일괄 업로드 + DB URL 일괄 교체
- Railway에서 `cdn.o-watchpoint.com` 서브도메인을 MinIO에 연결
- `MINIO_PUBLIC_URL` env를 cdn 도메인으로 갱신 (Railway + Vercel)
- 검증: 영웅 상세 페이지의 portrait/아이콘이 cdn 도메인에서 로드되는지

### 3순위: 검색엔진 등록 + 파비콘
- **Google Search Console** 등록 → 메타 verification 태그 추가 → 사이트맵 제출
- **Naver Search Advisor** 등록 (한국 검색 트래픽)
- **Bing Webmaster** 등록 (선택)
- `apps/web/src/app/icon.tsx`, `apple-icon.tsx` 동적 파비콘 생성 (Watchpoint 로고)
- `manifest.json` (선택, PWA 홈화면 추가용)

### 4순위: 운영 데이터 보강 + 모니터링
- prod에서 `pnpm patch:sync:en` (한국어 영문 패치노트 보강)
- 첫 cron tick 모니터링 (6h 주기) + `hero_change_logs` 확인
- `INTERNAL_API_KEY` Railway env 설정 → `/internal/*` 회복
- prod MinIO에 능력/특전 아이콘 다운로드 (`hero:icons:download:all`)

### 5순위 (큰 작업, 보류): URL 기반 locale routing
- 현재 cookie 기반 i18n → 페이지가 전부 Dynamic Rendering
- `/ko/...`, `/en/...` URL 라우팅으로 옮기면:
  - `generateStaticParams` 가능 → 정적 프리렌더로 SEO/속도 향상
  - `hreflang` + `alternates.languages` 가능 → 다국어 검색 인덱싱
- 라우팅/링크/lang-toggle 전체 리팩토링 필요

### 6순위 (큰 작업, 보류): 테스트 작성
- API: 핸들러 단위 테스트, e2e 통합 테스트
- Web: RSC 페이지 스냅샷, 핵심 인터랙션 e2e

---

## 1. 한눈에

| 영역 | 상태 | 비고 |
|---|---|---|
| **Railway API prod 배포** | ✅ | `api.o-watchpoint.com` |
| **Vercel Web prod 배포** | ✅ | `o-watchpoint.com` (PR #78 머지 후) |
| **도메인 연결** | ✅ | 가비아 → 가비아 DNS → Railway/Vercel |
| **boot-seeder 4-phase 자동화** | ✅ | ko/en/portrait/icons (PR #74) |
| **Prisma 7 runtime deps** | ✅ | PR #76 |
| **Vercel monorepo build (vercel.json)** | ✅ | PR #79 |
| **SEO 메타데이터 (페이지별 generateMetadata)** | ✅ | OG/Twitter/canonical 전부 적용됨 |
| **SEO JSON-LD 구조화 데이터** | 🟡 | develop에 있음, main 머지 대기 |
| **sitemap.xml + robots.txt** | ✅ | 동적 영웅/패치 포함 |
| **opengraph-image (홈/영웅/패치)** | ✅ | Pretendard 폰트 적용 |
| **MinIO 자산 prod 업로드** | 🔲 | `assets:upload` 실행 대기 |
| **cdn.o-watchpoint.com 서브도메인** | 🔲 | Railway에서 연결 필요 |
| **파비콘 / apple-icon / manifest** | 🔲 | 디자인 자산 필요 |
| **Google/Naver Search Console 등록** | 🔲 | verification 메타 추가 후 |
| **URL 기반 locale routing** | 🔲 | hreflang/generateStaticParams 위한 선행 작업 |
| **prod 영문 패치노트 보강** | 🔲 | `patch:sync:en` 실행 |
| **첫 cron tick 모니터링** | 🔲 | 배포 6h 후 |
| **`INTERNAL_API_KEY`** | 🔲 | Railway env 설정 |
| **테스트 (jest/e2e)** | 🔲 | 미작성 |
| **홈 페이지 디자인** | 🟡 placeholder | |
| **`revalidatePath` (web ISR 무효화)** | 🔲 | 미구현 |

---

## 2. 이번 세션 주요 작업 (2026-06-06)

### Vercel 배포 디버깅
1. **빌드 경고 2건** (PR #78): Next.js 15.5의 `experimental.typedRoutes` → 최상위 `typedRoutes`로 이동. Pretendard `@import`를 `@import "tailwindcss"` 앞으로 옮겨 CSS @import 순서 위반 해소
2. **outputDirectory 경로 doubling** (PR #79): 루트 `vercel.json`의 `outputDirectory: "apps/web/.next"` + 대시보드 Root Directory `apps/web` 이 합쳐져 `/vercel/path0/apps/web/apps/web/.next`로 찾던 문제. `vercel.json`을 `apps/web/`로 옮기고 outputDirectory 명시 제거 (framework auto-detection 위임)

### 코드 컨벤션 정리 (PR #79 포함, 12건)
- `function` 키워드 → 화살표 함수 (main, cli/main, name-resolver, hero-diff-logger, search.query, lib/api, shared 타입가드)
- if/else → early return (main.ts, http-logger middleware)
- `Boolean(name)` → `isDefined(name)` (blizzard-patch.scraper)
- JSDoc 보강 (api/web/shared 합 9건)
- 빌드/lint 모두 통과

### SEO 보강 (commit `ca96da0`, main 머지 대기)
- **JSON-LD 구조화 데이터** 빌더 (`apps/web/src/lib/seo.ts`) + `<JsonLd />` 컴포넌트
  - `WebSite + SearchAction` (홈)
  - `ItemList + BreadcrumbList` (영웅/패치 목록)
  - `WebPage(Thing) + BreadcrumbList` (영웅 상세)
  - `Article + BreadcrumbList` (패치 상세)
- 홈 전용 `generateMetadata` (사이트명+설명 absolute title)
- locale별 `keywords` (ko/en/ja 9~10개씩)
- `authors`/`creator`/`publisher`/`googleBot` 메타
- `viewport` export: themeColor 라이트/다크 분기, colorScheme
- `robots.ts`: `/_next/` 차단 + `host` 필드 추가
- `</script>` 인젝션 방지 escape 포함

---

## 3. 인프라 현황

### 배포
| 컴포넌트 | 호스팅 | 도메인 |
|---|---|---|
| NestJS API | Railway | `api.o-watchpoint.com` |
| Next.js Web | Vercel | `o-watchpoint.com` |
| PostgreSQL | Railway (Managed) | (private) |
| Redis | Railway (Managed) | (private) |
| MinIO (S3-호환) | Railway | Railway 기본 URL (cdn 미연결) |

### 빌드 / 배포 자동화
- **Railway API**: `develop` → `main` 머지 시 자동 트리거. `railway.json`에 `corepack enable && pnpm install --frozen-lockfile && pnpm --filter @watchpoint/shared build && pnpm --filter @watchpoint/api build`
- **Vercel Web**: `main` 푸시 시 자동 트리거. `apps/web/vercel.json`에 monorepo cd 설정. Root Directory = `apps/web`
- **boot-seeder**: API 부팅 시 `AUTO_SEED_ON_BOOT=true`면 perks/blizzardId 검사 → 부족하면 4-phase 시드 백그라운드 실행

### env 필수 변수
- **Railway API**: `DATABASE_URL`, `REDIS_URL`, `MINIO_ENDPOINT`/`ACCESS_KEY`/`SECRET_KEY`/`BUCKET`/`PUBLIC_URL`, `AUTO_SEED_ON_BOOT=true`, `SCRAPER_CRON_ENABLED=true`, `NODE_ENV=production`, `API_PORT`
- **Vercel Web**: `WEB_API_BASE_URL=https://api.o-watchpoint.com`, `WEB_PUBLIC_URL=https://o-watchpoint.com`, `MINIO_PUBLIC_URL` (영웅 이미지 hostname 화이트리스트)

---

## 4. 자동화 시스템 요약

### 부트 자동 시더 (`AUTO_SEED_ON_BOOT=true`)
- `OnApplicationBootstrap` → perks 부족 OR `abilities.blizzardId` 비율 < 80% 감지 시 백그라운드 4-phase 시드
- 4 phase: 한국어 sync → 영문 sync → portrait 다운로드 → ability/perk 아이콘 다운로드
- Blizzard CDN throttle(2초)로 51명 × 4 phase ≈ 25분 소요

### 패치 cron 자동 영웅 sync (`SCRAPER_CRON_ENABLED=true`)
- `BlizzardPatchCron` 6시간마다 (`0 */6 * * *`)
- 새 패치/non-PUBLISHED 업데이트 → 영웅별 `NamuwikiHeroScraper.sync` + `HeroIconMatcher.downloadFor`
- `hero_change_logs`에 audit

### blizzardId 기반 영문 매핑
- 한국어 sync 시 `ability.blizzardId` 자동 저장
- 영문 sync는 (1) blizzardId 매칭 → (2) override → (3) fallback 순서
- 신규 영웅 추가 시 한국어 sync만 돌리면 영문도 자동 정확 매핑

---

## 5. 알려진 이슈

### 5.1 데이터
- PASSIVE 아이콘 대부분 영문 페이지에 카드 없음 (역할군 패시브). 8명만 추가 다운로드됨
- KR-only 영웅 7명: ability 부족 (anran/domina=0, emre/jetpack-cat/mizuki/vendetta/wuyang=1)
- mauga 무기, junker-queen SECONDARY, bastion SECONDARY — Blizzard 영문 페이지에 카드 없음, 영문 빈값

### 5.2 운영
- prod MinIO 자산 미업로드 (로컬 `apps/web/public/icons/...`만 있음)
- `INTERNAL_API_KEY` 미설정
- 통합 테스트 미작성
- 홈 페이지 디자인 placeholder

### 5.3 SEO 한계 (현재 cookie i18n 때문에)
- 페이지 전부 Dynamic Rendering (cookies 사용)
- hreflang/alternates.languages 미설정
- `generateStaticParams` 미사용 → 빌드 타임 프리렌더 안 됨

---

## 6. 최근 머지

| PR | 내용 |
|---|---|
| #74 | release: 영웅 데이터 자동 동기화 (Blizzard 단일 소스) |
| #75 | release: Railway 빌드 fix + boot-seeder 4-phase 자동화 |
| #76 | release: prod runtime deps fix (ts-node + @prisma/client-runtime-utils) |
| #77 | release: boot-seeder 트리거 조건 보강 (blizzardId 비율) |
| #78 | release: Next.js 빌드 경고 정리 |
| #79 | release: Vercel 배포 경로 픽스 + 코드 컨벤션 정리 |

(다음 예정) **#80**: release: SEO 보강 (JSON-LD + 메타 + viewport)

---

## 7. 메모리 / 참고

- 메모리 인덱스: `~/.claude/projects/.../memory/MEMORY.md`
- 배포 작업 컨텍스트: `~/.claude/projects/.../memory/watchpoint_next_deploy.md`
- 기획/스펙: `SPEC.md`
- 설치/운영: `README.md`
- 개발 컨벤션: `CLAUDE.md`
