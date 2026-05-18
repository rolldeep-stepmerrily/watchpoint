import { PrismaService } from '@@db';
import { type HeroRole, Prisma, ScrapeSource } from '@@prisma';
import { Injectable } from '@nestjs/common';

import { ScrapeJobRecorder, ScraperHttpClient } from '../common';
import type { ParsedHero } from './dto/parsed-hero.dto';
import { NamuwikiHeroParser } from './namuwiki-hero.parser';

const NAMUWIKI_BASE = 'https://namu.wiki/w/';

/**
 * catalog가 single source of truth — namuwiki에서 추론한 role/releasedAt보다 우선.
 */
export interface HeroSyncOverride {
  role: HeroRole;
  releasedAt: Date;
}

interface SyncResult {
  codename: string;
  abilitiesCount: number;
  hasStat: boolean;
  created: boolean;
}

@Injectable()
export class NamuwikiHeroScraper {
  constructor(
    private readonly httpClient: ScraperHttpClient,
    private readonly parser: NamuwikiHeroParser,
    private readonly recorder: ScrapeJobRecorder,
    private readonly prismaService: PrismaService,
  ) {}

  async sync(codename: string, pageTitle: string, override: HeroSyncOverride): Promise<SyncResult> {
    const url = `${NAMUWIKI_BASE}${encodeURIComponent(pageTitle)}`;

    return await this.recorder.run({
      source: ScrapeSource.NAMUWIKI_HERO,
      target: url,
      task: async () => {
        const html = await this.httpClient.fetchHtml(url);
        const parsed = this.parser.parse(html, codename, url);
        const result = await this.upsert(parsed, override);
        return {
          result,
          diffSummary: { codename: result.codename, abilities: result.abilitiesCount, created: result.created },
        };
      },
    });
  }

  private async upsert(parsed: ParsedHero, override: HeroSyncOverride): Promise<SyncResult> {
    const existing = await this.prismaService.hero.findUnique({ where: { codename: parsed.codename } });

    const updateData = {
      name: parsed.name,
      role: override.role,
      releasedAt: override.releasedAt,
      portraitUrl: parsed.portraitUrl,
      description: parsed.description,
      sourceUrl: parsed.sourceUrl,
    };

    const hero = existing
      ? await this.prismaService.hero.update({ where: { id: existing.id }, data: updateData })
      : await this.prismaService.hero.create({
          data: { codename: parsed.codename, ...updateData },
        });

    if (parsed.stat) {
      const statData = {
        health: parsed.stat.health,
        armor: parsed.stat.armor,
        shield: parsed.stat.shield,
        moveSpeed: parsed.stat.moveSpeed,
        extras: (parsed.stat.extras ?? Prisma.JsonNull) as Prisma.InputJsonValue,
      };
      await this.prismaService.heroStat.upsert({
        where: { heroId: hero.id },
        update: statData,
        create: { heroId: hero.id, ...statData },
      });
    }

    if (parsed.abilities.length > 0) {
      await this.prismaService.heroAbility.deleteMany({ where: { heroId: hero.id } });
      await this.prismaService.heroAbility.createMany({
        data: parsed.abilities.map((ability) => ({
          heroId: hero.id,
          slot: ability.slot,
          key: ability.key,
          name: ability.name,
          description: ability.description,
          stats: (ability.stats ?? Prisma.JsonNull) as Prisma.InputJsonValue,
          order: ability.order,
        })),
      });
    }

    return {
      codename: parsed.codename,
      abilitiesCount: parsed.abilities.length,
      hasStat: parsed.stat !== null,
      created: !existing,
    };
  }
}
