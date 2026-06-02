# Watchpoint — 진행 현황 / 남은 작업

> 2026-06-02 작업 종료 시점. develop = `d2feb65`, main = `39bcd8c` (PR #70 머지).
> **다음 작업 최우선 = Railway(API) + Next.js(Web) 배포** (사용자 결정, 2026-06-03)

## 0. 다음 작업 (사용자 명시 최우선)

### 1순위: Railway (API) prod 배포
- main 이미 push (`39bcd8c`) → Railway 자동 배포 트리거 가능성. 대시보드에서 status 먼저 확인
- 마이그레이션 3개 자동 적용 예상:
  - `20260529090413_require_hero_subrole` (subrole NOT NULL + Subrole enum) — prod 영웅 모두 subrole 있어야 가드 통과
  - `20260529100740_add_ability_icon_url`
  - `20260602091338_add_hero_change_log`
- **env 추가 (사용자 결정)**:
  - `AUTO_SEED_ON_BOOT=true` — 부팅 시 빈 perks 백그라운드 시드 (약 17분)
  - `SCRAPER_CRON_ENABLED=true` — 6시간 cron + 영웅 자동 sync + audit log
- 추가 후 재배포 → 로그에서 `auto-seed start` + `blizzard patch cron tick` 확인
- Railway CLI 미설치. 대시보드 또는 `npm i -g @railway/cli && railway login` 후 진행

### 2순위: Next.js (Web) 배포
- 호스팅 후보 (사용자 결정): Vercel / Railway / Cloudflare Pages
- env: `WEB_API_BASE_URL` = Railway API 도메인
- `apps/web/public/icons/heroes/*.png` 427개 정적 파일 자동 번들
- ISR `revalidate=3600`, `revalidatePath` 미구현 → 패치 발견 후 화면 최대 1시간 지연

### 3순위: 배포 검증 + 후속
- 능력/특전 아이콘 렌더링 확인 (D.Va, Orisa, Mercy 등)
- 패치노트/영웅 목록 정렬 동작
- `INTERNAL_API_KEY` 추가 → `/internal/*` 회복
- prod에서 `hero:sync:en:all` + `patch:sync:en` (영문 데이터 보강)
- 첫 cron tick 결과 + `hero_change_logs` 모니터링

## 1. 한눈에

| 영역 | 상태 | 비고 |
|---|---|---|
| 도메인 모델 + i18n + HeroPerk | ✅ 완료 | |
| 공개 API (GET 7종) + 캐시 | ✅ 완료 | `?lang=` 지원 |
| 라이트 테마 + Overwatch 색상 | ✅ 완료 | PR #56 |
| 영웅 목록 (op.gg 스타일 + 정렬) | ✅ 완료 | PR #60 + #66 |
| 영웅 상세 (banner + tabs) | ✅ 완료 | PR #61 |
| **패치노트 list/detail 리디자인** | ✅ 완료 | **PR #65** |
| 영웅 subrole NOT NULL + enum | ✅ 완료 | PR #57 |
| 특전 시스템 (51명 × 4 perks = 204개 시드) | ✅ 완료 | PR #63 자동 시드 |
| 능력/특전 아이콘 자체 호스팅 (427개) | ✅ 완료 | PR #63 Blizzard ko-kr |
| **부트 자동 시더** | ✅ 완료 | **PR #68** AUTO_SEED_ON_BOOT |
| **패치 cron 자동 영웅 sync + audit log** | ✅ 완료 | **PR #69** hero_change_logs |
| Biome 규칙 + VSCode 저장 시 포맷 | ✅ 완료 | PR #58 |
| 스크래퍼 (Blizzard 패치/영웅, namuwiki) | ✅ 완료 | Cron + CLI + auto-trigger |
| Throttler / Helmet / Compression / Validation | ✅ 완료 | |
| **Railway (API) prod 배포** | 🔥 **다음 최우선** | env 2개 추가 |
| **Next.js (Web) prod 배포** | 🔥 **다음 최우선** | 호스팅 결정 |
| 홈 페이지 디자인 | 🟡 placeholder | |
| PASSIVE 아이콘 (33개) | 🔲 미수집 | 역할 아이콘 대체 검토 |
| KR-only 영웅 데이터 (7명) | 🔲 부족 | |
| Prod 영문 데이터 보강 | 🔲 대기 | 배포 후 |
| `revalidatePath` (web ISR 무효화) | 🔲 미구현 | |
| 테스트 (jest/e2e) | 🔲 미작성 | |

---

## 2. 최근 머지 (2026-05-28 ~ 06-02)

| PR | 내용 |
|---|---|
| #56 | feat(web): 라이트 테마 (#FA9C1D / #4A4C4E / #FFFFFF) |
| #57 | chore(api): Hero.subrole NOT NULL + Subrole enum |
| #58 | chore: Biome useBlockStatements + VSCode 자동 포맷 |
| #60 | feat(web): 영웅 목록 op.gg 스타일 dense 테이블 |
| #61 | feat(web): 영웅 상세 banner + tabs 리디자인 |
| **#63** | **feat(api): 능력/특전 아이콘 자동 다운로드 (Blizzard) + perks 51명 한국어 시드** |
| **#65** | **feat(web): 패치노트 list/detail 리디자인** |
| **#66** | **feat(web): 영웅 목록 정렬 기능 (이름/역할/서브역할/출시일)** |
| **#68** | **feat(api): 부트 자동 시더 (AUTO_SEED_ON_BOOT)** |
| **#69** | **feat(api): 패치 cron 자동 영웅 sync + HeroChangeLog audit** |
| #67, #70 | release: develop → main |

---

## 3. 자동화 시스템 요약 (2026-06-02 신규)

### 부트 자동 시더 (`AUTO_SEED_ON_BOOT=true`)
- NestJS `OnApplicationBootstrap` 훅에서 `perk count < hero × 4` 감지 시 백그라운드 시드
- `HeroIconMatcher.downloadFor` 51명 순회 (약 17분, Blizzard CDN throttle 2초)
- idempotent — 재실행 안전. perks 채워지면 자동 skip

### 패치 cron 자동 영웅 sync (`SCRAPER_CRON_ENABLED=true`)
- `BlizzardPatchCron` 6시간마다 (`0 */6 * * *`)
- 새 패치 또는 non-PUBLISHED 업데이트 → entries의 영웅 id 모음
- 백그라운드로 영웅별 `NamuwikiHeroScraper.sync` + `HeroIconMatcher.downloadFor` 호출
- 변경 사항을 `hero_change_logs` 테이블 + console에 audit

### HeroChangeLog audit
- `HeroChangeType` enum 10가지: HERO_STAT / ABILITY_ADDED|REMOVED|NAME|DESCRIPTION|STATS / PERK_ADDED|REMOVED|NAME|DESCRIPTION
- target + targetKey + before(JSON) + after(JSON) 구조화 저장
- 디버그 쿼리: `select * from hero_change_logs where "heroId" = X order by "createdAt" desc;`

---

## 4. 미해결 / 알려진 이슈

### 4.1 배포 (다음 작업)
- Railway 자동 배포 트리거 확인 + 마이그레이션 적용 확인
- env 2개 추가 후 cron + 자동 시더 활성화
- Next.js 호스팅 결정 + 배포

### 4.2 데이터
- PASSIVE 33개 아이콘 부재 — 역할군 패시브 (Blizzard 페이지 미노출)
- KR-only 영웅 ability 부족 — anran(0), domina(0), emre/jetpack-cat/mizuki/vendetta/wuyang(1)
- Cassidy SECONDARY/ABILITY_2 — Blizzard 페이지에 능력 3개만 노출

### 4.3 UI
- 홈 페이지 placeholder
- 모바일 검증 부족

### 4.4 운영
- prod 영문 데이터 미보강 (`hero:sync:en:all` / `patch:sync:en` 미실행)
- `INTERNAL_API_KEY` 미설정 → `/internal/*` 접근 불가
- 통합 테스트 미작성

---

## 5. 메모리 / 참고

- 메모리 인덱스: `~/.claude/projects/.../memory/MEMORY.md`
- 다음 작업 명세: `~/.claude/projects/.../memory/watchpoint_next_deploy.md`
- 기획/스펙: `SPEC.md`
- 설치/운영: `README.md`
- 개발 컨벤션: `CLAUDE.md`
