import type { HeroRole } from '../generated/prisma/client';

/**
 * 모든 오버워치 영웅의 정적 카탈로그.
 * 시드(seed.ts)와 hero-registry(CLI)가 모두 이 데이터를 참조해
 * codename ↔ 한글 이름 ↔ 나무위키 페이지가 항상 일치하도록 보장한다.
 *
 * 출시일은 정확하지 않을 수 있으므로 hero:edit으로 보정 가능.
 */
export interface HeroCatalogEntry {
  codename: string;
  name: string;
  role: HeroRole;
  releasedAt: string; // ISO date
  pageTitle: string; // 나무위키 페이지 제목
}

export const HERO_CATALOG: ReadonlyArray<HeroCatalogEntry> = [
  // Tank
  { codename: 'd-va', name: 'D.Va', role: 'TANK', releasedAt: '2016-05-24', pageTitle: 'D.Va(오버워치)' },
  { codename: 'doomfist', name: '둠피스트', role: 'TANK', releasedAt: '2017-07-27', pageTitle: '둠피스트(오버워치)' },
  { codename: 'hazard', name: '해저드', role: 'TANK', releasedAt: '2024-12-10', pageTitle: '해저드(오버워치)' },
  { codename: 'junker-queen', name: '정커퀸', role: 'TANK', releasedAt: '2022-10-04', pageTitle: '정커퀸(오버워치)' },
  { codename: 'mauga', name: '마우가', role: 'TANK', releasedAt: '2023-12-05', pageTitle: '마우가(오버워치)' },
  { codename: 'orisa', name: '오리사', role: 'TANK', releasedAt: '2017-03-21', pageTitle: '오리사(오버워치)' },
  { codename: 'ramattra', name: '라마트라', role: 'TANK', releasedAt: '2022-12-06', pageTitle: '라마트라(오버워치)' },
  { codename: 'reinhardt', name: '라인하르트', role: 'TANK', releasedAt: '2016-05-24', pageTitle: '라인하르트(오버워치)' },
  { codename: 'roadhog', name: '로드호그', role: 'TANK', releasedAt: '2016-05-24', pageTitle: '로드호그(오버워치)' },
  { codename: 'sigma', name: '시그마', role: 'TANK', releasedAt: '2019-08-04', pageTitle: '시그마(오버워치)' },
  { codename: 'winston', name: '윈스턴', role: 'TANK', releasedAt: '2016-05-24', pageTitle: '윈스턴(오버워치)' },
  { codename: 'wrecking-ball', name: '레킹볼', role: 'TANK', releasedAt: '2018-07-23', pageTitle: '레킹볼(오버워치)' },
  { codename: 'zarya', name: '자리야', role: 'TANK', releasedAt: '2016-05-24', pageTitle: '자리야(오버워치)' },

  // Damage
  { codename: 'ashe', name: '애쉬', role: 'DAMAGE', releasedAt: '2018-11-13', pageTitle: '애쉬(오버워치)' },
  { codename: 'bastion', name: '바스티온', role: 'DAMAGE', releasedAt: '2016-05-24', pageTitle: '바스티온(오버워치)' },
  { codename: 'cassidy', name: '캐서디', role: 'DAMAGE', releasedAt: '2016-05-24', pageTitle: '캐서디(오버워치)' },
  { codename: 'echo', name: '에코', role: 'DAMAGE', releasedAt: '2020-04-14', pageTitle: '에코(오버워치)' },
  { codename: 'freja', name: '프레야', role: 'DAMAGE', releasedAt: '2025-02-25', pageTitle: '프레야(오버워치)' },
  { codename: 'genji', name: '겐지', role: 'DAMAGE', releasedAt: '2016-05-24', pageTitle: '겐지(오버워치)' },
  { codename: 'hanzo', name: '한조', role: 'DAMAGE', releasedAt: '2016-05-24', pageTitle: '한조(오버워치)' },
  { codename: 'junkrat', name: '정크랫', role: 'DAMAGE', releasedAt: '2016-05-24', pageTitle: '정크랫(오버워치)' },
  { codename: 'mei', name: '메이', role: 'DAMAGE', releasedAt: '2016-05-24', pageTitle: '메이(오버워치)' },
  { codename: 'pharah', name: '파라', role: 'DAMAGE', releasedAt: '2016-05-24', pageTitle: '파라(오버워치)' },
  { codename: 'reaper', name: '리퍼', role: 'DAMAGE', releasedAt: '2016-05-24', pageTitle: '리퍼(오버워치)' },
  { codename: 'sierra', name: '시에라', role: 'DAMAGE', releasedAt: '2026-04-22', pageTitle: '시에라(오버워치)' },
  { codename: 'sojourn', name: '소전', role: 'DAMAGE', releasedAt: '2022-10-04', pageTitle: '소전(오버워치)' },
  { codename: 'soldier-76', name: '솔저: 76', role: 'DAMAGE', releasedAt: '2016-05-24', pageTitle: '솔저: 76' },
  { codename: 'sombra', name: '솜브라', role: 'DAMAGE', releasedAt: '2016-11-14', pageTitle: '솜브라(오버워치)' },
  { codename: 'symmetra', name: '시메트라', role: 'DAMAGE', releasedAt: '2016-05-24', pageTitle: '시메트라(오버워치)' },
  { codename: 'torbjorn', name: '토르비욘', role: 'DAMAGE', releasedAt: '2016-05-24', pageTitle: '토르비욘(오버워치)' },
  { codename: 'tracer', name: '트레이서', role: 'DAMAGE', releasedAt: '2016-05-24', pageTitle: '트레이서(오버워치)' },
  { codename: 'venture', name: '벤처', role: 'DAMAGE', releasedAt: '2024-04-16', pageTitle: '벤처(오버워치)' },
  { codename: 'widowmaker', name: '위도우메이커', role: 'DAMAGE', releasedAt: '2016-05-24', pageTitle: '위도우메이커(오버워치)' },

  // Support
  { codename: 'ana', name: '아나', role: 'SUPPORT', releasedAt: '2016-07-12', pageTitle: '아나(오버워치)' },
  { codename: 'baptiste', name: '바티스트', role: 'SUPPORT', releasedAt: '2019-03-19', pageTitle: '바티스트(오버워치)' },
  { codename: 'brigitte', name: '브리기테', role: 'SUPPORT', releasedAt: '2018-03-28', pageTitle: '브리기테(오버워치)' },
  { codename: 'illari', name: '일리아리', role: 'SUPPORT', releasedAt: '2023-08-10', pageTitle: '일리아리(오버워치)' },
  { codename: 'juno', name: '주노', role: 'SUPPORT', releasedAt: '2024-08-20', pageTitle: '주노(오버워치)' },
  { codename: 'kiriko', name: '키리코', role: 'SUPPORT', releasedAt: '2022-10-04', pageTitle: '키리코(오버워치)' },
  { codename: 'lifeweaver', name: '라이프위버', role: 'SUPPORT', releasedAt: '2023-04-11', pageTitle: '라이프위버(오버워치)' },
  { codename: 'lucio', name: '루시우', role: 'SUPPORT', releasedAt: '2016-05-24', pageTitle: '루시우(오버워치)' },
  { codename: 'mercy', name: '메르시', role: 'SUPPORT', releasedAt: '2016-05-24', pageTitle: '메르시(오버워치)' },
  { codename: 'moira', name: '모이라', role: 'SUPPORT', releasedAt: '2017-11-17', pageTitle: '모이라(오버워치)' },
  { codename: 'zenyatta', name: '젠야타', role: 'SUPPORT', releasedAt: '2016-05-24', pageTitle: '젠야타(오버워치)' },
];

export const HERO_CATALOG_BY_CODENAME: Record<string, HeroCatalogEntry> = Object.fromEntries(
  HERO_CATALOG.map((entry) => [entry.codename, entry]),
);
