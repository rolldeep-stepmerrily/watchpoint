import { Injectable, Logger } from '@nestjs/common';
import * as cheerio from 'cheerio';
import type { AnyNode } from 'domhandler';

import { AppException } from '@@exceptions';
import { EntryCategory } from '@@prisma';

import { SCRAPER_ERRORS } from '../scraper.error';
import type { ParsedPatchEntry, ParsedPatchNote } from './dto/parsed-patch-note.dto';

const CATEGORY_KEYWORDS: ReadonlyArray<{ category: EntryCategory; keywords: string[] }> = [
  { category: 'HERO_BALANCE', keywords: ['영웅', '밸런스', 'hero', 'balance'] },
  { category: 'BUG_FIX', keywords: ['버그', '수정', 'bug', 'fix'] },
  { category: 'MAP', keywords: ['지도', '맵', 'map'] },
  { category: 'SYSTEM', keywords: ['시스템', '게임 모드', 'system'] },
];

@Injectable()
export class BlizzardPatchParser {
  private readonly logger = new Logger(BlizzardPatchParser.name);

  parse(html: string, sourceUrl: string): ParsedPatchNote[] {
    try {
      const $ = cheerio.load(html);
      const patches: ParsedPatchNote[] = [];

      $('article, section.PatchNotes-patch, [class*="PatchNotes-patch"]').each((_, element) => {
        const node = $(element);
        const title = node.find('h2, [class*="PatchNotes-patchTitle"]').first().text().trim();
        const dateText = node.find('time, [class*="PatchNotes-date"]').first().attr('datetime') ??
          node.find('time, [class*="PatchNotes-date"]').first().text().trim();
        const version = this.extractVersion(title) ?? this.extractVersion(node.attr('id') ?? '');

        if (!version || !title) return;

        const releasedAt = this.parseDate(dateText);
        const entries = this.parseEntries($, node);
        const summary = node.find('[class*="PatchNotes-sectionDescription"]').first().text().trim() || null;

        patches.push({
          version,
          title,
          releasedAt,
          sourceUrl,
          summary,
          entries,
        });
      });

      return patches;
    } catch (error) {
      this.logger.error('blizzard parse failed', error as Error);
      throw new AppException(SCRAPER_ERRORS.PARSE_FAILED);
    }
  }

  private parseEntries($: cheerio.CheerioAPI, root: cheerio.Cheerio<AnyNode>): ParsedPatchEntry[] {
    const entries: ParsedPatchEntry[] = [];
    let order = 0;

    root.find('[class*="PatchNotesHeroUpdate"], [class*="PatchNotes-update"]').each((_, item) => {
      const node = $(item);
      const title = node.find('h3, h4, [class*="PatchNotesHeroUpdate-name"]').first().text().trim();
      const body = node.find('[class*="PatchNotes-body"], ul, p').text().trim();
      if (!title) return;

      const category = this.inferCategory(title, body);
      const heroCodename = this.extractHeroCodename(node);

      entries.push({ category, heroCodename, title, body, order: order++ });
    });

    return entries;
  }

  private extractVersion(text: string): string | null {
    const match = text.match(/(\d+\.\d+(?:\.\d+)?)/);
    return match ? match[1] : null;
  }

  private parseDate(text: string): Date {
    const trimmed = text.trim();
    const parsed = new Date(trimmed);
    if (Number.isNaN(parsed.getTime())) {
      return new Date();
    }
    return parsed;
  }

  private inferCategory(title: string, body: string): EntryCategory {
    const text = `${title} ${body}`.toLowerCase();
    for (const { category, keywords } of CATEGORY_KEYWORDS) {
      if (keywords.some((keyword) => text.includes(keyword))) return category;
    }
    return 'GENERAL';
  }

  private extractHeroCodename(node: cheerio.Cheerio<AnyNode>): string | null {
    const dataHero = node.attr('data-hero') ?? node.find('[data-hero]').first().attr('data-hero');
    if (dataHero) return dataHero.toLowerCase();
    return null;
  }
}
