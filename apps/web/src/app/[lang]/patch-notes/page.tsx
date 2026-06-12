import type { Metadata } from 'next';
import Link from 'next/link';

import { JsonLd } from '@/components/json-ld';
import { getPatchNoteList } from '@/lib/api';
import { resolveLang } from '@/lib/i18n';
import { getLabels } from '@/lib/labels';
import { absoluteUrl, buildBreadcrumbJsonLd, buildItemListJsonLd, SITE_NAME } from '@/lib/seo';

export const revalidate = 60;

interface Props {
  params: Promise<{ lang: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const lang = resolveLang((await params).lang);
  const t = getLabels(lang);
  return {
    title: t.patchNotes.title,
    description: t.patchNotes.description,
    alternates: { canonical: `/${lang}/patch-notes` },
    openGraph: { title: t.patchNotes.title, url: `/${lang}/patch-notes` },
  };
}

export default async function PatchNotesPage({ params }: Props) {
  const lang = resolveLang((await params).lang);
  const t = getLabels(lang);
  const { items, total } = await getPatchNoteList({ pageSize: 50, lang });

  const itemList = buildItemListJsonLd(
    items.map((patch) => ({
      name: `${patch.version} · ${patch.title}`,
      url: absoluteUrl(`/${lang}/patch-notes/${patch.version}`),
    })),
  );
  const breadcrumb = buildBreadcrumbJsonLd([
    { name: SITE_NAME, url: absoluteUrl(`/${lang}`) },
    { name: t.patchNotes.title, url: absoluteUrl(`/${lang}/patch-notes`) },
  ]);

  return (
    <div className="space-y-6">
      <JsonLd data={[itemList, breadcrumb]} />
      <header className="border-b border-(--color-border) pb-5">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-(--color-text-muted)">Patch Notes</p>
        <div className="flex items-baseline gap-3 mt-1">
          <h1 className="text-3xl font-extrabold tracking-tight text-(--color-text-strong)">{t.patchNotes.title}</h1>
          <span className="text-sm text-(--color-text-faint) font-mono">{total}</span>
        </div>
        <p className="text-sm text-(--color-text-muted) mt-2">{t.patchNotes.subtitle}</p>
      </header>

      {items.length === 0 ? (
        <p className="text-(--color-text-muted) text-sm py-6">{t.patchNotes.empty}</p>
      ) : (
        <div className="border border-(--color-border) rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-(--color-surface) border-b border-(--color-border)">
              <tr className="text-left text-[10px] uppercase tracking-widest text-(--color-text-muted)">
                <th className="px-3 py-2 w-24">{t.patchNotes.columns.version}</th>
                <th className="px-3 py-2 w-32 hidden sm:table-cell">{t.patchNotes.columns.date}</th>
                <th className="px-3 py-2">{t.patchNotes.columns.title}</th>
              </tr>
            </thead>
            <tbody>
              {items.map((patch) => (
                <tr
                  key={patch.id}
                  className="group border-b border-(--color-border) last:border-0 hover:bg-(--color-accent-faint) transition-colors align-top"
                >
                  <td className="px-3 py-3 whitespace-nowrap">
                    <Link
                      href={`/${lang}/patch-notes/${patch.version}` as never}
                      className="text-(--color-accent) font-mono text-sm font-bold hover:text-(--color-accent-hover)"
                    >
                      {patch.version}
                    </Link>
                  </td>
                  <td className="px-3 py-3 hidden sm:table-cell text-(--color-text-faint) font-mono text-xs whitespace-nowrap">
                    {t.date(patch.releasedAt)}
                  </td>
                  <td className="px-3 py-3">
                    <Link
                      href={`/${lang}/patch-notes/${patch.version}` as never}
                      className="block -mx-3 -my-3 px-3 py-3"
                    >
                      <div className="font-bold text-(--color-text-strong) group-hover:text-(--color-accent) transition-colors">
                        {patch.title}
                      </div>
                      {patch.summary && (
                        <p className="text-xs text-(--color-text-muted) mt-1 line-clamp-2 leading-relaxed">
                          {patch.summary}
                        </p>
                      )}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
