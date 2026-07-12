import { PrismaClient } from '@@prisma';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor(configService: ConfigService) {
    const connectionString = configService.getOrThrow<string>('DATABASE_URL');
    const nodeEnv = configService.get<string>('NODE_ENV') ?? 'development';

    const adapter = new PrismaPg({ connectionString });

    super({
      adapter,
      log: ['local', 'development'].includes(nodeEnv) ? ['query', 'info', 'warn', 'error'] : ['warn', 'error'],
    });
  }

  /**
   * 모듈 초기화 시 DB 커넥션 확립
   */
  async onModuleInit(): Promise<void> {
    await this.$connect();
  }
}
