import type { Locale } from '@@shared';
import Link from 'next/link';

import { getLabels } from '@/lib/labels';

// 로케일별로 Blizzard 공식 페이지가 달라서 URL도 같이 전환.
const BLIZZARD_PATCH_NOTES_URL = {
  ko: 'https://overwatch.blizzard.com/ko-kr/news/patch-notes/',
  en: 'https://overwatch.blizzard.com/en-us/news/patch-notes/',
} as const;

const BLIZZARD_HEROES_URL = {
  ko: 'https://overwatch.blizzard.com/ko-kr/heroes/',
  en: 'https://overwatch.blizzard.com/en-us/heroes/',
} as const;

interface Props {
  lang: Locale;
}

export const SiteFooter = ({ lang }: Props): React.JSX.Element => {
  const t = getLabels(lang);
  // labels는 'ja'를 'en'으로 fallback하므로 외부 URL도 en으로 맞춘다.
  const externalLocale = lang === 'ko' ? 'ko' : 'en';

  return (
    <footer className="mt-16 border-t border-(--color-border) bg-(--color-surface)/40">
      <div className="max-w-6xl mx-auto px-6 py-10 grid gap-8 sm:grid-cols-3 text-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-6 w-6 rounded bg-(--color-accent) text-(--color-bg) flex items-center justify-center font-black text-xs">
              W
            </span>
            <span className="font-extrabold tracking-tight text-(--color-text-strong)">WATCHPOINT</span>
          </div>
          <p className="text-(--color-text-muted) text-xs mt-3 leading-relaxed">{t.footer.description}</p>
          <p className="text-(--color-text-faint) text-[11px] mt-3 font-mono uppercase tracking-widest">
            quis custodiet ipsos custodes?
          </p>
        </div>

        <div>
          <div className="text-xs font-semibold uppercase tracking-widest text-(--color-text-muted) mb-3">
            {t.footer.navHeading}
          </div>
          <ul className="space-y-2">
            <li>
              <Link
                href={`/${lang}/heroes` as never}
                className="hover:text-(--color-accent) transition-colors"
              >
                {t.nav.heroes}
              </Link>
            </li>
            <li>
              <Link
                href={`/${lang}/patch-notes` as never}
                className="hover:text-(--color-accent) transition-colors"
              >
                {t.nav.patchNotes}
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <div className="text-xs font-semibold uppercase tracking-widest text-(--color-text-muted) mb-3">
            {t.footer.sourcesHeading}
          </div>
          <ul className="space-y-2 text-xs">
            <li>
              <a
                href={BLIZZARD_PATCH_NOTES_URL[externalLocale]}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-(--color-accent) transition-colors"
              >
                {t.footer.sourcePatchNotes} →
              </a>
            </li>
            <li>
              <a
                href={BLIZZARD_HEROES_URL[externalLocale]}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-(--color-accent) transition-colors"
              >
                {t.footer.sourceHeroes} →
              </a>
            </li>
            <li>
              <a
                href="https://github.com/rolldeep-stepmerrily/watchpoint"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-(--color-accent) transition-colors"
              >
                {t.footer.sourceGithub} →
              </a>
            </li>
          </ul>
          <p className="text-(--color-text-faint) text-[10px] mt-4">{t.footer.disclaimer}</p>
        </div>
      </div>
    </footer>
  );
};
