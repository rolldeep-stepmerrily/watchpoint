# Watchpoint — 진행 현황 / 남은 작업

> 2026-06-04 작업 종료 시점. develop = `d2feb65`, main = `39bcd8c`.
> 작업 브랜치 = `fix-blizzard-hero-en-scraper` HEAD `099110e` (영문 sync 버그 수정, 미머지).
> **다음 작업 1순위 = 영문 sync 마무리** (Bastion/Freja/Sierra 매핑 검수 → PR → 머지) → **2순위 Railway/Next.js 배포**.

## 0. 다음 작업

### 1순위: 영문 sync 마무리 (브랜치 `fix-blizzard-hero-en-scraper`)
- 컨텍스트: `~/.claude/projects/.../memory/watchpoint_en_sync_fix.md`
- 검수 미완 3명:
  - **Bastion** ABILITY_2 구르기 ↔ `reconfigure` 의심
  - **Freja** ULTIMATE 클러스터 애로우 ↔ `quick-dash` 명백한 오류
  - **Sierra** 신영웅, 1:1 추정 다수 어긋남
- 정정 후: `icon-overrides.ts` 수정 → 영웅별 단일 재sync (`hero:icons:download <cn>` + `hero:sync:en <cn>`) → commit → PR → develop 머지 → main 릴리스
- 이번 세션 완료 (commit `099110e`):
  - `og:title`/`og:description` 대신 `blz-page-header` 사용 (parser 재작성)
  - `hero_abilities.blizzardId` 컬럼 + 한국어 sync 자동 저장
  - 영문 sync는 blizzardId 우선 매칭 (override fallback 유지)
  - 30명 override 추가 (총 44명)
  - 51명 재sync. 영문 230/266 매칭

### 2순위: Railway (API) prod 배포
- 컨텍스트: `~/.claude/projects/.../memory/watchpoint_next_deploy.md`
- 1순위 머지 후 main HEAD 업데이트 → Railway 자동 배포 트리거
- 마이그레이션 4개 자동 적용 예상 (subrole NOT NULL / ability iconUrl / hero_change_log / **ability blizzardId**)
- env 2개 추가: `AUTO_SEED_ON_BOOT=true`, `SCRAPER_CRON_ENABLED=true`

### 3순위: Next.js (Web) 배포
- 호스팅 결정: Vercel / Railway / Cloudflare Pages
- env: `WEB_API_BASE_URL`

### 4순위: 배포 검증 + 후속
- 능력/특전 아이콘 렌더링 (한국어 + ?lang=en)
- 패치노트/영웅 정렬
- `INTERNAL_API_KEY` 추가 → `/internal/*` 회복
- prod `patch:sync:en` (한국어 영문 패치노트 보강)
- 첫 cron tick + `hero_change_logs` 모니터링

---

## 1. 한눈에

| 영역 | 상태 | 비고 |
|---|---|---|
| 도메인 모델 + i18n + HeroPerk | ✅ | |
| 공개 API (GET 7종) + 캐시 | ✅ | `?lang=` 지원 |
| 라이트 테마 + Overwatch 색상 | ✅ | PR #56 |
| 영웅 목록 (op.gg 스타일 + 정렬) | ✅ | PR #60 + #66 |
| 영웅 상세 (banner + tabs) | ✅ | PR #61 |
| 패치노트 list/detail 리디자인 | ✅ | PR #65 |
| 특전 시스템 (51명 × 4 perks = 204개) | ✅ | PR #63 |
| 능력/특전 아이콘 자체 호스팅 (~435개) | ✅ | PR #63 + 이번 세션 PASSIVE 8개 추가 |
| 부트 자동 시더 | ✅ | PR #68 |
| 패치 cron 자동 영웅 sync + audit log | ✅ | PR #69 |
| **영문 ability 매핑 (blizzardId 기반)** | 🟡 **작업 중** | 브랜치 `fix-blizzard-hero-en-scraper`. 3명 검수 후 PR |
| Biome 규칙 + VSCode 저장 시 포맷 | ✅ | PR #58 |
| 스크래퍼 (Blizzard 패치/영웅, namuwiki) | ✅ | Cron + CLI + auto-trigger |
| Throttler / Helmet / Compression / Validation | ✅ | |
| Railway (API) prod 배포 | 🔲 | 영문 sync 머지 후 |
| Next.js (Web) prod 배포 | 🔲 | 호스팅 결정 + 영문 sync 후 |
| 홈 페이지 디자인 | 🟡 placeholder | |
| PASSIVE 아이콘 (대부분 영문에서 누락) | 🟡 부분 | 8명 추가 다운로드. 나머지는 영문 페이지에 카드 없음 |
| KR-only 영웅 데이터 (7명) | 🔲 부족 | domina/anran/emre/vendetta/jetpack-cat/mizuki/wuyang |
| Prod 영문 데이터 보강 | 🔲 대기 | 배포 후 |
| `revalidatePath` (web ISR 무효화) | 🔲 미구현 | |
| 테스트 (jest/e2e) | 🔲 미작성 | |

---

## 2. 이번 세션 주요 작업 (2026-06-04)

