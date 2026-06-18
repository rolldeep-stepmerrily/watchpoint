import type { Metadata } from 'next';

import { resolveLang } from '@/lib/i18n';
import { getLabels } from '@/lib/labels';

import { AuthForm } from '../auth-form';

interface Props {
  params: Promise<{ lang: string }>;
}

export const dynamic = 'force-dynamic';

export const generateMetadata = async ({ params }: Props): Promise<Metadata> => {
  const lang = resolveLang((await params).lang);
  const t = getLabels(lang);

  return {
    title: t.auth.loginTitle,
    robots: { index: false, follow: false },
  };
};

export default async function LoginPage({ params }: Props): Promise<React.JSX.Element> {
  const lang = resolveLang((await params).lang);
  const t = getLabels(lang);

  return (
    <AuthForm
      mode="login"
      lang={lang}
      t={t}
    />
  );
}
