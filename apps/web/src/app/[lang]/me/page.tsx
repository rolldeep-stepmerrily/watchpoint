import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { getCurrentUser } from '@/lib/auth-server';
import { resolveLang } from '@/lib/i18n';
import { getLabels } from '@/lib/labels';

import { AccountPanel } from './account-panel';

interface Props {
  params: Promise<{ lang: string }>;
}

export const dynamic = 'force-dynamic';

export const generateMetadata = async ({ params }: Props): Promise<Metadata> => {
  const lang = resolveLang((await params).lang);
  const t = getLabels(lang);

  return {
    title: t.profile.title,
    robots: { index: false, follow: false },
  };
};

export default async function MePage({ params }: Props): Promise<React.JSX.Element> {
  const lang = resolveLang((await params).lang);
  const user = await getCurrentUser();

  if (!user) {
    redirect(`/${lang}/auth/login`);
  }

  return (
    <AccountPanel
      lang={lang}
      initialUser={user}
    />
  );
}
