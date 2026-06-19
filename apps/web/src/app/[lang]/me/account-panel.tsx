'use client';

import { useRouter } from 'next/navigation';
import { type FormEvent, useState } from 'react';

import { type CurrentUser } from '@/hooks/use-current-user';
import { getLabels, type Labels } from '@/lib/labels';

type Locale = 'ko' | 'en' | 'ja';
type ProfileErrors = Labels['auth']['errors'];

const PASSWORD_PATTERN = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;

const mapPasswordError = (status: number, errorCode: string | undefined, e: ProfileErrors): string => {
  if (errorCode === 'USER_WRONG_PASSWORD') {
    return e.wrongPassword;
  }
  if (errorCode === 'USER_PASSWORD_SAME') {
    return e.samePassword;
  }
  if (errorCode === 'USER_NO_PASSWORD') {
    return e.noPassword;
  }
  if (status === 400 || status === 422) {
    return e.validation;
  }
  return e.generic;
};

interface Props {
  lang: Locale;
  initialUser: CurrentUser;
}

export function AccountPanel({ lang, initialUser }: Props): React.JSX.Element {
  const t = getLabels(lang);
  const [user, setUser] = useState<CurrentUser>(initialUser);

  return (
    <div className="space-y-8">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold text-(--color-text-strong)">{t.profile.title}</h1>
        <p className="text-sm text-(--color-text-muted)">{user.email}</p>
        <p className="text-xs text-(--color-text-muted)">{t.profile.joinedAt(user.createdAt)}</p>
      </header>

      <ProfileForm
        lang={lang}
        user={user}
        onUpdated={setUser}
      />

      {user.hasPassword ? (
        <PasswordForm lang={lang} />
      ) : (
        <section className="rounded-md border border-(--color-border) bg-(--color-surface) p-4 text-sm text-(--color-text-muted)">
          <h2 className="mb-2 text-base font-semibold text-(--color-text-strong)">{t.profile.passwordSection}</h2>
          <p>{t.profile.oauthOnlyHint}</p>
        </section>
      )}
    </div>
  );
}

interface ProfileFormProps {
  lang: Locale;
  user: CurrentUser;
  onUpdated: (next: CurrentUser) => void;
}

function ProfileForm({ lang, user, onUpdated }: ProfileFormProps): React.JSX.Element {
  const t = getLabels(lang);
  const router = useRouter();
  const [name, setName] = useState(user.name ?? '');
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const submit = async (event: FormEvent): Promise<void> => {
    event.preventDefault();
    setError(null);
    setSavedAt(null);
    setSubmitting(true);

    try {
      const body = {
        name: name.trim() === '' ? null : name.trim(),
        avatarUrl: avatarUrl.trim() === '' ? null : avatarUrl.trim(),
      };
      const res = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        setError(res.status === 400 || res.status === 422 ? t.auth.errors.validation : t.auth.errors.generic);
        setSubmitting(false);
        return;
      }

      const next = (await res.json()) as CurrentUser;
      onUpdated(next);
      setSavedAt(Date.now());
      router.refresh();
    } catch {
      setError(t.auth.errors.network);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={submit}
      className="space-y-3 rounded-md border border-(--color-border) bg-(--color-surface) p-4"
    >
      <h2 className="text-base font-semibold text-(--color-text-strong)">{t.profile.profileSection}</h2>

      <Field
        id="name"
        type="text"
        label={t.profile.nameLabel}
        value={name}
        onChange={setName}
        autoComplete="name"
      />
      <Field
        id="avatarUrl"
        type="url"
        label={t.profile.avatarUrlLabel}
        value={avatarUrl}
        onChange={setAvatarUrl}
        autoComplete="url"
        hint={t.profile.avatarUrlHint}
      />

      {error && <p className="text-sm text-red-500">{error}</p>}
      {savedAt && !error && <p className="text-sm text-(--color-accent)">{t.profile.saved}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="px-4 py-2 rounded-md bg-(--color-accent) text-(--color-bg) text-sm font-semibold hover:bg-(--color-accent-hover) disabled:opacity-60 transition-colors"
      >
        {submitting ? t.auth.loading : t.profile.saveProfile}
      </button>
    </form>
  );
}

interface PasswordFormProps {
  lang: Locale;
}

function PasswordForm({ lang }: PasswordFormProps): React.JSX.Element {
  const t = getLabels(lang);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [changedAt, setChangedAt] = useState<number | null>(null);

  const submit = async (event: FormEvent): Promise<void> => {
    event.preventDefault();
    setError(null);
    setChangedAt(null);

    if (!PASSWORD_PATTERN.test(newPassword)) {
      setError(t.auth.errors.validation);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/users/me/password', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { errorCode?: string };
        setError(mapPasswordError(res.status, data.errorCode, t.auth.errors));
        setSubmitting(false);
        return;
      }

      setCurrentPassword('');
      setNewPassword('');
      setChangedAt(Date.now());
    } catch {
      setError(t.auth.errors.network);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={submit}
      className="space-y-3 rounded-md border border-(--color-border) bg-(--color-surface) p-4"
    >
      <h2 className="text-base font-semibold text-(--color-text-strong)">{t.profile.passwordSection}</h2>

      <Field
        id="currentPassword"
        type="password"
        label={t.profile.currentPassword}
        value={currentPassword}
        onChange={setCurrentPassword}
        required
        autoComplete="current-password"
      />
      <Field
        id="newPassword"
        type="password"
        label={t.profile.newPassword}
        value={newPassword}
        onChange={setNewPassword}
        required
        autoComplete="new-password"
        hint={t.auth.passwordHint}
      />

      {error && <p className="text-sm text-red-500">{error}</p>}
      {changedAt && !error && <p className="text-sm text-(--color-accent)">{t.profile.passwordChanged}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="px-4 py-2 rounded-md bg-(--color-accent) text-(--color-bg) text-sm font-semibold hover:bg-(--color-accent-hover) disabled:opacity-60 transition-colors"
      >
        {submitting ? t.auth.loading : t.profile.changePassword}
      </button>
    </form>
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
