interface Props {
  initialQ: string;
  placeholder: string;
  help: string;
  submitLabel: string;
}

/**
 * 검색 입력 폼 — GET method라 client component 불필요. submit 시 URL의 ?q=가 갱신되며
 * RSC `CareerSearchPage`가 재렌더된다. Next.js 라우터는 같은 라우트 내 query change에
 * full reload 없이 RSC 결과만 교체.
 */
export function CareerSearchForm({ initialQ, placeholder, help, submitLabel }: Props) {
  return (
    <form className="space-y-2">
      <div className="flex gap-2">
        <input
          type="search"
          name="q"
          defaultValue={initialQ}
          placeholder={placeholder}
          maxLength={40}
          required
          className="flex-1 rounded-md border border-(--color-border-strong) bg-(--color-surface-elevated) px-3 py-2 text-sm text-(--color-text-strong) outline-none placeholder:text-(--color-text-faint) focus:border-(--color-accent)"
        />
        <button
          type="submit"
          className="rounded-md bg-(--color-accent) px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-(--color-accent-hover)"
        >
          {submitLabel}
        </button>
      </div>
      <p className="text-[11px] text-(--color-text-faint)">{help}</p>
    </form>
  );
}
