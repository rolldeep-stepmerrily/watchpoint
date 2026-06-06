import { CommandFactory } from 'nest-commander';

import { CliModule } from './cli.module';

const bootstrap = async (): Promise<void> => {
  await CommandFactory.run(CliModule, {
    logger: ['error', 'warn'],
    serviceErrorHandler: (error) => {
      console.error(error);
      process.exit(1);
    },
  });
};

bootstrap();
