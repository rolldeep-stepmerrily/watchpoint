import { Global, Module } from '@nestjs/common';

import { ResponseCache } from './response-cache.service';

@Global()
@Module({
  providers: [ResponseCache],
  exports: [ResponseCache],
})
export class ResponseCacheModule {}
