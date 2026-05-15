import Link from "next/link";

import { getHeroList } from "@/lib/api";
import { roleLabel } from "@/lib/format";

export const revalidate = 300;

export default async function HeroesPage() {
  const { items, total } = await getHeroList({ pageSize: 100 });

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">영웅 ({total})</h1>
      </header>

      {items.length === 0 ? (
        <p className="text-(--color-text-muted)">아직 등록된 영웅이 없습니다.</p>
      ) : (
        <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {items.map((hero) => (
            <li key={hero.id}>
              <Link
                href={`/heroes/${hero.codename}`}
                className="block p-4 rounded-lg border border-(--color-border) bg-(--color-surface) hover:bg-(--color-surface-hover) transition"
              >
                <div className="text-base font-semibold">{hero.name}</div>
                <div className="text-xs text-(--color-text-muted) mt-1">{roleLabel(hero.role)}</div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
