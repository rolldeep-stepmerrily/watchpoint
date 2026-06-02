# Watchpoint — 진행 현황 / 남은 작업

> 2026-06-02 기준. PR #63(능력/특전 아이콘 자동 다운로드) 머지 직후 시점의 스냅샷.
> develop = `e97b1a3`

## 0. 다음 작업 (사용자 미정)

1. **패치노트 페이지 리디자인** — list + detail. 현재 어두운 톤. op.gg 스타일 dense + 라이트 테마 정렬
2. **홈 페이지 리디자인** — 현재 placeholder 수준
3. **PASSIVE 아이콘 보강** — 33개 영웅의 PASSIVE는 Blizzard 페이지에 카드 미노출. 역할군 아이콘(탱커/딜러/지원가)으로 일괄 채우거나 별도 수집
4. **KR-only 영웅 데이터 보강** — anran/domina(0 ability), emre/jetpack-cat/mizuki/vendetta/wuyang(1 ability). `pnpm hero:edit` + Prisma Studio
5. **Prod 배포** — Railway에 `hero:sync:en:all`, `patch:sync:en` 실행 + `INTERNAL_API_KEY` env 추가

## 1. 한눈에

| 영역 | 상태 | 비고 |
|---|---|---|
| 도메인 모델 + i18n + HeroPerk | ✅ 완료 | |
| 공개 API (GET 7종) + 캐시 | ✅ 완료 | `?lang=` 지원 |
| 라이트 테마 + Overwatch 색상 | ✅ 완료 | PR #56 (#FA9C1D / #4A4C4E / #FFFFFF) |
| 영웅 목록 (op.gg 스타일) | ✅ 완료 | PR #60 dense 테이블 + 역할 탭 |
| 영웅 상세 (banner + tabs) | ✅ 완료 | PR #61 |
| 영웅 subrole (NOT NULL + enum) | ✅ 완료 | PR #57 |
| 특전 시스템 (HeroPerk) | ✅ 인프라/UI/데이터 모두 완료 | PR #52 인프라, PR #63에서 51명 자동 시드 |
| **능력/특전 아이콘 자체 호스팅** | ✅ 완료 | **PR #63** — Blizzard ko-kr에서 자동 다운로드 |
| Biome 규칙 (useBlockStatements) + VSCode 저장 시 포맷 | ✅ 완료 | PR #58 |
| 스크래퍼 (Blizzard 패치/영웅, namuwiki 영웅) | ✅ 완료 | Cron + CLI |
| Throttler / Helmet / Compression / Validation | ✅ 완료 | |
| 패치노트 페이지 디자인 | 🟡 구식 톤 | 리디자인 대기 |
| 홈 페이지 디자인 | 🟡 placeholder | 리디자인 대기 |
| PASSIVE 아이콘 (33개) | 🔲 미수집 | Blizzard 페이지 미노출 — 역할 아이콘 대체 필요 |
| KR-only 영웅 데이터 (7명) | 🔲 부족 | 수동 보정 필요 |
| Prod 영문 데이터 보강 | 🔲 대기 | Railway 배포 차단 |
| 테스트 (jest/e2e) | 🔲 미작성 | |

---

## 2. 최근 머지 (2026-05-28 ~ 06-02)

| PR | 내용 |
|---|---|
| #56 | feat(web): 라이트 테마 + Overwatch 공식 색상 적용 |
| #57 | chore(api): Hero.subrole NOT NULL + Subrole enum |
| #58 | chore: Biome useBlockStatements + VSCode 저장 시 자동 포맷 |
| #60 | feat(web): 영웅 목록을 op.gg 스타일 dense 테이블로 리디자인 |
| #61 | feat(web): 영웅 상세 페이지 리디자인 — banner + tabs |
| **#63** | **feat(api): 능력/특전 아이콘 자동 다운로드 (Blizzard) + perks 한국어 시드** |

---

## 3. PR #63 결과 상세

### 아이콘 매칭률

| 항목 | 결과 | 비고 |
|------|------|------|
| **Abilities** | **226 / 266 (85%)** | 미매칭 40개는 모두 정상 |
| **Perks** | **204 / 204 (100%)** | 51명 × 4 perks 자동 시드 완료 |
| 아이콘 파일 | 427개 | `apps/web/public/icons/heroes/<codename>/{abilities,perks}/*.png` |

