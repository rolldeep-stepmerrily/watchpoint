# Watchpoint — 진행 현황 / 남은 작업

> 2026-06-07 작업 종료 시점. main = `4a48760` (PR #83 머지), develop = `7ed43c8`.
> **운영 인프라 1차 완성** — Railway API + Vercel Web + MinIO cdn + SEO + 동적 favicon + OG image 모두 prod 반영.
> 이번 세션: 도메인 연결(`o-watchpoint.com` apex + `cdn.o-watchpoint.com`), MinIO cdn 전환(523개 자산 업로드 + DB URL 일괄 교체), favicon/PWA manifest, OG image Pretendard URL 핫픽스.

## 0. 다음 작업

### 1순위: 검색엔진 등록 (대부분 user 수작업)
- **Google Search Console** 도메인 등록 → DNS TXT 또는 HTML 메타 verification
- **Naver Search Advisor** 도메인 등록 (한국 검색 트래픽)
- **Bing Webmaster** 등록 (선택)
- verification 토큰 받으면 Vercel env에 `WEB_GOOGLE_SITE_VERIFICATION` / `WEB_NAVER_SITE_VERIFICATION` 추가 → Vercel Redeploy → `<meta name="...-site-verification">` 자동 노출 → Console에서 verify 클릭 → sitemap 제출
- env 주입 구조는 `apps/web/src/app/layout.tsx`의 `buildVerification()`에 마련됨. 토큰만 채우면 됨

### 2순위: 운영 데이터 보강 + 모니터링
- **`INTERNAL_API_KEY`** Railway env 설정 (16자 이상 랜덤) → `/internal/*` 엔드포인트 회복
- prod에서 `pnpm patch:sync:en` 실행 → 영문 패치노트 보강
- 첫 cron tick 모니터링 (6h 주기, `SCRAPER_PATCH_CRON='0 */6 * * *'`) + `hero_change_logs` audit 확인

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
| **Google/Naver Search Console 등록** | 🔲 | verification env 채우기 후 |
| **`INTERNAL_API_KEY`** | 🔲 | Railway env 설정 |
| **prod 영문 패치노트 보강** | 🔲 | `patch:sync:en` 실행 |
| **첫 cron tick 모니터링** | 🔲 | 6h 주기 |
| **URL 기반 locale routing** | 🔲 | hreflang/generateStaticParams 위한 선행 작업 |
| **테스트 (jest/e2e)** | 🔲 | 미작성 |
| **홈 페이지 디자인** | 🟡 placeholder | |
| **`revalidatePath` (web ISR 무효화)** | 🔲 | 미구현 |

---

## 2. 이번 세션 주요 작업 (2026-06-07)

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

## 3. 인프라 현황

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

## 4. 자동화 시스템 요약

### 부트 자동 시더 (`AUTO_SEED_ON_BOOT=true`)
- `OnApplicationBootstrap` → perks 부족 OR `abilities.blizzardId` 비율 < 80% 감지 시 백그라운드 4-phase 시드
- 4 phase: 한국어 sync → 영문 sync → portrait 다운로드 → ability/perk 아이콘 다운로드
- Blizzard CDN throttle(2초)로 51명 × 4 phase ≈ 25분 소요

### 패치 cron 자동 영웅 sync (`SCRAPER_CRON_ENABLED=true`)
- `BlizzardPatchCron` 6시간마다 (`0 */6 * * *`)
- 새 패치/non-PUBLISHED 업데이트 → 영웅별 `BlizzardHeroKoScraper.sync` + `HeroIconMatcher.downloadFor`
- `hero_change_logs`에 audit

### blizzardId 기반 영문 매핑
- 한국어 sync 시 `ability.blizzardId` 자동 저장
- 영문 sync는 (1) blizzardId 매칭 → (2) override → (3) fallback 순서

---

## 5. 알려진 이슈

### 5.1 데이터
- PASSIVE 아이콘 대부분 영문 페이지에 카드 없음 (역할군 패시브). 8명만 추가 다운로드됨
- KR-only 영웅 7명: ability 부족 (anran/domina=0, emre/jetpack-cat/mizuki/vendetta/wuyang=1)
- mauga 무기, junker-queen SECONDARY, bastion SECONDARY — Blizzard 영문 페이지에 카드 없음, 영문 빈값

### 5.2 운영
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
| #80 | release: SEO 보강 (JSON-LD + 메타 + viewport + robots + favicon + PWA manifest) |
| #81 | chore: 동적 favicon + PWA manifest + verification 메타 구조 |
| #82 | fix(web): OG image용 Pretendard 폰트 URL을 npm 경로로 교체 |
| #83 | hotfix: OG image용 Pretendard 폰트 URL 깨짐 (500 → 200) |

---

## 7. 메모리 / 참고

- 메모리 인덱스: `~/.claude/projects/.../memory/MEMORY.md`
- 운영 인프라 컨텍스트: `~/.claude/projects/.../memory/watchpoint_post_deploy.md`
- 기획/스펙: `SPEC.md`
- 설치/운영: `README.md`
- 개발 컨벤션: `CLAUDE.md`

## 8. MinIO 운영 메모

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
