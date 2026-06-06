import { PrismaService } from '@@db';
import { type Prisma, type HeroRole as PrismaHeroRole, type Subrole as PrismaSubrole } from '@@prisma';
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
    subrole: PrismaSubrole;
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
 * LIKE/ILIKE의 와일드카드(%, _)와 escape 문자(\)를 리터럴로 다루기 위해 이스케이프 — PostgreSQL 기본 escape character는 백슬래시
 *
 * @param {string} value 사용자 입력 검색어
 * @returns {string} 와일드카드/escape 문자가 이스케이프된 안전한 LIKE 패턴 조각
 */
const escapeLikePattern = (value: string): string => {
  return value.replace(/[\\%_]/g, '\\$&');
};

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
          "nameTranslations",
          role,
          subrole,
          "releasedAt",
          "portraitUrl"
        FROM heroes
        WHERE name ILIKE ${pattern}
           OR codename ILIKE ${pattern}
           OR ("nameTranslations" ->> 'en') ILIKE ${pattern}
        ORDER BY role ASC, name ASC
        LIMIT ${RESULT_LIMIT}
      `,
      this.prisma.$queryRaw<SearchResult['patchNotes']>`
        SELECT
          id,
          version,
          title,
          "titleTranslations",
          "releasedAt",
          "sourceUrl",
          summary,
          "summaryTranslations",
          status
        FROM patch_notes
        WHERE status = 'PUBLISHED'
          AND (
               version ILIKE ${pattern}
            OR title ILIKE ${pattern}
            OR summary ILIKE ${pattern}
            OR ("titleTranslations" ->> 'en') ILIKE ${pattern}
            OR ("summaryTranslations" ->> 'en') ILIKE ${pattern}
          )
        ORDER BY "releasedAt" DESC
        LIMIT ${RESULT_LIMIT}
      `,
    ]);

    return { heroes, patchNotes };
  }
}
