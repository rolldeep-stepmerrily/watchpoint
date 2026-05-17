import { ApiProperty } from '@nestjs/swagger';

type ComponentStatus = 'ok' | 'fail';
type OverallStatus = 'ok' | 'degraded';

export class GetHealthResponseDto {
  @ApiProperty({ enum: ['ok', 'degraded'] })
  status!: OverallStatus;

  @ApiProperty({ enum: ['ok', 'fail'] })
  db!: ComponentStatus;

  @ApiProperty({ enum: ['ok', 'fail'] })
  redis!: ComponentStatus;

  @ApiProperty({ description: 'ISO 8601 datetime' })
  timestamp!: string;
}
