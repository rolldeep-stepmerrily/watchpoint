# @watchpoint/e2e

Playwright 기반 smoke 테스트. 현재 chromium 단일 프로젝트.

## 사전 조건

테스트는 로컬에 띄워둔 dev 서버에 붙는다. 한 번에 다음을 만족시켜야 한다:

1. **Docker compose up** — PostgreSQL + Redis
   ```bash
   docker-compose up -d
   ```
2. **마이그레이션 + 시드** — DB가 비어있으면 영웅/패치노트 spec이 실패한다
   ```bash
   pnpm db:migrate
   pnpm db:seed
   ```
3. **dev 서버 기동** — api(3000) + web(3001)
   ```bash
   pnpm dev
   ```
4. **브라우저 1회 설치** (Playwright chromium)
   ```bash
   pnpm --filter @watchpoint/e2e install:browsers
   ```

## 실행

```bash
# 헤드리스 (기본)
pnpm e2e

# UI 모드 (디버깅용)
pnpm --filter @watchpoint/e2e test:ui

# 브라우저 띄워서 (헤디드)
pnpm --filter @watchpoint/e2e test:headed
```

다른 환경(staging 등)에 붙이려면:
```bash
E2E_BASE_URL=https://watchpoint-preview.vercel.app pnpm e2e
```

## 커버 범위 (smoke)

- **home.spec.ts** — 홈 헤더/메인 카드/검색바 노출
- **heroes.spec.ts** — 영웅 목록 → 상세 진입, 역할 그룹 헤더 표시
- **search.spec.ts** — 검색 드롭다운 노출, Esc로 닫힘, ↓+Enter로 결과 이동

CRUD나 데이터 정합성은 검증하지 않는다. 단순 라우팅/렌더 회귀 감지가 목적.
