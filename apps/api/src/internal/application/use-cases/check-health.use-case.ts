import { PrismaService } from '@@db';
import { RedisService } from '@@redis';
import { Injectable, Logger } from '@nestjs/common';

import { GetHealthResponseDto } from '../../presenter/http/dto/get-health.dto';

@Injectable()
export class CheckHealthUseCase {
  private readonly logger = new Logger(CheckHealthUseCase.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  /**
   * DB와 Redis 연결 상태를 점검. 둘 다 OK면 status=ok, 하나라도 실패면 degraded.
   *
   * @returns {Promise<GetHealthResponseDto>} 컴포넌트별 상태 + 총합
   */
  async execute(): Promise<GetHealthResponseDto> {
    const [db, redis] = await Promise.all([this.pingDb(), this.pingRedis()]);

    return {
      status: db === 'ok' && redis === 'ok' ? 'ok' : 'degraded',
      db,
      redis,
      timestamp: new Date().toISOString(),
    };
  }

  private async pingDb(): Promise<'ok' | 'fail'> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return 'ok';
    } catch (error) {
      this.logger.warn(`db ping failed: ${(error as Error).message}`);
      return 'fail';
    }
  }

  private async pingRedis(): Promise<'ok' | 'fail'> {
    try {
      const reply = await this.redis.getClient().ping();
      return reply === 'PONG' ? 'ok' : 'fail';
    } catch (error) {
      this.logger.warn(`redis ping failed: ${(error as Error).message}`);
      return 'fail';
    }
  }
}
