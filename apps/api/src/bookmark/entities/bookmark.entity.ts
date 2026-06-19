import { ApiProperty } from '@nestjs/swagger';

export type BookmarkKindValue = 'HERO' | 'PLAYER';

export const BOOKMARK_KINDS = ['HERO', 'PLAYER'] as const satisfies readonly BookmarkKindValue[];

export class BookmarkEntity {
  @ApiProperty()
  id!: number;

  @ApiProperty({ enum: BOOKMARK_KINDS })
  kind!: BookmarkKindValue;

  @ApiProperty({ description: '영웅은 codename, 플레이어는 OverFast playerId' })
  targetId!: string;

  @ApiProperty({ required: false, type: Object, nullable: true })
  metadata!: Record<string, unknown> | null;

  @ApiProperty()
  createdAt!: Date;
}
