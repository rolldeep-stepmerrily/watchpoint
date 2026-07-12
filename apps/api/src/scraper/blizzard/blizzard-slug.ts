/**
 * 일부 영웅은 codename과 Blizzard URL slug가 다름. 한국어/영문 페이지 모두 동일 보정값 공유.
 */
export const CODENAME_TO_BLIZZARD_SLUG: Readonly<Record<string, string>> = {
  'd-va': 'dva',
};

/**
 * 주어진 codename을 Blizzard URL slug로 변환. 오버라이드가 없으면 codename 그대로 반환
 *
 * @param {string} codename 영웅 codename
 * @returns {string} Blizzard 페이지에서 사용하는 slug
 */
export const toBlizzardSlug = (codename: string): string => CODENAME_TO_BLIZZARD_SLUG[codename] ?? codename;
