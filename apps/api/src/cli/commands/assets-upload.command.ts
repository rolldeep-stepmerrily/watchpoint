import { PrismaService } from '@@db';
import { readdir, stat } from 'node:fs/promises';
import { join, resolve as pathResolve, relative, sep } from 'node:path';
import { Command, CommandRunner } from 'nest-commander';

import { MinioUploader } from '../../scraper/minio';

const PUBLIC_ICONS_ROOT_REL = '../web/public/icons';

/**
 * apps/web/public/icons 전체 파일을 MinIO bucket에 업로드하고 DB의 portraitUrl/iconUrl을 MinIO 공개 URL로 갱신.
 *
 * - 키 구조 = 로컬 path 그대로 유지 (예: `heroes/d-va/portrait.jpg`).
 * - 멱등 — 같은 키에 다시 업로드되면 덮어쓰기. DB URL도 매번 동일 패턴이라 차이 없음.
 * - DB 매칭은 path suffix 기준 (`/icons/heroes/...` 또는 `https://.../icons/heroes/...`).
 *   기존 namuwiki/외부 CDN URL이 portraitUrl에 남아있는 영웅은 file path 패턴으로 따로 매칭 안 되니
 *   `hero:portrait:download:all`을 먼저 돌려서 로컬 path 형태로 만들어 둘 것.
 */
@Command({
  name: 'assets:upload',
  description: 'apps/web/public/icons 전체를 MinIO에 업로드하고 DB iconUrl/portraitUrl을 MinIO URL로 갱신.',
})
export class AssetsUploadCommand extends CommandRunner {
  constructor(
    private readonly uploader: MinioUploader,
    private readonly prisma: PrismaService,
  ) {
    super();
  }

  async run(): Promise<void> {
    const root = pathResolve(process.cwd(), PUBLIC_ICONS_ROOT_REL);
    const files = await this.walk(root);
    console.log(`업로드 대상 ${files.length}개 파일 (root=${root})`);

    let uploaded = 0;
    const localToPublic = new Map<string, string>();
    for (const localPath of files) {
      const key = relative(root, localPath).split(sep).join('/');
      try {
        const publicUrl = await this.uploader.uploadFile(localPath, `icons/${key}`);
        localToPublic.set(`/icons/${key}`, publicUrl);
        uploaded++;
      } catch (error) {
        console.error(`업로드 실패 ${key}: ${(error as Error).message}`);
      }
    }
    console.log(`업로드 완료 ${uploaded}/${files.length}`);

    const dbStats = await this.updateDbUrls(localToPublic);
    console.log(`DB URL 갱신: heroes ${dbStats.heroes}, abilities ${dbStats.abilities}, perks ${dbStats.perks}`);
  }

  private async walk(dir: string): Promise<string[]> {
    const entries = await readdir(dir, { withFileTypes: true });
    const result: string[] = [];
    for (const entry of entries) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        result.push(...(await this.walk(full)));
      } else if (entry.isFile()) {
        const info = await stat(full);
        if (info.size > 0) {
          result.push(full);
        }
      }
    }
    return result;
  }

  private async updateDbUrls(
    map: ReadonlyMap<string, string>,
  ): Promise<{ heroes: number; abilities: number; perks: number }> {
    const heroes = await this.remapHeroes(map);
    const abilities = await this.remapAbilities(map);
    const perks = await this.remapPerks(map);
    return { heroes, abilities, perks };
  }

  private async remapHeroes(map: ReadonlyMap<string, string>): Promise<number> {
    const rows = await this.prisma.hero.findMany({ select: { id: true, portraitUrl: true } });
    let updated = 0;
    for (const row of rows) {
      const next = row.portraitUrl ? map.get(row.portraitUrl) : null;
      if (next && next !== row.portraitUrl) {
        await this.prisma.hero.update({ where: { id: row.id }, data: { portraitUrl: next } });
        updated++;
      }
    }
    return updated;
  }

  private async remapAbilities(map: ReadonlyMap<string, string>): Promise<number> {
    const rows = await this.prisma.heroAbility.findMany({ select: { id: true, iconUrl: true } });
    let updated = 0;
    for (const row of rows) {
      const next = row.iconUrl ? map.get(row.iconUrl) : null;
      if (next && next !== row.iconUrl) {
        await this.prisma.heroAbility.update({ where: { id: row.id }, data: { iconUrl: next } });
        updated++;
      }
    }
    return updated;
  }

  private async remapPerks(map: ReadonlyMap<string, string>): Promise<number> {
    const rows = await this.prisma.heroPerk.findMany({ select: { id: true, iconUrl: true } });
    let updated = 0;
    for (const row of rows) {
      const next = row.iconUrl ? map.get(row.iconUrl) : null;
      if (next && next !== row.iconUrl) {
        await this.prisma.heroPerk.update({ where: { id: row.id }, data: { iconUrl: next } });
        updated++;
      }
    }
    return updated;
  }
}
