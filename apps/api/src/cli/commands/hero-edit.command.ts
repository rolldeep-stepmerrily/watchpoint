import { PrismaService } from '@@db';
import { HeroRole } from '@@prisma';
import { Command, CommandRunner, Option } from 'nest-commander';

interface HeroEditOptions {
  name?: string;
  role?: HeroRole;
  description?: string;
  portraitUrl?: string;
  sourceUrl?: string;
}

@Command({
  name: 'hero:edit',
  arguments: '<codename>',
  description: '영웅 메타 필드를 수정합니다 (스탯/능력은 Prisma Studio 사용 권장).',
})
export class HeroEditCommand extends CommandRunner {
  constructor(private readonly prismaService: PrismaService) {
    super();
  }

  async run(inputs: string[], options: HeroEditOptions): Promise<void> {
    const [codename] = inputs;
    if (!codename) {
      console.error('codename 필요: pnpm hero:edit <codename> [--name ...] [--role TANK|DAMAGE|SUPPORT] ...');
      process.exit(1);
    }

    const hero = await this.prismaService.hero.findUnique({ where: { codename } });
    if (!hero) {
      console.error(`영웅 ${codename}을(를) 찾을 수 없습니다. hero:sync로 먼저 추가하세요.`);
      process.exit(1);
    }

    const data = {
      name: options.name,
      role: options.role,
      description: options.description,
      portraitUrl: options.portraitUrl,
      sourceUrl: options.sourceUrl,
    };

    const cleaned = Object.fromEntries(Object.entries(data).filter(([, value]) => value !== undefined));
    if (Object.keys(cleaned).length === 0) {
      console.log(`현재 ${codename} 상태:`);
      console.table({
        name: hero.name,
        role: hero.role,
        description: hero.description?.slice(0, 80) ?? '',
        portraitUrl: hero.portraitUrl ?? '',
        sourceUrl: hero.sourceUrl ?? '',
      });
      console.log('변경할 플래그를 제공하세요: --name, --role, --description, --portrait-url, --source-url');
      return;
    }

    const updated = await this.prismaService.hero.update({ where: { id: hero.id }, data: cleaned });
    console.log(`${codename} 수정 완료:`);
    console.table({ name: updated.name, role: updated.role, description: updated.description?.slice(0, 80) });
  }

  @Option({ flags: '--name <name>', description: '영웅 이름' })
  parseName(value: string): string {
    return value;
  }

  @Option({ flags: '--role <role>', description: 'TANK | DAMAGE | SUPPORT' })
  parseRole(value: string): HeroRole {
    return value.toUpperCase() as HeroRole;
  }

  @Option({ flags: '--description <text>', description: '영웅 설명' })
  parseDescription(value: string): string {
    return value;
  }

  @Option({ flags: '--portrait-url <url>', description: '영웅 초상화 이미지 URL' })
  parsePortraitUrl(value: string): string {
    return value;
  }

  @Option({ flags: '--source-url <url>', description: '출처 URL (나무위키 페이지 등)' })
  parseSourceUrl(value: string): string {
    return value;
  }
}
