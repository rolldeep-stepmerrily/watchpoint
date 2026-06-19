'use client';

import { useRouter } from 'next/navigation';
import { type FormEvent, useState } from 'react';

import { getLabels, type Labels } from '@/lib/labels';

type AuthErrors = Labels['auth']['errors'];
type Locale = 'ko' | 'en' | 'ja';

const PASSWORD_PATTERN = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;
// BFF route handler가 백엔드 /auth/github로 302 — env 의존 없이 web 도메인 안에서 시작.
const GITHUB_AUTH_HREF = '/api/auth/github';

const mapErrorCode = (status: number, errorCode: string | undefined, t: AuthErrors): string => {
  if (errorCode === 'AUTH_EMAIL_ALREADY_EXISTS') {
    return t.emailInUse;
  }
  if (errorCode === 'AUTH_INVALID_CREDENTIALS') {
    return t.invalidCredentials;
  }
  if (status === 400 || status === 422) {
    return t.validation;
  }
  return t.generic;
};

interface Props {
  mode: 'login' | 'signup';
  lang: Locale;
}

export function AuthForm({ mode, lang }: Props): React.JSX.Element {
  // server page에서 t: Labels prop을 넘기면 함수가 포함되어 RSC 직렬화 실패 (digest 2301771644).
  // 클라이언트에서 lang으로 직접 라벨 빌드.
  const t = getLabels(lang);
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: FormEvent): Promise<void> => {
    event.preventDefault();
    setError(null);

    if (mode === 'signup' && !PASSWORD_PATTERN.test(password)) {
      setError(t.auth.errors.validation);
      return;
    }

    setSubmitting(true);

    try {
      const endpoint = mode === 'signup' ? '/api/auth/sign-up' : '/api/auth/login';
      const body: Record<string, string> = { email, password };
      if (mode === 'signup' && name.trim()) {
        body.name = name.trim();
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { errorCode?: string };
        setError(mapErrorCode(res.status, data.errorCode, t.auth.errors));
        setSubmitting(false);
        return;
      }

      router.push(`/${lang}`);
      router.refresh();
    } catch {
      setError(t.auth.errors.network);
      setSubmitting(false);
    }
  };

  const title = mode === 'login' ? t.auth.loginTitle : t.auth.signupTitle;
  const submitLabel = mode === 'login' ? t.auth.submitLogin : t.auth.submitSignup;
  const switchHref = mode === 'login' ? `/${lang}/auth/signup` : `/${lang}/auth/login`;
  const switchLabel = mode === 'login' ? t.auth.noAccount : t.auth.haveAccount;
  const switchCta = mode === 'login' ? t.auth.signup : t.auth.login;

  return (
    <div className="mx-auto max-w-sm">
      <h1 className="text-2xl font-bold text-(--color-text-strong) mb-6">{title}</h1>

      <a
        href={GITHUB_AUTH_HREF}
        className="flex items-center justify-center gap-2 w-full px-4 py-2 rounded-md border border-(--color-border) bg-(--color-surface) hover:bg-(--color-surface-hover) text-sm font-medium transition-colors"
      >
        <GithubIcon />
        {t.auth.githubLogin}
      </a>

      <div className="my-5 flex items-center gap-3 text-xs text-(--color-text-muted)">
        <span className="h-px flex-1 bg-(--color-border)" />
        {t.auth.or}
        <span className="h-px flex-1 bg-(--color-border)" />
      </div>

      <form
        onSubmit={submit}
        className="space-y-3"
      >
        <Field
          id="email"
          type="email"
          label={t.auth.email}
          value={email}
          onChange={setEmail}
          required
          autoComplete="email"
        />
        <Field
          id="password"
          type="password"
          label={t.auth.password}
          value={password}
          onChange={setPassword}
          required
          autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
          hint={mode === 'signup' ? t.auth.passwordHint : undefined}
        />
        {mode === 'signup' && (
          <Field
            id="name"
            type="text"
            label={t.auth.nameOptional}
            value={name}
            onChange={setName}
            autoComplete="name"
          />
        )}

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full mt-2 px-4 py-2 rounded-md bg-(--color-accent) text-(--color-bg) text-sm font-semibold hover:bg-(--color-accent-hover) disabled:opacity-60 transition-colors"
        >
          {submitting ? t.auth.loading : submitLabel}
        </button>
      </form>

      <p className="mt-6 text-sm text-center text-(--color-text-muted)">
        {switchLabel}{' '}
        <a
          href={switchHref}
          className="text-(--color-accent) hover:underline font-medium"
        >
          {switchCta}
        </a>
      </p>
    </div>
  );
}

interface FieldProps {
  id: string;
  type: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  autoComplete?: string;
  hint?: string;
}

function Field({ id, type, label, value, onChange, required, autoComplete, hint }: FieldProps): React.JSX.Element {
  return (
    <div>
      <label
        htmlFor={id}
        className="block text-xs font-medium text-(--color-text-muted) mb-1"
      >
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        autoComplete={autoComplete}
        className="w-full px-3 py-2 rounded-md border border-(--color-border) bg-(--color-bg) text-sm focus:outline-none focus:ring-2 focus:ring-(--color-accent)"
      />
      {hint && <p className="mt-1 text-xs text-(--color-text-muted)">{hint}</p>}
    </div>
  );
}

function GithubIcon(): React.JSX.Element {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56v-2.18c-3.2.7-3.88-1.36-3.88-1.36-.52-1.32-1.27-1.67-1.27-1.67-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.02 1.75 2.68 1.24 3.34.95.1-.74.4-1.24.72-1.53-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.18-3.1-.12-.29-.51-1.47.11-3.07 0 0 .97-.31 3.18 1.18a11.06 11.06 0 015.78 0c2.21-1.49 3.18-1.18 3.18-1.18.62 1.6.23 2.78.11 3.07.74.81 1.18 1.84 1.18 3.1 0 4.42-2.69 5.39-5.25 5.68.41.36.78 1.06.78 2.14v3.17c0 .31.21.68.79.56C20.21 21.39 23.5 17.08 23.5 12 23.5 5.65 18.35.5 12 .5z" />
    </svg>
  );
}
