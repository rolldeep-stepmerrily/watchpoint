export interface ParsedNamuwikiAbility {
  /** 목차 anchor (예: 's-5.4') */
  sectionId: string;
  /** 영문 능력명 slug (소문자, 공백 → '-'). 블리자드 ability id와 매칭 후보 */
  enSlug: string;
  /** 영문 능력명 원문 */
  enName: string;
  /** 한글 능력명 (괄호 안 영문 제거 후) */
  koName: string;
  /** 키 표시 (예: '기본 무기' / '우클릭' / '좌Shift' / 'E' / 'Q' / '지속 능력'). 없으면 null */
  keyHint: string | null;
}

export interface ParsedNamuwikiHero {
  codename: string;
  pageTitle: string;
  sourceUrl: string;
  abilities: ParsedNamuwikiAbility[];
}