### 발견된 버그
1. **영문 페이지 og 메타 무용지물** — Blizzard EN 페이지의 `og:title`/`og:description`이 모든 영웅에서 동일한 "Overwatch" 게임 일반 정보로 고정. 모든 영웅의 영문 이름/설명이 "Overwatch"로 채워지고 있었음
2. **fallback 1:1 매칭 slot 어긋남** — Genji 같이 PASSIVE 카드가 영문/한국어 페이지에 노출되는 영웅들에서 한국어 한글 매칭부터 slot이 어긋남 (어제 STATUS의 "51명 매칭 성공"은 카운트만 잡힌 거였음). 영문 sync는 그 잘못된 매핑을 그대로 전파
3. **junkrat 0/5 매칭 실패** — DB SECONDARY 없는데 영문 카드 5개 → +1 merge 조건 안 맞아 매칭 0

### 해결 구조 (commit `099110e`)
- **parser 재작성**: og 메타 → `blz-page-header h2[slot="heading"]` / `p[slot="description"]`. abilities는 `blz-tab-control[id]`와 `blz-feature[slot="slide"]` zip
- **blizzardId 컬럼**: `hero_abilities.blizzardId` 추가. 한국어 sync 매칭 시 자동 저장 → 영문 sync는 id 기반 안전 매칭 (한국어/영문 페이지가 동일한 ability id 사용)
- **30명 override 추가**: fallback 1:1이 잘못 매핑하던 영웅 모두 ABILITY_ID_TO_SLOT에 등록 (기존 14명 → 총 44명)
- **scripts/dump-en-cards.sh** 추가: 영문 카드 vs DB 비교용 일회성 도구

### 검증 결과
- 51명 한국어 + 영문 재sync 완료
- 영문 ability 매핑 230/266 (86.5%). 미매핑 36개 = 영문 페이지 카드 없는 PASSIVE/SECONDARY + KR-only 영웅
- 깨졌던 영웅 검증: Baptiste 6/6, Genji 6/6, Kiriko 5/6, Reinhardt 5/6, Junker-Queen 5/6 (PASSIVE 미매핑 정상)
- **Bastion/Freja/Sierra 매핑 의심** — 사용자 검수 후 정정 예정

### 잔재 청소
- 이전 영문 sync에서 잘못 채워진 ability 4개의 `nameTranslations.en`/`descriptionTranslations.en` 직접 SQL UPDATE로 청소 (junker-queen SECONDARY, bastion SECONDARY, mauga PRIMARY/SECONDARY)

---

## 3. 자동화 시스템 요약

### 부트 자동 시더 (`AUTO_SEED_ON_BOOT=true`)
- `OnApplicationBootstrap` → `perk count < hero × 4` 감지 시 백그라운드 시드 (51명 약 17분)

### 패치 cron 자동 영웅 sync (`SCRAPER_CRON_ENABLED=true`)
- `BlizzardPatchCron` 6시간마다 (`0 */6 * * *`)
- 새 패치/non-PUBLISHED 업데이트 → 영웅별 `NamuwikiHeroScraper.sync` + `HeroIconMatcher.downloadFor`
- `hero_change_logs`에 audit

### HeroChangeLog audit
- 10가지 변경 타입 (HERO_STAT / ABILITY_* / PERK_*)
- target + before(JSON) + after(JSON) 구조화 저장

### blizzardId 기반 영문 매핑 (이번 세션 신규)
- 한국어 sync(`HeroIconMatcher.downloadFor`) 시 `ability.blizzardId` 자동 저장
- 영문 sync(`BlizzardHeroEnScraper`)는 (1) blizzardId 매칭 → (2) override → (3) fallback 순서
- 신규 영웅 추가 시 한국어 sync만 돌리면 영문도 자동 정확 매핑

---

## 4. 알려진 이슈

### 4.1 작업 중
- Bastion/Freja/Sierra 매핑 검수 미완

### 4.2 데이터
- PASSIVE 아이콘 대부분 영문 페이지에 카드 없음 (역할군 패시브). 8명만 추가 다운로드됨
- KR-only 영웅 7명: ability 부족 (anran/domina=0, emre/jetpack-cat/mizuki/vendetta/wuyang=1)
- mauga 무기(간 톰/쿠앙 머), junker-queen SECONDARY(재기드 블레이드), bastion SECONDARY(전술 수류탄) — Blizzard 영문 페이지에 카드 없음, 영문 빈값

### 4.3 운영
- prod 영문 데이터 미보강 (배포 후)
- `INTERNAL_API_KEY` 미설정
- 통합 테스트 미작성

---

## 5. 최근 머지

| PR | 내용 |
|---|---|
| #56 | feat(web): 라이트 테마 |
| #57 | chore(api): Hero.subrole NOT NULL + enum |
| #58 | chore: Biome useBlockStatements + VSCode 자동 포맷 |
| #60 | feat(web): 영웅 목록 op.gg 스타일 dense 테이블 |
| #61 | feat(web): 영웅 상세 banner + tabs |
| #63 | feat(api): 능력/특전 아이콘 자동 다운로드 + perks 한국어 시드 |
| #65 | feat(web): 패치노트 list/detail 리디자인 |
| #66 | feat(web): 영웅 목록 정렬 |
| #68 | feat(api): 부트 자동 시더 |
| #69 | feat(api): 패치 cron 자동 영웅 sync + audit |
| #67, #70 | release: develop → main |

---

## 6. 메모리 / 참고

- 메모리 인덱스: `~/.claude/projects/.../memory/MEMORY.md`
- 영문 sync 작업 컨텍스트: `~/.claude/projects/.../memory/watchpoint_en_sync_fix.md`
- 배포 작업 컨텍스트: `~/.claude/projects/.../memory/watchpoint_next_deploy.md`
- 기획/스펙: `SPEC.md`
- 설치/운영: `README.md`
- 개발 컨벤션: `CLAUDE.md`
