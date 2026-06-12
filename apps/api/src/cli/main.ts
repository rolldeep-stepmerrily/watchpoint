import { CommandFactory } from 'nest-commander';

import { CliModule } from './cli.module';

/**
 * CommandFactory.runWithoutClosing 을 직접 부르지 않으므로 standalone app 종료는 nest-commander가 담당하지만,
 * Windows + ioredis lazyConnect 환경에서 RedisService.onModuleDestroy가 호출돼야 소켓이 닫히고 프로세스가 종료된다.
 * serviceErrorHandler에서 곧장 process.exit(1)을 하면 onModuleDestroy 훅을 건너뛰어 hang 또는 dangling 소켓이 남음.
 * exitCode만 세팅하고 자연 종료를 기다리는 패턴으로 변경.
 */
const bootstrap = async (): Promise<void> => {
  try {
    await CommandFactory.run(CliModule, {
      logger: ['error', 'warn'],
      serviceErrorHandler: (error) => {
        console.error(error);
        process.exitCode = 1;
      },
    });
  } catch (error) {
    console.error('CLI bootstrap failed:', error);
    process.exitCode = 1;
  }
};

bootstrap();
