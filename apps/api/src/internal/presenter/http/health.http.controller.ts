import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { CheckHealthUseCase } from '../../application/use-cases/check-health.use-case';
import { GetHealthResponseDto } from './dto/get-health.dto';

@ApiTags('Health')
@Controller('health')
export class HealthHttpController {
  constructor(private readonly checkHealthUseCase: CheckHealthUseCase) {}

  @ApiOperation({ summary: 'DB + Redis 헬스체크 (배포 환경 probe용)' })
  @Get()
  async getHealth(): Promise<GetHealthResponseDto> {
    return await this.checkHealthUseCase.execute();
  }
}
