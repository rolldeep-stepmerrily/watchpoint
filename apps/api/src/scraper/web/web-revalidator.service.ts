import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { request as undiciRequest } from 'undici';

const REVALIDATE_PATH = '/api/revalidate';
const REQUEST_TIMEOUT_MS = 5_000;

interface RevalidateInput {
  /** 패치노트 신규/변경된 version 문자열 — 빈 배열이면 patch path 호출 안 함 */
  patchVersions?: string[];
  /** 영향 받은 영웅 codename — 빈 배열이면 hero path 호출 안 함 */
  heroCodenames?: string[];
}

@Injectable()
export class WebRevalidatorService {
  private readonly logger = new Logger(WebRevalidatorService.name);
  private readonly baseUrl?: string;
  private readonly secret?: string;

  constructor(configService: ConfigService) {
    this.baseUrl = configService.get<string>('WEB_REVALIDATE_URL')?.replace(/\/$/, '');
    this.secret = configService.get<string>('WEB_REVALIDATE_SECRET');
  }

  /**
   * Next.js web의 `/api/revalidate`로 POST해서 ISR 캐시를 무효화한다.
   * - env 미설정이면 silent skip (로컬 개발 편의)
   * - 네트워크 실패는 throw 하지 않고 warn만 — sync 자체는 이미 성공한 후 호출되니 무효화 실패가 데이터 무결성에 영향 없음
   */
  async revalidate(input: RevalidateInput): Promise<void> {
    if (!(this.baseUrl && this.secret)) {
      return;
    }

    const paths = this.buildPaths(input);
    if (paths.length === 0) {
      return;
    }

    const url = `${this.baseUrl}${REVALIDATE_PATH}`;
    try {
      const response = await undiciRequest(url, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-revalidate-secret': this.secret,
        },
        body: JSON.stringify({ paths }),
        headersTimeout: REQUEST_TIMEOUT_MS,
        bodyTimeout: REQUEST_TIMEOUT_MS,
      });
      if (response.statusCode >= 200 && response.statusCode < 300) {
        // undici keepalive 소켓 재사용을 위해 응답 본문을 항상 drain. 안 하면 다음 요청에서
        // 'other side closed' / 'socket reuse' 류 에러나 fd 누수가 생길 수 있다.
        await response.body.dump();
        this.logger.log(
          `revalidate ok: ${paths.length} paths (${paths.slice(0, 3).join(', ')}${paths.length > 3 ? '…' : ''})`,
        );
      } else {
        const text = await response.body.text();
        this.logger.warn(`revalidate non-2xx: status=${response.statusCode} body=${text.slice(0, 200)}`);
      }
    } catch (error) {
      this.logger.warn(`revalidate failed: ${(error as Error).message}`);
    }
  }

  private buildPaths({ patchVersions = [], heroCodenames = [] }: RevalidateInput): string[] {
    const paths = new Set<string>();
    if (patchVersions.length > 0) {
      paths.add('/');
      paths.add('/patch-notes');
      for (const version of patchVersions) {
        const safe = sanitizeSegment(version);
        if (safe) {
          paths.add(`/patch-notes/${safe}`);
        }
      }
    }
    if (heroCodenames.length > 0) {
      paths.add('/');
      paths.add('/heroes');
      for (const codename of heroCodenames) {
        const safe = sanitizeSegment(codename);
        if (safe) {
          paths.add(`/heroes/${safe}`);
        }
      }
    }
    return [...paths];
  }
}

function sanitizeSegment(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  if (!/^[a-zA-Z0-9._-]+$/.test(trimmed)) {
    return null;
  }
  return trimmed;
}
