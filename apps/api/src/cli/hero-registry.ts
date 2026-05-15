/**
 * codename → { 나무위키 페이지 제목, 한글 이름 } 매핑.
 * 신규 영웅 추가 시 여기에 등록하면 hero:sync / hero:sync:all에서 사용됨.
 * koreanName은 블리자드 패치노트 본문에 노출되는 이름과 일치해야 자동 매핑됨.
 */
export interface HeroRegistryEntry {
  pageTitle: string;
  koreanName: string;
}

export const HERO_REGISTRY: Record<string, HeroRegistryEntry> = {
  sierra: { pageTitle: '시에라(오버워치)', koreanName: '시에라' },
};

export const HERO_CODENAMES = Object.keys(HERO_REGISTRY);
