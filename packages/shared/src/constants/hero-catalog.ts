import type { HeroRole } from '../enums/hero-role';
import type { Subrole } from '../enums/subrole';

/**
 * 모든 오버워치 영웅의 정적 카탈로그.
 * 시드(`apps/api/prisma/seed.ts`)와 hero-registry(CLI)가 모두 이 데이터를 참조해
 * codename ↔ 한글 이름이 항상 일치하도록 보장한다.
 *
 * 출시일은 정확하지 않을 수 있으므로 hero:edit으로 보정 가능.
 *
 * subrole: 2026-02 Reign of Talon 시즌1에서 도입된 서브 역할군 패시브.
 *
 * shared에 둔 이유: 웹 middleware가 codename 사전 검증(soft-404 회피)에서 사용.
 */
export interface HeroCatalogEntry {
  codename: string;
  name: string;
  role: HeroRole;
  subrole: Subrole;
  releasedAt: string; // ISO date
}

export const HERO_CATALOG: ReadonlyArray<HeroCatalogEntry> = [
  // Tank
  { codename: 'd-va', name: 'D.Va', role: 'TANK', subrole: 'Initiator', releasedAt: '2016-05-24' },
  { codename: 'domina', name: '도미나', role: 'TANK', subrole: 'Stalwart', releasedAt: '2026-02-11' },
  { codename: 'doomfist', name: '둠피스트', role: 'TANK', subrole: 'Initiator', releasedAt: '2017-07-27' },
  { codename: 'hazard', name: '해저드', role: 'TANK', subrole: 'Initiator', releasedAt: '2024-12-10' },
  { codename: 'junker-queen', name: '정커퀸', role: 'TANK', subrole: 'Stalwart', releasedAt: '2022-10-04' },
  { codename: 'mauga', name: '마우가', role: 'TANK', subrole: 'Bruiser', releasedAt: '2023-12-05' },
  { codename: 'orisa', name: '오리사', role: 'TANK', subrole: 'Bruiser', releasedAt: '2017-03-21' },
  { codename: 'ramattra', name: '라마트라', role: 'TANK', subrole: 'Stalwart', releasedAt: '2022-12-06' },
  { codename: 'reinhardt', name: '라인하르트', role: 'TANK', subrole: 'Stalwart', releasedAt: '2016-05-24' },
  { codename: 'roadhog', name: '로드호그', role: 'TANK', subrole: 'Bruiser', releasedAt: '2016-05-24' },
  { codename: 'sigma', name: '시그마', role: 'TANK', subrole: 'Stalwart', releasedAt: '2019-08-04' },
  { codename: 'winston', name: '윈스턴', role: 'TANK', subrole: 'Initiator', releasedAt: '2016-05-24' },
  { codename: 'wrecking-ball', name: '레킹볼', role: 'TANK', subrole: 'Initiator', releasedAt: '2018-07-23' },
  { codename: 'zarya', name: '자리야', role: 'TANK', subrole: 'Bruiser', releasedAt: '2016-05-24' },

  // Damage
  { codename: 'anran', name: '안란', role: 'DAMAGE', subrole: 'Flanker', releasedAt: '2026-02-11' },
  { codename: 'ashe', name: '애쉬', role: 'DAMAGE', subrole: 'Sharpshooter', releasedAt: '2018-11-13' },
  { codename: 'bastion', name: '바스티온', role: 'DAMAGE', subrole: 'Specialist', releasedAt: '2016-05-24' },
  { codename: 'cassidy', name: '캐서디', role: 'DAMAGE', subrole: 'Sharpshooter', releasedAt: '2016-05-24' },
  { codename: 'echo', name: '에코', role: 'DAMAGE', subrole: 'Recon', releasedAt: '2020-04-14' },
  { codename: 'freja', name: '프레야', role: 'DAMAGE', subrole: 'Recon', releasedAt: '2025-02-25' },
  { codename: 'genji', name: '겐지', role: 'DAMAGE', subrole: 'Flanker', releasedAt: '2016-05-24' },
  { codename: 'hanzo', name: '한조', role: 'DAMAGE', subrole: 'Sharpshooter', releasedAt: '2016-05-24' },
  { codename: 'junkrat', name: '정크랫', role: 'DAMAGE', subrole: 'Specialist', releasedAt: '2016-05-24' },
  { codename: 'mei', name: '메이', role: 'DAMAGE', subrole: 'Specialist', releasedAt: '2016-05-24' },
  { codename: 'pharah', name: '파라', role: 'DAMAGE', subrole: 'Recon', releasedAt: '2016-05-24' },
  { codename: 'reaper', name: '리퍼', role: 'DAMAGE', subrole: 'Flanker', releasedAt: '2016-05-24' },
  { codename: 'sierra', name: '시에라', role: 'DAMAGE', subrole: 'Recon', releasedAt: '2026-04-22' },
  { codename: 'sojourn', name: '소전', role: 'DAMAGE', subrole: 'Sharpshooter', releasedAt: '2022-10-04' },
  { codename: 'emre', name: '엠레', role: 'DAMAGE', subrole: 'Specialist', releasedAt: '2026-02-11' },
  { codename: 'vendetta', name: '벤데타', role: 'DAMAGE', subrole: 'Flanker', releasedAt: '2025-12-10' },
  { codename: 'soldier-76', name: '솔저: 76', role: 'DAMAGE', subrole: 'Specialist', releasedAt: '2016-05-24' },
  { codename: 'sombra', name: '솜브라', role: 'DAMAGE', subrole: 'Recon', releasedAt: '2016-11-14' },
  { codename: 'symmetra', name: '시메트라', role: 'DAMAGE', subrole: 'Specialist', releasedAt: '2016-05-24' },
  { codename: 'torbjorn', name: '토르비욘', role: 'DAMAGE', subrole: 'Specialist', releasedAt: '2016-05-24' },
  { codename: 'tracer', name: '트레이서', role: 'DAMAGE', subrole: 'Flanker', releasedAt: '2016-05-24' },
  { codename: 'venture', name: '벤처', role: 'DAMAGE', subrole: 'Flanker', releasedAt: '2024-04-16' },
  { codename: 'widowmaker', name: '위도우메이커', role: 'DAMAGE', subrole: 'Sharpshooter', releasedAt: '2016-05-24' },

  // Support
  { codename: 'ana', name: '아나', role: 'SUPPORT', subrole: 'Tactician', releasedAt: '2016-07-12' },
  { codename: 'baptiste', name: '바티스트', role: 'SUPPORT', subrole: 'Tactician', releasedAt: '2019-03-19' },
  { codename: 'brigitte', name: '브리기테', role: 'SUPPORT', subrole: 'Survivor', releasedAt: '2018-03-28' },
  { codename: 'illari', name: '일리아리', role: 'SUPPORT', subrole: 'Survivor', releasedAt: '2023-08-10' },
  { codename: 'jetpack-cat', name: '제트팩 캣', role: 'SUPPORT', subrole: 'Tactician', releasedAt: '2026-02-11' },
  { codename: 'juno', name: '주노', role: 'SUPPORT', subrole: 'Survivor', releasedAt: '2024-08-20' },
  { codename: 'kiriko', name: '키리코', role: 'SUPPORT', subrole: 'Medic', releasedAt: '2022-10-04' },
  { codename: 'lifeweaver', name: '라이프위버', role: 'SUPPORT', subrole: 'Medic', releasedAt: '2023-04-11' },
  { codename: 'lucio', name: '루시우', role: 'SUPPORT', subrole: 'Tactician', releasedAt: '2016-05-24' },
  { codename: 'mercy', name: '메르시', role: 'SUPPORT', subrole: 'Medic', releasedAt: '2016-05-24' },
  { codename: 'mizuki', name: '미즈키', role: 'SUPPORT', subrole: 'Survivor', releasedAt: '2026-02-11' },
  { codename: 'moira', name: '모이라', role: 'SUPPORT', subrole: 'Medic', releasedAt: '2017-11-17' },
  { codename: 'wuyang', name: '우양', role: 'SUPPORT', subrole: 'Survivor', releasedAt: '2025-08-27' },
  { codename: 'zenyatta', name: '젠야타', role: 'SUPPORT', subrole: 'Tactician', releasedAt: '2016-05-24' },
];

export const HERO_CATALOG_BY_CODENAME: Record<string, HeroCatalogEntry> = Object.fromEntries(
  HERO_CATALOG.map((entry) => [entry.codename, entry]),
);

/**
 * O(1) codename validity lookup. middleware 등 hot path에서 사용.
 */
export const HERO_CODENAMES: ReadonlySet<string> = new Set(HERO_CATALOG.map((entry) => entry.codename));
