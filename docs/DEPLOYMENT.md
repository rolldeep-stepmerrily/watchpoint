# Watchpoint 프로덕션 배포 가이드

대상 인프라: **Railway** (api + PostgreSQL + Redis) + **Vercel** (web). 모두 무료/저가 티어에서 시작 가능.

---

## 1. Railway — API + DB + Redis

### 1.1 프로젝트 생성

1. [railway.app](https://railway.app) 가입 후 GitHub 연동
2. **New Project → Deploy from GitHub repo → `watchpoint`** 선택
3. 첫 서비스는 자동으로 모노레포 루트에서 빌드 시작 (`railway.json` 자동 인식)

### 1.2 PostgreSQL 추가

1. 프로젝트 화면에서 **+ New → Database → Add PostgreSQL**
2. 생성 후 자동으로 `DATABASE_URL`이 같은 프로젝트의 다른 서비스에 reference variable로 노출됨

### 1.3 Redis 추가

1. **+ New → Database → Add Redis**
2. Variables 탭에서 `REDIS_URL`(또는 `REDISHOST`, `REDISPORT`, `REDISPASSWORD`) 자동 생성됨

### 1.4 API 서비스 환경 변수 설정

api 서비스 → **Variables** 탭:

```bash
NODE_ENV=production
# PORT는 Railway가 자동 주입 — 직접 설정 X
DATABASE_URL=${{Postgres.DATABASE_URL}}
REDIS_HOST=${{Redis.REDISHOST}}
REDIS_PORT=${{Redis.REDISPORT}}
REDIS_PASSWORD=${{Redis.REDISPASSWORD}}
SCRAPER_USER_AGENT=WatchpointBot/0.1 (+https://your-site.example)
SCRAPER_PATCH_CRON=0 */6 * * *
SCRAPER_REQUEST_DELAY_MS=2000
SCRAPER_CRON_ENABLED=true
```

> `${{ServiceName.VAR}}` 문법은 Railway가 cross-service reference를 해석한다.

### 1.5 배포 트리거

`develop` → `main` 머지 시 자동 배포. 또는 services → **Deploy** 버튼 수동 트리거.

빌드/실행은 `railway.json`이 제어:
- Build: `pnpm install --frozen-lockfile && pnpm --filter @watchpoint/api build`
- Start: `pnpm --filter @watchpoint/api start:prod` (= `prisma migrate deploy && node dist/main`)
- Healthcheck: `GET /health` → 200 응답 확인

### 1.6 퍼블릭 도메인 노출

api 서비스 → **Settings → Networking → Generate Domain**.  
생성된 URL(예: `watchpoint-api-production.up.railway.app`)을 메모. 다음 단계에서 사용.

---

## 2. Vercel — Web

### 2.1 프로젝트 import

1. [vercel.com](https://vercel.com) 가입 후 GitHub 연동
2. **Add New → Project → `watchpoint` import**
3. Framework: `Next.js` 자동 감지 (`vercel.json`이 빌드 설정 제어)
4. **Root Directory는 그대로 둘 것** (루트). `vercel.json`이 모노레포 빌드 명령을 명시함.

### 2.2 환경 변수

**Settings → Environment Variables** (Production / Preview 모두):

```bash
WEB_API_BASE_URL=https://watchpoint-api-production.up.railway.app
```

> 1.6 단계에서 받은 Railway 도메인. **trailing slash 금지.**

### 2.3 배포

`develop` 브랜치는 Preview, `main`은 Production. PR이 열리면 자동 Preview URL 생성.

---

## 3. 초기 데이터 적재 (1회성)

배포 직후 DB는 비어있다. CLI는 Railway에서 직접 실행할 수 있다:

```bash
# 로컬에서 Railway CLI 사용
railway link  # 프로젝트 선택
railway run --service api pnpm patch:backfill --max-pages 5
railway run --service api pnpm hero:sync:all
```

또는 Railway 대시보드 **Service → Exec** 탭에서 동일 명령 실행.

이후 Cron이 6시간마다 신규 패치를 자동 동기화한다.

---

## 4. 동작 검증 체크리스트

배포 후:

- [ ] `curl https://<railway-api>/health` → `{"status":"ok",...}` 200
- [ ] `curl https://<railway-api>/heroes` → JSON 응답 200
- [ ] `https://<vercel-web>/heroes` 진입 → 영웅 목록 SSR
- [ ] `https://<vercel-web>/patch-notes/<version>` → 상세 페이지 SSR
- [ ] 검색바에서 영웅명 입력 → 드롭다운 결과 (Vercel rewrite로 `/api/search` 통과)
- [ ] `https://<railway-api>/internal/health` → 403 (외부 접근 차단 확인)

---

## 5. 트러블슈팅

| 증상 | 원인 / 조치 |
|---|---|
| Railway 빌드 `prisma generate` 실패 | `pnpm install`이 workspace 의존성 못 찾음 → `corepack enable` 누락 확인. `railway.json` build command 점검 |
| `/health`가 503 | `DATABASE_URL` 또는 `REDIS_*` 변수 누락. Railway Variables에서 reference variable 표기 확인 |
| Vercel build에서 `@watchpoint/shared` 못 찾음 | Root Directory를 `apps/web`으로 잡지 않았는지 확인 — **루트로 두어야 함** |
| 검색 드롭다운만 빈 결과 | `WEB_API_BASE_URL`이 잘못됐거나 Railway API가 401/CORS. Vercel function logs 확인 |
| 패치노트가 안 갱신됨 | `SCRAPER_CRON_ENABLED=true` 인지, Railway Logs에서 `[ScraperModule]` 출력 확인 |

---

## 6. 향후 도메인 연결

플랫폼 서브도메인 → 커스텀 도메인 전환 시:
- Vercel: Settings → Domains → Add → DNS 안내대로 `A`/`CNAME` 설정
- Railway: Settings → Networking → Custom Domain → 같은 방식
- Vercel에 도메인 붙은 후 `WEB_API_BASE_URL`은 그대로 (api는 별 도메인 사용 권장)
