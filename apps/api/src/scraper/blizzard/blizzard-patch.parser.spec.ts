import { BlizzardPatchParser } from './blizzard-patch.parser';

describe('BlizzardPatchParser', () => {
  const parser = new BlizzardPatchParser();

  const buildPatchHtml = ({
    anchorId,
    dateText,
    title,
  }: {
    anchorId: string;
    dateText: string;
    title: string;
  }): string =>
    `<div class="PatchNotes-patch">
       <span class="anchor" id="${anchorId}"></span>
       <div class="PatchNotes-date">${dateText}</div>
       <h3 class="PatchNotes-patchTitle">${title}</h3>
     </div>`;

  describe('sourceUrl 개별화', () => {
    it('여러 patch가 같은 base URL을 공유해도 anchor 기반 fragment로 unique해야 한다', () => {
      const html = [
        buildPatchHtml({ anchorId: 'patch-2026-07-02', dateText: '2026년 7월 2일', title: 'A' }),
        buildPatchHtml({ anchorId: 'patch-2026-07-01', dateText: '2026년 7월 1일', title: 'B' }),
      ].join('\n');
      const base = 'https://overwatch.blizzard.com/ko-kr/news/patch-notes/';

      const patches = parser.parse(html, base);

      expect(patches).toHaveLength(2);
      expect(patches[0].sourceUrl).toBe(`${base}#patch-2026-07-02`);
      expect(patches[1].sourceUrl).toBe(`${base}#patch-2026-07-01`);
      expect(patches[0].sourceUrl).not.toBe(patches[1].sourceUrl);
    });
  });

  describe('날짜 파싱', () => {
    it('한국어 날짜 포맷을 UTC Date로 파싱한다', () => {
      const html = buildPatchHtml({ anchorId: 'patch-2026-05-12', dateText: '2026년 5월 12일', title: 'ko' });

      const [patch] = parser.parse(html, 'https://x/');

      expect(patch.version).toBe('2026.05.12');
      expect(patch.releasedAt.toISOString()).toBe('2026-05-12T00:00:00.000Z');
    });

    it('영어 날짜 포맷("July 2, 2026")도 파싱한다 — EN 페이지 지원', () => {
      const html = buildPatchHtml({ anchorId: 'patch-2026-07-02', dateText: 'July 2, 2026', title: 'en' });

      const [patch] = parser.parse(html, 'https://x/');

      expect(patch).toBeDefined();
      expect(patch.releasedAt.toISOString()).toBe('2026-07-02T00:00:00.000Z');
    });

    it('알 수 없는 날짜 포맷은 해당 patch만 skip한다', () => {
      const html = [
        buildPatchHtml({ anchorId: 'patch-2026-07-02', dateText: '2026-07-02', title: 'unparseable' }),
        buildPatchHtml({ anchorId: 'patch-2026-07-01', dateText: '2026년 7월 1일', title: 'ok' }),
      ].join('\n');

      const patches = parser.parse(html, 'https://x/');

      expect(patches).toHaveLength(1);
      expect(patches[0].version).toBe('2026.07.01');
    });
  });
});
