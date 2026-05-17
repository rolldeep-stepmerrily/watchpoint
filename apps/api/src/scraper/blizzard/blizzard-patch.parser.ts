import { Injectable, Logger } from '@nestjs/common';
import * as cheerio from 'cheerio';
import type { AnyNode } from 'domhandler';

import { AppException } from '@@exceptions';
import type { EntryCategory } from '@@prisma';

import { SCRAPER_ERRORS } from '../scraper.error';
import type { ParsedPatchEntry, ParsedPatchNote } from './dto/parsed-patch-note.dto';

@Injectable()
export class BlizzardPatchParser {
  private readonly logger = new Logger(BlizzardPatchParser.name);

  parse(html: string, sourceUrl: string): ParsedPatchNote[] {
    try {
      const $ = cheerio.load(html);
      const patches: ParsedPatchNote[] = [];

      $('.PatchNotes-patch').each((_, element) => {
        const node = $(element);
        const anchorId = node.find('.anchor').first().attr('id') ?? '';
        const version = this.extractVersionFromAnchor(anchorId);
        const dateText = node.find('.PatchNotes-date').first().text().trim();
        const title = node.find('.PatchNotes-patchTitle').first().text().trim();

        if (!(version && title)) {
          this.logger.warn(`patch skipped — missing version/title (anchor=${anchorId})`);
          return;
        }

        patches.push({
          version,
          title,
          releasedAt: this.parseKoreanDate(dateText) ?? new Date(),
          sourceUrl,
          summary: null,
          entries: this.parseEntries($, node),
        });
      });

      this.logger.log(`parsed ${patches.length} patch(es) from ${sourceUrl}`);
      return patches;
    } catch (error) {
      this.logger.error('blizzard parse failed', error as Error);
      throw new AppException(SCRAPER_ERRORS.PARSE_FAILED);
    }
  }

  /**
   * 페이지 하단의 "이전 월 패치 노트" 링크를 절대 URL로 반환.
   * 더 이전 페이지가 없으면 null.
   */
  extractPrevPageUrl(html: string, currentUrl: string): string | null {
    const $ = cheerio.load(html);
    const href = $('.PatchNotesPaginationLink--prev').first().attr('href');
    if (!href) return null;
    return new URL(href, currentUrl).toString();
  }

  private parseEntries($: cheerio.CheerioAPI, root: cheerio.Cheerio<AnyNode>): ParsedPatchEntry[] {
    const entries: ParsedPatchEntry[] = [];
    let order = 0;

    root.find('.PatchNotes-section').each((_, section) => {
      const sectionNode = $(section);
      const sectionTitle = sectionNode.find('.PatchNotes-sectionTitle').first().text().trim();
      const sectionType = this.extractSectionType(sectionNode.attr('class') ?? '');
      const sectionDescription = sectionNode.find('.PatchNotes-sectionDescription').first().text().trim();

      if (sectionType === 'hero_update') {
        sectionNode.find('.PatchNotesHeroUpdate').each((_index, heroElement) => {
          const heroNode = $(heroElement);
          const heroName = heroNode.find('.PatchNotesHeroUpdate-name').first().text().trim();
          if (!heroName) return;

          const devNote = heroNode.find('.PatchNotesHeroUpdate-dev').first().text().trim();
          const abilityChanges = this.collectAbilityChanges($, heroNode);
          const body = [devNote, abilityChanges].filter(Boolean).join('\n\n');

          entries.push({
            category: 'HERO_BALANCE',
            heroCodename: null,
            heroName,
            title: `${sectionTitle ? `[${sectionTitle}] ` : ''}${heroName}`,
            body: body || '(상세 변경사항 없음)',
            order: order++,
          });
        });
      } else {
        const body = [sectionDescription, this.collectListItems($, sectionNode)].filter(Boolean).join('\n\n');
        if (!(sectionTitle || body)) return;

        entries.push({
          category: this.inferGenericCategory(sectionTitle),
          heroCodename: null,
          heroName: null,
          title: sectionTitle || '일반 업데이트',
          body: body || '(상세 변경사항 없음)',
          order: order++,
        });
      }
    });

    return entries;
  }

  private collectAbilityChanges($: cheerio.CheerioAPI, heroNode: cheerio.Cheerio<AnyNode>): string {
    const lines: string[] = [];
    heroNode.find('.PatchNotesAbilityUpdate').each((_, element) => {
      const node = $(element);
      const name = node.find('.PatchNotesAbilityUpdate-name').first().text().trim();
      const details = node
        .find('.PatchNotesAbilityUpdate-detailList li')
        .map((__, li) => $(li).text().trim())
        .get()
        .filter(Boolean);
      if (name) {
        lines.push(`■ ${name}`);
        for (const detail of details) lines.push(`  - ${detail}`);
      }
    });
    return lines.join('\n');
  }

  private collectListItems($: cheerio.CheerioAPI, node: cheerio.Cheerio<AnyNode>): string {
    return node
      .find('> .PatchNotes-update li, > div > li, > ul > li')
      .map((_, li) => `- ${$(li).text().trim()}`)
      .get()
      .filter((line) => line.length > 2)
      .join('\n');
  }

  private extractSectionType(className: string): 'hero_update' | 'generic_update' | 'unknown' {
    if (className.includes('hero_update')) return 'hero_update';
    if (className.includes('generic_update')) return 'generic_update';
    return 'unknown';
  }

  private inferGenericCategory(title: string): EntryCategory {
    const lower = title.toLowerCase();
    if (lower.includes('버그') || lower.includes('수정')) return 'BUG_FIX';
    if (lower.includes('지도') || lower.includes('맵')) return 'MAP';
    if (lower.includes('시스템') || lower.includes('인터페이스') || lower.includes('UI')) return 'SYSTEM';
    return 'GENERAL';
  }

  private extractVersionFromAnchor(anchorId: string): string | null {
    // patch-2026-05-12 → 2026.05.12
    const match = anchorId.match(/^patch-(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) return null;
    return `${match[1]}.${match[2]}.${match[3]}`;
  }

  private parseKoreanDate(text: string): Date | null {
    // "2026년 5월 12일"
    const match = text.match(/(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일/);
    if (!match) return null;
    const [, y, m, d] = match;
    const date = new Date(`${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}T00:00:00Z`);
    return Number.isNaN(date.getTime()) ? null : date;
  }
}
