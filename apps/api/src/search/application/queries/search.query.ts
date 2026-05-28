import { PrismaService } from '@@db';
import { type Prisma, type HeroRole as PrismaHeroRole } from '@@prisma';
import { IQueryHandler, Query, QueryHandler } from '@nestjs/cqrs';

const RESULT_LIMIT = 10;

interface SearchQueryProps {
  q: string;
}

export interface SearchResult {
  heroes: Array<{
    id: number;
    codename: string;
    name: string;
    nameTranslations: Prisma.JsonValue;
    role: PrismaHeroRole;
    subrole: string | null;
    releasedAt: Date;
    portraitUrl: string | null;
  }>;
  patchNotes: Array<{
    id: number;
    version: string;
    title: string;
    titleTranslations: Prisma.JsonValue;
    releasedAt: Date;
    sourceUrl: string;
    summary: string | null;
    summaryTranslations: Prisma.JsonValue;
    status: 'PUBLISHED';
  }>;
}

export class SearchQuery extends Query<SearchResult> {
  constructor(public readonly props: SearchQueryProps) {
    super();
  }
}

/**
 * LIKE/ILIKE의 와일드카드(%, _)와 escape 문자(\)를 리터럴로 다루기 위해 이스케이프.
 * PostgreSQL 기본 escape character는 백슬래시.
 */
function escapeLikePattern(value: string): string {
  return value.replace(/[\\%_]/g, '\\$&');
}

@QueryHandler(SearchQuery)
export class SearchQueryHandler implements IQueryHandler<SearchQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: SearchQuery): Promise<SearchResult> {
    const { q } = query.props;
    const pattern = `%${escapeLikePattern(q)}%`;

    const [heroes, patchNotes] = await this.prisma.$transaction([
      this.prisma.$queryRaw<SearchResult['heroes']>`
        SELECT
          id,
          codename,
          name,
          name_translations AS "nameTranslations",
          role,
          subrole,
          released_at AS "releasedAt",
          portrait_url AS "portraitUrl"
        FROM heroes
        WHERE name ILIKE ${pattern}
           OR codename ILIKE ${pattern}
           OR (name_translations ->> 'en') ILIKE ${pattern}
        ORDER BY role ASC, name ASC
        LIMIT ${RESULT_LIMIT}
      `,
      this.prisma.$queryRaw<SearchResult['patchNotes']>`
        SELECT
          id,
          version,
          title,
          title_translations AS "titleTranslations",
          released_at AS "releasedAt",
          source_url AS "sourceUrl",
          summary,
          summary_translations AS "summaryTranslations",
          status
        FROM patch_notes
        WHERE status = 'PUBLISHED'
          AND (
               version ILIKE ${pattern}
            OR title ILIKE ${pattern}
            OR summary ILIKE ${pattern}
            OR (title_translations ->> 'en') ILIKE ${pattern}
            OR (summary_translations ->> 'en') ILIKE ${pattern}
          )
        ORDER BY released_at DESC
        LIMIT ${RESULT_LIMIT}
      `,
    ]);

    return { heroes, patchNotes };
  }
}
