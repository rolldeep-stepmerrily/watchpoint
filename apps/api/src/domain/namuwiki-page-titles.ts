/**
 * 영웅 codename → 나무위키 영웅 페이지 제목 매핑.
 *
 * 일부 영웅은 동음이의 페이지가 존재해 `(오버워치)` suffix가 붙음.
 * `NamuwikiHeroScraper.buildCandidateUrls`가 suffix가 안 통할 경우 bare 페이지로 폴백.
 *
 * 신규 영웅 추가 시 이 매핑에도 함께 추가.
 */
export const NAMUWIKI_PAGE_TITLES: Readonly<Record<string, string>> = {
  // Tank
  'd-va': 'D.Va',
  domina: '도미나',
  doomfist: '둠피스트',
  hazard: '해저드',
  'junker-queen': '정커퀸',
  mauga: '마우가',
  orisa: '오리사',
  ramattra: '라마트라',
  reinhardt: '라인하르트(오버워치)',
  roadhog: '로드호그',
  sigma: '시그마(오버워치)',
  winston: '윈스턴(오버워치)',
  'wrecking-ball': '레킹볼(오버워치)',
  zarya: '자리야',

  // Damage
  anran: '안란',
  ashe: '애쉬(오버워치)',
  bastion: '바스티온',
  cassidy: '캐서디',
  echo: '에코(오버워치)',
  freja: '프레야',
  genji: '겐지(오버워치)',
  hanzo: '한조(오버워치)',
  junkrat: '정크랫',
  mei: '메이(오버워치)',
  pharah: '파라(오버워치)',
  reaper: '리퍼(오버워치)',
  sierra: '시에라(오버워치)',
  sojourn: '소전(오버워치)',
  emre: '엠레(오버워치)',
  vendetta: '벤데타(오버워치)',
  'soldier-76': '솔저: 76',
  sombra: '솜브라',
  symmetra: '시메트라',
  torbjorn: '토르비욘',
  tracer: '트레이서(오버워치)',
  venture: '벤처(오버워치)',
  widowmaker: '위도우메이커',

  // Support
  ana: '아나(오버워치)',
  baptiste: '바티스트(오버워치)',
  brigitte: '브리기테',
  illari: '일리아리',
  'jetpack-cat': '제트팩 캣',
  juno: '주노(오버워치)',
  kiriko: '키리코(오버워치)',
  lifeweaver: '라이프위버',
  lucio: '루시우(오버워치)',
  mercy: '메르시',
  mizuki: '미즈키(오버워치)',
  moira: '모이라(오버워치)',
  wuyang: '우양',
  zenyatta: '젠야타',
};
