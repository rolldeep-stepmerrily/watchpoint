import Link from 'next/link';

export function SiteFooter() {
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
          <p className="text-(--color-text-muted) text-xs mt-3 leading-relaxed">
            오버워치 패치노트와 영웅 능력 수치를 한곳에서 추적하는 비공식 팬 사이트.
          </p>
          <p className="text-(--color-text-faint) text-[11px] mt-3 font-mono uppercase tracking-widest">
            quis custodiet ipsos custodes?
          </p>
        </div>

        <div>
          <div className="text-xs font-semibold uppercase tracking-widest text-(--color-text-muted) mb-3">
            탐색
          </div>
          <ul className="space-y-2">
            <li>
              <Link
                href="/heroes"
                className="hover:text-(--color-accent-hover)"
              >
                영웅
              </Link>
            </li>
            <li>
              <Link
                href="/patch-notes"
                className="hover:text-(--color-accent-hover)"
              >
                패치노트
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <div className="text-xs font-semibold uppercase tracking-widest text-(--color-text-muted) mb-3">
            데이터 출처
          </div>
          <ul className="space-y-2 text-xs">
            <li>
              <a
                href="https://overwatch.blizzard.com/ko-kr/news/patch-notes/"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-(--color-accent-hover)"
              >
                Blizzard 공식 패치노트 →
              </a>
            </li>
            <li>
              <a
                href="https://namu.wiki/"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-(--color-accent-hover)"
              >
                나무위키 (CC BY-NC-SA 2.0 KR) →
              </a>
            </li>
            <li>
              <a
                href="https://github.com/rolldeep-stepmerrily/watchpoint"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-(--color-accent-hover)"
              >
                GitHub →
              </a>
            </li>
          </ul>
          <p className="text-(--color-text-faint) text-[10px] mt-4">
            본 사이트는 Blizzard Entertainment와 무관한 팬 프로젝트입니다.
          </p>
        </div>
      </div>
    </footer>
  );
}
