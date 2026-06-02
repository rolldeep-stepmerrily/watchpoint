/**
 * DB의 능력/특전 이름과 namuwiki alt 텍스트가 다른 경우의 매핑.
 * 키: codename, 값: { DB 이름: namuwiki에서 사용하는 alt 텍스트 }
 *
 * 예) D.Va의 PRIMARY 능력은 DB에 "융합 캐논"이지만, namuwiki는 옛 이름 "융합포" 사용.
 */
export const ICON_NAME_OVERRIDES: Record<string, Record<string, string>> = {
  'd-va': {
    '융합 캐논': '융합포',
  },
};
