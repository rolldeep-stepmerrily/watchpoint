/**
 * codename → 나무위키 페이지 제목 매핑.
 * 신규 영웅 추가 시 여기에 등록하면 hero:sync / hero:sync:all에서 사용됨.
 */
export const HERO_REGISTRY: Record<string, string> = {
  sierra: '시에라(오버워치)',
};

export const HERO_CODENAMES = Object.keys(HERO_REGISTRY);
