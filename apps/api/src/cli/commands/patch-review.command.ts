import { PrismaService } from '@@db';
import { PatchNoteStatus } from '@@prisma';
import { Command, CommandRunner } from 'nest-commander';

@Command({
  name: 'patch:review',
  arguments: '<version>',
  description: '패치노트를 PUBLISHED로 승격합니다 (DRAFT/PENDING_REVIEW에서 호출).',
})
export class PatchReviewCommand extends CommandRunner {
  constructor(private readonly prismaService: PrismaService) {
    super();
  }

  async run(inputs: string[]): Promise<void> {
    const [version] = inputs;
    if (!version) {
      console.error('version 인자 필요: pnpm patch:review <version>');
      process.exit(1);
    }

    const patch = await this.prismaService.patchNote.findUnique({ where: { version } });
    if (!patch) {
      console.error(`패치노트 ${version}를 찾을 수 없습니다.`);
      process.exit(1);
    }

    if (patch.status === PatchNoteStatus.PUBLISHED) {
      console.log(`${version}는 이미 PUBLISHED 상태입니다.`);
      return;
    }

    await this.prismaService.patchNote.update({
      where: { id: patch.id },
      data: { status: PatchNoteStatus.PUBLISHED },
    });

    console.log(`${version} 상태 변경: ${patch.status} → PUBLISHED`);
  }
}