### Ability 미매칭 40개 분석 (의도된 정상 케이스)
- **PASSIVE 33개**: 역할군 공통 패시브(탱커/딜러/지원가)는 Blizzard 영웅 페이지에 카드 미노출. 별도 수집 필요
- **Cassidy 3개**: SECONDARY(난사), ABILITY_2(자기 수류탄), PASSIVE — Blizzard 페이지에 능력 3개만 노출 (Peacekeeper, Combat Roll, Deadeye)
- **KR-only 신영웅 5개**: emre, jetpack-cat, mizuki, vendetta, wuyang — DB ability 1개씩만 시드되어 있고 Blizzard 영문/한국어 페이지 능력과 매핑 부족

### 매칭 전략
- **Perks**: `<div class="perk-details (left|right) (minor|major) N">` class로 tier+slot 100% 결정. 이름 매칭 불필요
- **Abilities**: `<blz-tab-control id=...>`의 id(영문 slug) 기반
  - 1:1 순서 매칭 (`MATCH_SLOT_ORDER`: PRIMARY → SECONDARY → ABILITY_1 → ABILITY_2 → ULTIMATE)
  - PRIMARY+SECONDARY 합쳐진 무기 영웅 fallback (Moira 등)
  - parsed > matchable 시 마지막 카드 drop fallback (Junkrat 등)
  - 모드 영웅(14명) `ABILITY_ID_TO_SLOT` override로 명시 매핑

### 새 CLI
```bash
pnpm hero:icons:download <codename>      # 단일 영웅 — 능력 아이콘 + perks 시드/아이콘
pnpm hero:icons:download:all             # 51명 일괄 (~17분)
```

---

## 4. 미해결 / 알려진 이슈

### 4.1 데이터
- **PASSIVE 33개 아이콘 부재** — 역할군 패시브는 한 영웅 페이지에 안 나옴. 옵션: (a) 역할 아이콘으로 일괄 채움, (b) 별도 페이지에서 수집
- **KR-only 영웅 ability 부족** — anran(0), domina(0), emre/jetpack-cat/mizuki/vendetta/wuyang(1 ability). 한국어 namuwiki도 자동 추출 어려움 (Vue SPA)
- **Cassidy SECONDARY/ABILITY_2 데이터 불완전** — Blizzard 페이지에 3개만 노출. 모드 영웅이라서가 아니라 페이지가 간소화됨

### 4.2 UI
- 패치노트 list/detail이 구식 디자인. PR #56 + #60 톤과 미통일
- 홈 페이지 거의 비어있음
- 모바일 검증 부족

### 4.3 운영
- Prod(Railway) 영문 데이터 미보강. `hero:sync:en:all` + `patch:sync:en` 실행 차단됨
- `INTERNAL_API_KEY` env 미설정 → `/internal/*` 접근 불가
- 통합 테스트 미작성

---

## 5. 우선순위 다음 단계

| # | 항목 | 노력 | 영향 |
|---|---|---|---|
| 1 | 패치노트 페이지 리디자인 (list + detail) | 1일 | High — 메인 콘텐츠 |
| 2 | 홈 페이지 리디자인 | 0.5일 | Medium — 첫 진입 인상 |
| 3 | PASSIVE 아이콘 (역할 아이콘 일괄) | 1시간 | Medium — 능력 시각 완성도 |
| 4 | KR-only 영웅 7명 정보 보강 | 영웅당 10분 | Medium — 데이터 일관성 |
| 5 | Prod에서 `hero:sync:en:all` + `patch:sync:en` | 5분 | High — 영문 사용자 |
| 6 | 통합 테스트 골든패스 5개 | 0.5일 | Medium — 안전망 |
| 7 | Prisma 인덱스 보강 (M3) | 0.5일 + migration | Low (v1 규모) |

Railway 배포(#5)는 사용자 결정 대기.

---

## 6. 메모리 / 참고

- 메모리 인덱스: `~/.claude/projects/.../memory/MEMORY.md`
- 기획/스펙: `SPEC.md`
- 설치/운영: `README.md`
- 개발 컨벤션: `CLAUDE.md`
