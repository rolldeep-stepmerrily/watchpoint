import { type AbilitySlot, Prisma, type PrismaClient } from '../../src/generated/prisma/client';

/**
 * 풀데이터(stat + abilities)가 들어가는 영웅의 정적 시드.
 *
 * - 멱등: hero_stats는 `update: {}` upsert(이미 있으면 손대지 않음).
 *   hero_abilities는 `(heroId, slot, order)` 복합키로 upsert — 신규는 create,
 *   기존은 name/nameTranslations만 동기화(stats/description은 CLI 수정값 보존).
 * - 수치는 OW2 기준 근사치. 패치마다 변동하므로 `pnpm hero:edit <codename>`으로
 *   보정 가능.
 */
export interface HeroDetailSeed {
  codename: string;
  description: string;
  /**
   * 비-기본 언어 이름 (기본 name 필드는 한국어). 추후 언어 토글 시 사용.
   * 예: { en: 'Doomfist', ja: 'ドゥームフィスト' }
   */
  nameTranslations?: Record<string, string>;
  stat: {
    health: number;
    armor?: number;
    shield?: number;
    moveSpeed: number;
    extras?: Record<string, unknown>;
  };
  abilities: Array<{
    slot: AbilitySlot;
    key: string | null;
    name: string;
    /**
     * 능력 이름의 비-기본 언어 번역. 예: { en: 'Meteor Strike' }
     */
    nameTranslations?: Record<string, string>;
    description: string;
    stats?: Record<string, unknown>;
    order?: number;
  }>;
}

export const HERO_DETAIL_SEEDS: readonly HeroDetailSeed[] = [
  {
    codename: 'sierra',
    description: '오버워치 44번째 영웅. 정밀 사격에 특화된 저격 딜러로, 장거리 교전에서 빛을 발한다.',
    stat: { health: 200, moveSpeed: 5.5, extras: { critMultiplier: 2.5 } },
    abilities: [
      {
        slot: 'PRIMARY',
        key: '좌클릭',
        name: '정밀 라이플',
        description: '장거리 저격용 라이플. 줌 시 헤드샷 배율 증가.',
        stats: { damage: 80, fireRate: 1.0, magazine: 6 },
      },
      {
        slot: 'SECONDARY',
        key: '우클릭',
        name: '정조준',
        description: '확대경을 사용해 명중률을 높인다.',
        stats: { zoomLevel: 4.0 },
      },
      {
        slot: 'ABILITY_1',
        key: 'Shift',
        name: '연막탄',
        description: '시야를 차단하는 연막을 투척한다.',
        stats: { duration: 5, radius: 6 },
      },
      {
        slot: 'ABILITY_2',
        key: 'E',
        name: '회피 기동',
        description: '뒤로 빠르게 회피한다.',
        stats: { distance: 8, cooldown: 8 },
      },
      {
        slot: 'ULTIMATE',
        key: 'Q',
        name: '퍼펙트 샷',
        description: '벽 너머의 적을 관통하는 한 발의 저격탄.',
        stats: { damage: 300, charges: 1 },
      },
      {
        slot: 'PASSIVE',
        key: null,
        name: '집중',
        description: '정조준 상태에서 일정 시간 후 헤드샷 배율이 추가 증가한다.',
        stats: { activationTime: 1.5, bonusMultiplier: 0.5 },
      },
    ],
  },
  {
    codename: 'd-va',
    description:
      '전직 프로게이머 송하나가 조종하는 기동형 메카 탱커. 메카로 적진을 흔들고 파괴되면 조종사 상태로 전투를 이어간다.',
    stat: { health: 350, armor: 350, moveSpeed: 5.5, extras: { pilotHealth: 150 } },
    abilities: [
      {
        slot: 'PRIMARY',
        key: '좌클릭',
        name: '융합 캐논',
        description: '근거리 산탄형 기관포 두 정. 이동하면서 사격 가능.',
        stats: { damage: '0.6×11 / pellet', falloffRange: '15-20m' },
      },
      {
        slot: 'SECONDARY',
        key: '우클릭',
        name: '마이크로 미사일',
        description: '소형 미사일 18발을 폭발 데미지로 일제 발사.',
        stats: { damage: 4, explosionDamage: 4, count: 18, cooldown: 8 },
      },
      {
        slot: 'ABILITY_1',
        key: 'Shift',
        name: '부스터',
        description: '메카로 빠르게 돌진. 충돌 시 적에게 데미지.',
        stats: { duration: 2, cooldown: 5, impactDamage: 25 },
      },
      {
        slot: 'ABILITY_2',
        key: 'E',
        name: '방어 매트릭스',
        description: '전방의 투사체를 흡수해 제거한다.',
        stats: { duration: 2, cooldown: 1, regenRate: '12.5%/s' },
      },
      {
        slot: 'ULTIMATE',
        key: 'Q',
        name: '자폭',
        description: '메카가 폭발해 광역 데미지. 폭발 후 조종사 상태로 전환.',
        stats: { damage: 1000, radius: 20, fuseTime: 3 },
      },
      {
        slot: 'PASSIVE',
        key: null,
        name: '메카 호출',
        description: '조종사 상태에서 처치 기여 시 새 메카를 호출 가능.',
        stats: { meka: 'recall on charge' },
      },
    ],
  },
  {
    codename: 'ana',
    description:
      '오버워치 창립 멤버이자 전설의 저격수. 생체 라이플로 아군을 치유하고 적을 약화시키는 핵심 서포터.',
    stat: { health: 250, moveSpeed: 5.5 },
    abilities: [
      {
        slot: 'PRIMARY',
        key: '좌클릭',
        name: '생체 라이플',
        description: '맞은 아군은 치유, 적은 데미지를 입는다. 줌 시 정조준.',
        stats: { healPerShot: 75, damagePerShot: 75, magazine: 15 },
      },
      {
        slot: 'SECONDARY',
        key: '우클릭',
        name: '정조준',
        description: '스코프로 확대 사격. 헤드샷 가능.',
        stats: { zoomLevel: 2.0 },
      },
      {
        slot: 'ABILITY_1',
        key: 'Shift',
        name: '수면총',
        description: '맞은 적을 5.5초간 잠재운다. 피격 시 깨어남.',
        stats: { sleepDuration: 5.5, cooldown: 14, projectileSpeed: 60 },
      },
      {
        slot: 'ABILITY_2',
        key: 'E',
        name: '생체 수류탄',
        description: '광역 치유 + 데미지. 적에게는 치유 효과 차단(반힐).',
        stats: { heal: 100, damage: 60, antiHealDuration: 4, cooldown: 10 },
      },
      {
        slot: 'ULTIMATE',
        key: 'Q',
        name: '강화제',
        description: '아군의 데미지와 받는 치유를 증폭, 받는 데미지 감소.',
        stats: { duration: 8, damageBoost: 0.5, damageReduction: 0.5, healBoost: 1.0 },
      },
      {
        slot: 'PASSIVE',
        key: null,
        name: '서포트 패시브',
        description: '일정 시간 피격이 없으면 체력이 서서히 회복된다.',
        stats: { delay: 2.5, healRate: '15 HP/s' },
      },
    ],
  },
  {
    codename: 'tracer',
    description: '시간을 가속·역행하는 능력으로 전장을 헤집는 초고기동 딜러. 게릴라식 짧은 교전에 최적화.',
    stat: { health: 175, moveSpeed: 6.0 },
    abilities: [
      {
        slot: 'PRIMARY',
        key: '좌클릭',
        name: '펄스 권총',
        description: '양손 권총 일제 사격. 근거리에서 강력하지만 거리 감쇠가 큼.',
        stats: { damage: '1.5-6 / pellet', pelletsPerShot: 8, magazine: 40, falloff: '10-15m' },
      },
      {
        slot: 'ABILITY_1',
        key: 'Shift',
        name: '점멸',
        description: '진행 방향으로 짧은 거리 순간이동. 충전식 3회.',
        stats: { distance: 7, charges: 3, rechargeTime: 3 },
      },
      {
        slot: 'ABILITY_2',
        key: 'E',
        name: '시간 역행',
        description: '3초 전의 위치/체력/탄약 상태로 되돌린다.',
        stats: { rewindWindow: 3, cooldown: 12 },
      },
      {
        slot: 'ULTIMATE',
        key: 'Q',
        name: '펄스 폭탄',
        description: '폭탄을 부착해 잠시 후 광역 폭발.',
        stats: { stickDamage: 5, explosionDamage: 350, radius: 3, fuseTime: 1 },
      },
      {
        slot: 'PASSIVE',
        key: null,
        name: '딜러 패시브',
        description: '처치/도움 시 짧게 이동속도가 빨라진다.',
        stats: { duration: 2.5, moveSpeedBoost: 0.3 },
      },
    ],
  },
  {
    codename: 'mercy',
    description: '치유 광선과 부활로 팀을 지탱하는 정통파 메인 힐러. 천사 강림으로 자유롭게 전장을 누빈다.',
    stat: { health: 225, moveSpeed: 5.5 },
    abilities: [
      {
        slot: 'PRIMARY',
        key: '좌클릭',
        name: '카두세우스 스태프 (치유)',
        description: '아군에게 지속 치유 광선을 연결.',
        stats: { healPerSecond: 55, range: 15 },
      },
      {
        slot: 'SECONDARY',
        key: '우클릭',
        name: '카두세우스 스태프 (강화)',
        description: '아군의 데미지를 30% 증폭.',
        stats: { damageBoost: 0.3, range: 15 },
      },
      {
        slot: 'ABILITY_1',
        key: 'Shift',
        name: '천사 강림',
        description: '아군에게 빠르게 비행해 접근한다.',
        stats: { speed: '17 m/s', cooldown: 1.5 },
      },
      {
        slot: 'ABILITY_2',
        key: 'E',
        name: '부활',
        description: '쓰러진 아군을 그 자리에서 부활시킨다 (시전 시간 있음).',
        stats: { castTime: 1.75, cooldown: 30, radius: 5 },
      },
      {
        slot: 'ULTIMATE',
        key: 'Q',
        name: '발키리',
        description: '비행 활성화 + 광선이 주변 아군에게 동시 적용.',
        stats: { duration: 15, chainTargets: 'multiple', flightEnabled: true },
      },
      {
        slot: 'PASSIVE',
        key: null,
        name: '천상의 존재',
        description: '피격 후 일정 시간 뒤 자가 체력 재생.',
        stats: { delay: 1.5, healRate: '20 HP/s' },
      },
    ],
  },
  {
    codename: 'reinhardt',
    description: '거대 방벽과 로켓 해머로 최전선을 지키는 정통 탱커. 팀의 진격과 수비를 책임진다.',
    stat: { health: 325, armor: 250, moveSpeed: 5.5 },
    abilities: [
      {
        slot: 'PRIMARY',
        key: '좌클릭',
        name: '로켓 해머',
        description: '거대 해머로 전방을 광역 강타.',
        stats: { damage: 85, swingArc: 5, range: 5 },
      },
      {
        slot: 'SECONDARY',
        key: '우클릭',
        name: '화염 강타',
        description: '관통하는 화염 투사체를 발사.',
        stats: { damage: 100, cooldown: 6, charges: 2 },
      },
      {
        slot: 'ABILITY_1',
        key: 'Shift',
        name: '돌진',
        description: '앞으로 빠르게 돌진해 적을 벽까지 밀어붙인다.',
        stats: { speed: '13.5 m/s', cooldown: 8, pinDamage: 250 },
      },
      {
        slot: 'ABILITY_2',
        key: 'E',
        name: '방벽 방패',
        description: '전방에 거대 에너지 방벽을 전개해 투사체를 막는다.',
        stats: { barrierHealth: 1400, regenRate: '187.5/s', cooldown: 5 },
      },
      {
        slot: 'ULTIMATE',
        key: 'Q',
        name: '대지 분쇄',
        description: '해머로 땅을 내리쳐 전방의 적을 쓰러뜨린다.',
        stats: { damage: 50, knockdownDuration: 2.75, range: 20 },
      },
      {
        slot: 'PASSIVE',
        key: null,
        name: '탱커 패시브',
        description: '받는 밀려남 효과와 치명타 데미지가 감소한다.',
        stats: { knockbackResist: 0.3, critDamageReduction: 0.3 },
      },
    ],
  },
  // === Tank (추가) ===
  {
    codename: 'doomfist',
    description: '강화 건틀릿으로 적진을 강타하는 근접 돌격형 탱커. 콤보로 적을 공중에 띄워 정리한다.',
    stat: { health: 350, armor: 100, moveSpeed: 5.5 },
    abilities: [
      { slot: 'PRIMARY', key: '좌클릭', name: '핸드 캐논', description: '근거리 산탄형 발사체. 재충전 자동.', stats: { damage: '6×11 / pellet', falloffRange: '15-30m' } },
      { slot: 'SECONDARY', key: '우클릭', name: '로켓 펀치', description: '충전 후 강력한 일격. 벽 충돌 시 추가 데미지.', stats: { damage: '15-50', wallDamage: 30, cooldown: 4 } },
      { slot: 'ABILITY_1', key: 'Shift', name: '지진 강타', description: '공중에서 내려찍어 광역 데미지 + 띄움.', stats: { damage: 15, cooldown: 6, range: 8 } },
      { slot: 'ABILITY_2', key: 'E', name: '파워 블록', description: '전방 데미지 감쇄 + 강력한 일격 충전.', stats: { damageReduction: 0.8, maxAbsorb: 100, cooldown: 7 } },
      { slot: 'ULTIMATE', key: 'Q', name: '파멸의 일격', nameTranslations: { en: 'Meteor Strike' }, description: '하늘로 솟구쳐 지정 지점에 강하 데미지.', stats: { impactDamage: 15, maxOuterDamage: 300, radius: 8 } },
      { slot: 'PASSIVE', key: null, name: '최선의 방어', description: '능력 적중 시 일시 임시 체력.', stats: { tempHpPerHit: 35, maxTempHp: 200 } },
    ],
  },
  {
    codename: 'hazard',
    description: '바위 가시와 도약 능력을 가진 근접 탱커. 적의 라인을 무너뜨리는 데 특화. (2024-12 출시)',
    stat: { health: 350, armor: 150, moveSpeed: 5.5 },
    abilities: [
      { slot: 'PRIMARY', key: '좌클릭', name: '바이올런트 스트라이크', description: '근접 산탄형 무기.', stats: { damage: '6×7 / pellet', range: 10 } },
      { slot: 'SECONDARY', key: '우클릭', name: '스파이크 가드', description: '전방 가시 방벽 전개로 투사체 차단.', stats: { duration: 3, cooldown: 6 } },
      { slot: 'ABILITY_1', key: 'Shift', name: '바이올런트 도약', description: '앞으로 점프 후 적에게 데미지.', stats: { damage: 30, cooldown: 7, distance: 20 } },
      { slot: 'ABILITY_2', key: 'E', name: '재기드 월', description: '솟아오르는 가시벽을 생성해 적을 띄움.', stats: { damage: 30, wallDuration: 4, cooldown: 12 } },
      { slot: 'ULTIMATE', key: 'Q', name: '다운포어', description: '광역 가시 폭격으로 영역을 제어.', stats: { damagePerHit: 60, duration: 6, radius: 12 } },
      { slot: 'PASSIVE', key: null, name: '탱커 패시브', description: '받는 밀려남 효과와 치명타 데미지 감소.', stats: { knockbackResist: 0.3, critDamageReduction: 0.3 } },
    ],
  },
  {
    codename: 'junker-queen',
    description: '도끼와 산탄총으로 적의 출혈을 유발하는 공격적 탱커. 출혈로 자가 회복.',
    stat: { health: 425, moveSpeed: 5.5 },
    abilities: [
      { slot: 'PRIMARY', key: '좌클릭', name: '산탄총', description: '중거리 산탄형 무기.', stats: { damage: '8×10 / pellet', magazine: 6 } },
      { slot: 'SECONDARY', key: '우클릭', name: '재기드 블레이드', description: '도끼를 던지고 회수 — 출혈 상태이상.', stats: { throwDamage: 50, woundDamage: 40, cooldown: 6 } },
      { slot: 'ABILITY_1', key: 'Shift', name: '카니지', description: '근접 광역 도끼 휘두름 — 출혈 부여.', stats: { damage: 90, woundDamage: 40, cooldown: 8 } },
      { slot: 'ABILITY_2', key: 'E', name: '명령 외침', description: '팀의 체력 증가 + 이동속도 부스트.', stats: { tempHpSelf: 200, tempHpAlly: 100, duration: 5, cooldown: 15 } },
      { slot: 'ULTIMATE', key: 'Q', name: '광란', description: '적에게 돌진해 출혈 + 자가 치유 증가.', stats: { duration: 12, healIncrease: '+50%', moveSpeedBoost: 0.3 } },
      { slot: 'PASSIVE', key: null, name: '아드레날린 러시', description: '출혈 효과로부터 자가 치유.', stats: { healFromWound: '100%' } },
    ],
  },
  {
    codename: 'mauga',
    description: '이중 미니건과 강렬한 돌진으로 적을 압박하는 거구의 탱커.',
    stat: { health: 500, armor: 50, moveSpeed: 5.5 },
    abilities: [
      { slot: 'PRIMARY', key: '좌클릭', name: '간 톰', description: '발화 미니건. 적을 점화시킴.', stats: { damage: 7.5, ignite: true, magazine: 300 } },
      { slot: 'SECONDARY', key: '우클릭', name: '쿠앙 머', description: '발화 적에게 치명타 가능한 미니건.', stats: { damage: 6, magazine: 300 } },
      { slot: 'ABILITY_1', key: 'Shift', name: '오버런', description: '돌진해 적을 띄우고 CC 면역.', stats: { duration: 2, impactDamage: 60, cooldown: 8 } },
      { slot: 'ABILITY_2', key: 'E', name: '심장 가속', description: '데미지 흡혈 + 받는 데미지 감소.', stats: { duration: 4, lifestealRatio: 0.6, dmgReduction: 0.3, cooldown: 12 } },
      { slot: 'ULTIMATE', key: 'Q', name: '검투장', description: '영역을 만들어 안에 갇힌 적들과 결투.', stats: { duration: 9, radius: 10, healPerKill: 350 } },
      { slot: 'PASSIVE', key: null, name: '광전사', description: '치명타로 임시 체력 획득.', stats: { tempHpPerCrit: 25 } },
    ],
  },
  {
    codename: 'orisa',
    description: '에너지 창과 회전 방어로 적의 진격을 막는 견고한 탱커.',
    stat: { health: 250, armor: 175, moveSpeed: 5.5 },
    abilities: [
      { slot: 'PRIMARY', key: '좌클릭', name: '증강형 융합 드라이버', description: '과열되기 전까지 연사. 과열 시 쿨다운.', stats: { damage: 13, fireRate: 8, heatLimit: '8s' } },
      { slot: 'SECONDARY', key: '우클릭', name: '에너지 창 던지기', description: '적을 관통하는 창. 벽 충돌 시 띄움.', stats: { damage: 60, knockup: true, cooldown: 7 } },
      { slot: 'ABILITY_1', key: 'Shift', name: '강화', description: 'CC 면역 + 받는 데미지 감소.', stats: { duration: 4.5, dmgReduction: 0.4, cooldown: 14 } },
      { slot: 'ABILITY_2', key: 'E', name: '에너지 창 휘두르기', description: '회전해 투사체 막고 적 밀어냄.', stats: { duration: 1.5, blocksProjectiles: true, cooldown: 7 } },
      { slot: 'ULTIMATE', key: 'Q', name: '대지 분쇄', description: '영역 내 적을 끌어당기며 폭발.', stats: { pullDuration: 3, damage: 500, radius: 10 } },
      { slot: 'PASSIVE', key: null, name: '탱커 패시브', description: '받는 밀려남 효과와 치명타 데미지 감소.', stats: { knockbackResist: 0.3, critDamageReduction: 0.3 } },
    ],
  },
  {
    codename: 'ramattra',
    description: '두 형태를 오가는 옴닉 탱커. 옴닉 모드는 원거리 견제, 네메시스 모드는 근접 압박.',
    stat: { health: 350, armor: 100, moveSpeed: 5.5 },
    abilities: [
      { slot: 'PRIMARY', key: '좌클릭', name: '보이드 가속기', description: '연속 발사 에너지 투사체.', stats: { damage: 7.5, fireRate: 14 } },
      { slot: 'SECONDARY', key: '우클릭', name: '보이드 방벽', description: '관통 불가능한 정지 방벽 설치.', stats: { barrierHealth: 1000, duration: 4, cooldown: 13 } },
      { slot: 'ABILITY_1', key: 'Shift', name: '네메시스 변신', description: '근접 모드 변신 — 펀치 + 방어.', stats: { duration: 8, cooldown: 8, formArmor: '+150' } },
      { slot: 'ABILITY_2', key: 'E', name: '굶주린 소용돌이', description: '저속화 + 대지 영역 데미지.', stats: { damage: 30, slow: 0.5, cooldown: 13 } },
      { slot: 'ULTIMATE', key: 'Q', name: '전멸', description: '주변 적을 지속 데미지. 적 적중 시 지속시간 연장.', stats: { damagePerSecond: 50, baseDuration: 10, radius: 10 } },
      { slot: 'PASSIVE', key: null, name: '탱커 패시브', description: '받는 밀려남 효과와 치명타 데미지 감소.', stats: { knockbackResist: 0.3, critDamageReduction: 0.3 } },
    ],
  },
  {
    codename: 'roadhog',
    description: '갈고리로 적을 끌어와 산탄총으로 처치하는 단일 표적 학살자.',
    stat: { health: 700, moveSpeed: 5.5 },
    abilities: [
      { slot: 'PRIMARY', key: '좌클릭', name: '고철총', description: '근거리 산탄총. 5발 장전.', stats: { damage: '6×25 / pellet', magazine: 5 } },
      { slot: 'SECONDARY', key: '우클릭', name: '고철총 (장거리)', description: '집중된 단발 산탄으로 사거리 증가.', stats: { damage: '5×35 / pellet', falloff: '15-25m' } },
      { slot: 'ABILITY_1', key: 'Shift', name: '갈고리', description: '적을 끌어와 콤보 가능.', stats: { range: 20, cooldown: 6 } },
      { slot: 'ABILITY_2', key: 'E', name: '숨 고르기', description: '자가 치유 + 받는 데미지 감소.', stats: { healPerSecond: 500, duration: 2, dmgReduction: 0.5, cooldown: 13 } },
      { slot: 'ULTIMATE', key: 'Q', name: '돼지도살', description: '전방을 휩쓰는 강력한 푸시건.', stats: { damagePerSecond: 360, duration: 6, knockback: '강력' } },
      { slot: 'PASSIVE', key: null, name: '탱커 패시브', description: '받는 밀려남 효과와 치명타 데미지 감소.', stats: { knockbackResist: 0.3, critDamageReduction: 0.3 } },
    ],
  },
  {
    codename: 'sigma',
    description: '중력을 조종하는 천재 과학자 탱커. 부동 방벽과 광역 띄움기로 진형을 흔든다.',
    stat: { health: 350, shield: 150, moveSpeed: 5.5 },
    abilities: [
      { slot: 'PRIMARY', key: '좌클릭', name: '하이퍼스피어', description: '두 개의 충격 구체를 발사. 폭발 데미지.', stats: { impactDamage: 25, explosionDamage: 30 } },
      { slot: 'SECONDARY', key: '우클릭', name: '실험적 방벽', description: '조종 가능한 부유 방벽. 명령으로 회수.', stats: { barrierHealth: 700, cooldown: 1, regenRate: '120/s' } },
      { slot: 'ABILITY_1', key: 'Shift', name: '운동 에너지 포착', description: '전방의 투사체를 흡수해 보호막 생성.', stats: { duration: 2, maxShieldGain: 400, cooldown: 10 } },
      { slot: 'ABILITY_2', key: 'E', name: '암석 강타', description: '바위를 던져 적을 띄움.', stats: { impactDamage: 80, knockup: true, cooldown: 8 } },
      { slot: 'ULTIMATE', key: 'Q', name: '중력 붕괴', description: '광역 적을 띄운 뒤 떨어뜨려 데미지.', stats: { damage: '50%/현재HP', radius: 8 } },
      { slot: 'PASSIVE', key: null, name: '탱커 패시브', description: '받는 밀려남 효과와 치명타 데미지 감소.', stats: { knockbackResist: 0.3, critDamageReduction: 0.3 } },
    ],
  },
  {
    codename: 'winston',
    description: '점프팩과 테슬라 캐논으로 후방을 노리는 다이브 탱커.',
    stat: { health: 350, armor: 100, moveSpeed: 5.5 },
    abilities: [
      { slot: 'PRIMARY', key: '좌클릭', name: '테슬라 캐논', description: '근거리 자동 유도 전기 무기.', stats: { damage: 60, range: 8, fireDuration: 'continuous' } },
      { slot: 'SECONDARY', key: '우클릭', name: '테슬라 캐논 (집중)', description: '단발 장거리 전기탄.', stats: { damage: 50, range: 30 } },
      { slot: 'ABILITY_1', key: 'Shift', name: '점프팩', description: '먼 거리 도약. 충돌 시 적 띄움.', stats: { impactDamage: 10, knockup: true, cooldown: 6 } },
      { slot: 'ABILITY_2', key: 'E', name: '방벽 방사기', description: '돔 형태의 방벽 설치.', stats: { barrierHealth: 700, duration: 8, cooldown: 12 } },
      { slot: 'ULTIMATE', key: 'Q', name: '원시 분노', description: '체력 증가 + 점프팩 쿨감 + 근접 강타.', stats: { duration: 10, maxHp: 1100, meleeDamage: 40 } },
      { slot: 'PASSIVE', key: null, name: '탱커 패시브', description: '받는 밀려남 효과와 치명타 데미지 감소.', stats: { knockbackResist: 0.3, critDamageReduction: 0.3 } },
    ],
  },
  {
    codename: 'wrecking-ball',
    description: '구르는 메카로 적진을 흔드는 햄스터 탱커. 그래플과 마인필드로 변수 창출.',
    stat: { health: 500, armor: 100, moveSpeed: 5.5 },
    abilities: [
      { slot: 'PRIMARY', key: '좌클릭', name: '쿼드 캐논', description: '4정 자동 무기.', stats: { damage: '5 / shot', fireRate: 25, magazine: 80 } },
      { slot: 'SECONDARY', key: '우클릭', name: '파일드라이버', description: '공중에서 강하해 광역 데미지.', stats: { damage: 100, knockup: true, cooldown: 8 } },
      { slot: 'ABILITY_1', key: 'Shift', name: '그래플 클로', description: '벽이나 천장에 갈고리 걸어 가속 회전.', stats: { rollSpeed: '20 m/s', impactDamage: '50-100', cooldown: 5 } },
      { slot: 'ABILITY_2', key: 'E', name: '적응형 보호막', description: '주변 적 수에 따라 임시 체력.', stats: { baseShield: 100, perEnemy: 100, duration: 7, cooldown: 15 } },
      { slot: 'ULTIMATE', key: 'Q', name: '지뢰밭', description: '광역 지뢰를 살포.', stats: { mineCount: 14, damagePerMine: 130 } },
      { slot: 'PASSIVE', key: null, name: '구르기', description: '구르기 모드 — 충돌 시 적 밀어내고 데미지.', stats: { rollMoveSpeedBoost: '+50%' } },
    ],
  },
  {
    codename: 'zarya',
    description: '입자 캐논과 보호막으로 화력을 폭발시키는 차지형 탱커.',
    stat: { health: 250, shield: 200, moveSpeed: 5.5 },
    abilities: [
      { slot: 'PRIMARY', key: '좌클릭', name: '입자 캐논', description: '에너지 빔. 차지에 따라 데미지 증가.', stats: { minDamage: 75, maxDamage: 170, fireRate: 'continuous' } },
      { slot: 'SECONDARY', key: '우클릭', name: '입자 캐논 (대체)', description: '폭발하는 입자 폭탄.', stats: { directDamage: 47, splashDamage: 47, magazine: 25 } },
      { slot: 'ABILITY_1', key: 'Shift', name: '입자 방벽', description: '자신 보호막. 받는 데미지로 충전.', stats: { shieldHp: 200, duration: 2.5, cooldown: 10, charges: 2 } },
      { slot: 'ABILITY_2', key: 'E', name: '투사 방벽', description: '아군에게 보호막 부여.', stats: { shieldHp: 200, duration: 2, cooldown: 8, charges: 2 } },
      { slot: 'ULTIMATE', key: 'Q', name: '중력자탄', description: '영역 내 적을 끌어모음.', stats: { duration: 3.5, radius: 6, slow: 0.6 } },
      { slot: 'PASSIVE', key: null, name: '에너지', description: '방벽이 막은 데미지가 캐논 차지로 변환.', stats: { maxCharge: 100, decay: '1.6/s' } },
    ],
  },
  // === Damage (추가) ===
  {
    codename: 'ashe',
    description: '레버액션 라이플과 다이너마이트로 거리를 가리지 않는 정밀 사수. B.O.B.이 든든한 동료.',
    stat: { health: 200, moveSpeed: 5.5 },
    abilities: [
      { slot: 'PRIMARY', key: '좌클릭', name: '바이퍼', description: '레버액션 라이플. 정조준 시 정확도 ↑.', stats: { hipDamage: 40, scopedDamage: 80, magazine: 12 } },
      { slot: 'SECONDARY', key: '우클릭', name: '정조준', description: '확대 사격 모드.', stats: { zoomLevel: 2.5 } },
      { slot: 'ABILITY_1', key: 'Shift', name: '코치 건', description: '산탄총으로 적을 밀치고 자신을 띄움.', stats: { damage: '10×10 / pellet', cooldown: 9 } },
      { slot: 'ABILITY_2', key: 'E', name: '다이너마이트', description: '시간차 폭발 + 점화 데미지.', stats: { explosionDamage: 50, burnDamage: 100, cooldown: 12 } },
      { slot: 'ULTIMATE', key: 'Q', name: 'B.O.B.', description: '오토 봇이 돌진 후 잠시 사격 지원.', stats: { bobHp: 1200, bobDamage: 14, duration: 10 } },
      { slot: 'PASSIVE', key: null, name: '딜러 패시브', description: '처치/도움 시 짧게 이동속도 증가.', stats: { duration: 2.5, moveSpeedBoost: 0.3 } },
    ],
  },
  {
    codename: 'bastion',
    description: '정찰/공성 형태를 전환하는 변신형 로봇. 박격포 모드로 광역 폭격.',
    stat: { health: 300, armor: 100, moveSpeed: 5.5 },
    abilities: [
      { slot: 'PRIMARY', key: '좌클릭', name: '정찰 모드 사격', description: '이동 가능한 자동 라이플.', stats: { damage: '5-25', fireRate: 'auto' } },
      { slot: 'SECONDARY', key: '우클릭', name: '전술 수류탄', description: '튕기는 폭발 수류탄.', stats: { damage: 100, cooldown: 6 } },
      { slot: 'ABILITY_1', key: 'Shift', name: '돌격 모드', description: '캐터필러 폼으로 변신해 강력한 자동 화력.', stats: { duration: 6, dps: 175, cooldown: 12 } },
      { slot: 'ABILITY_2', key: 'E', name: '구르기', description: '대시로 짧게 회피.', stats: { distance: 7, cooldown: 5 } },
      { slot: 'ULTIMATE', key: 'Q', name: '폭격', description: '박격포 3발을 원하는 위치에 폭격.', stats: { damagePerShell: 205, shellCount: 3 } },
      { slot: 'PASSIVE', key: null, name: '딜러 패시브', description: '처치/도움 시 짧게 이동속도 증가.', stats: { duration: 2.5, moveSpeedBoost: 0.3 } },
    ],
  },
  {
    codename: 'cassidy',
    description: '리볼버 한 발 한 발이 무거운 정통파 건맨. 자기 수류탄과 콤보로 탱커를 잡는다.',
    stat: { health: 250, moveSpeed: 5.5 },
    abilities: [
      { slot: 'PRIMARY', key: '좌클릭', name: '피스키퍼', description: '6연발 리볼버.', stats: { damage: 70, magazine: 6 } },
      { slot: 'SECONDARY', key: '우클릭', name: '난사', description: '남은 탄환을 부채꼴로 일제 발사.', stats: { damagePerShot: 45, range: 'close' } },
      { slot: 'ABILITY_1', key: 'Shift', name: '구르기', description: '옆으로 굴러 재장전.', stats: { distance: 7, cooldown: 7 } },
      { slot: 'ABILITY_2', key: 'E', name: '자기 수류탄', description: '적에게 부착되어 폭발.', stats: { impact: 35, explosionDamage: 85, cooldown: 13 } },
      { slot: 'ULTIMATE', key: 'Q', name: '데드아이', description: '시야 내 적을 자동 조준 후 일제 사격.', stats: { lockOnTime: '2-6s', damagePerLock: 'HP기반' } },
      { slot: 'PASSIVE', key: null, name: '딜러 패시브', description: '처치/도움 시 짧게 이동속도 증가.', stats: { duration: 2.5, moveSpeedBoost: 0.3 } },
    ],
  },
  {
    codename: 'echo',
    description: '비행과 복제를 가진 다재다능 합성 인간 딜러.',
    stat: { health: 200, moveSpeed: 5.5 },
    abilities: [
      { slot: 'PRIMARY', key: '좌클릭', name: '트라이샷', description: '삼각형 패턴의 에너지 발사체.', stats: { damagePerShot: 17, magazine: 12 } },
      { slot: 'SECONDARY', key: '우클릭', name: '점착 폭탄', description: '6발 점착 후 폭발.', stats: { damagePerBomb: 30, count: 6, cooldown: 6 } },
      { slot: 'ABILITY_1', key: 'Shift', name: '집중 광선', description: '저체력 적에게 막대한 데미지.', stats: { dps: 50, executeDps: 200, duration: 2.4, cooldown: 10 } },
      { slot: 'ABILITY_2', key: 'E', name: '비행', description: '짧은 시간 비행.', stats: { duration: 3, cooldown: 6 } },
      { slot: 'ULTIMATE', key: 'Q', name: '복제', description: '적 영웅으로 변신해 그 영웅의 능력 사용.', stats: { duration: 15, ultChargeRate: '4x' } },
      { slot: 'PASSIVE', key: null, name: '활공', description: '낙하 속도 감소.', stats: { holdSpaceToGlide: true } },
    ],
  },
  {
    codename: 'freja',
    description: '폭발 석궁과 볼라로 적을 견제하는 사냥꾼형 딜러. (2025-02 출시)',
    stat: { health: 200, moveSpeed: 5.5 },
    abilities: [
      { slot: 'PRIMARY', key: '좌클릭', name: '석궁', description: '예광탄 화살. 우클릭으로 폭발탄 전환.', stats: { damage: 70, magazine: 6 } },
      { slot: 'SECONDARY', key: '우클릭', name: '폭발 화살', description: '충전 후 폭발 화살 발사.', stats: { impactDamage: 65, explosionDamage: 45 } },
      { slot: 'ABILITY_1', key: 'Shift', name: '업드래프트', description: '상승 점프.', stats: { jumpHeight: 'high', cooldown: 8 } },
      { slot: 'ABILITY_2', key: 'E', name: '볼라 샷', description: '적을 결박해 행동 봉인.', stats: { damage: 50, snareDuration: 1, cooldown: 12 } },
      { slot: 'ULTIMATE', key: 'Q', name: '클러스터 애로우', description: '여러 갈래로 폭발하는 화살.', stats: { totalDamage: '~300', explosions: 'multi' } },
      { slot: 'PASSIVE', key: null, name: '딜러 패시브', description: '처치/도움 시 짧게 이동속도 증가.', stats: { duration: 2.5, moveSpeedBoost: 0.3 } },
    ],
  },
  {
    codename: 'genji',
    description: '대시와 반사로 적진을 휘젓는 사이버 닌자. 용검 활성화 시 근접 살인기계.',
    stat: { health: 200, moveSpeed: 6.0 },
    abilities: [
      { slot: 'PRIMARY', key: '좌클릭', name: '수리검', description: '3연발 직선 표창.', stats: { damagePerShuriken: 30, count: 3 } },
      { slot: 'SECONDARY', key: '우클릭', name: '수리검 (산탄)', description: '3발을 부채꼴로 던짐.', stats: { damagePerShuriken: 30, spread: 'fan' } },
      { slot: 'ABILITY_1', key: 'Shift', name: '신속 베기', description: '전방 대시. 처치 시 쿨다운 초기화.', stats: { damage: 50, distance: 15, cooldown: 8 } },
      { slot: 'ABILITY_2', key: 'E', name: '튕겨내기', description: '전방의 투사체를 반사.', stats: { duration: 2, cooldown: 8 } },
      { slot: 'ULTIMATE', key: 'Q', name: '용검', description: '카타나 활성화. 근접 일격에 강력한 데미지.', stats: { duration: 8, swingDamage: 110, moveSpeed: 8 } },
      { slot: 'PASSIVE', key: null, name: '사이버 어질리티', description: '이단 점프 + 벽타기.', stats: { wallClimb: true, doubleJump: true } },
    ],
  },
  {
    codename: 'hanzo',
    description: '활로 멀리서 한 발의 정밀 사격을 노리는 일본인 궁수.',
    stat: { health: 250, moveSpeed: 5.5 },
    abilities: [
      { slot: 'PRIMARY', key: '좌클릭', name: '폭풍 활', description: '충전된 화살을 발사. 헤드샷 가능.', stats: { maxDamage: 125, headshotMultiplier: 2 } },
      { slot: 'ABILITY_1', key: 'Shift', name: '음파 화살', description: '맞은 영역의 적 위치 감지.', stats: { detectionDuration: 6, radius: 7, cooldown: 12 } },
      { slot: 'ABILITY_2', key: 'E', name: '질풍 화살', description: '6발을 빠르게 연사.', stats: { damagePerArrow: 70, count: 6, cooldown: 10 } },
      { slot: 'ABILITY_1', key: 'Space', name: '도약', description: '공중에서 한 번 더 점프.', stats: { cooldown: 4, distance: 'mid' }, order: 1 },
      { slot: 'ULTIMATE', key: 'Q', name: '용신검', description: '거대한 용을 발사해 광역 데미지.', stats: { damagePerSecond: 200, range: 'long' } },
      { slot: 'PASSIVE', key: null, name: '딜러 패시브', description: '처치/도움 시 짧게 이동속도 증가.', stats: { duration: 2.5, moveSpeedBoost: 0.3 } },
    ],
  },
  {
    codename: 'junkrat',
    description: '폭발물을 살포하며 광역 압박을 거는 폭탄광 딜러.',
    stat: { health: 200, moveSpeed: 5.5 },
    abilities: [
      { slot: 'PRIMARY', key: '좌클릭', name: '폭탄 발사기', description: '튕기는 폭탄.', stats: { damage: '40-120', magazine: 5 } },
      { slot: 'ABILITY_1', key: 'Shift', name: '충격 지뢰', description: '점프 가능 폭발물 (2발).', stats: { damage: 130, charges: 2, cooldown: 10 } },
      { slot: 'ABILITY_2', key: 'E', name: '거대 함정', description: '맞은 적을 묶는 함정.', stats: { damage: 80, snareDuration: 3, cooldown: 10 } },
      { slot: 'ULTIMATE', key: 'Q', name: '왕바퀴 폭탄', description: '조종 가능한 자폭 타이어.', stats: { explosionDamage: 600, radius: 7 } },
      { slot: 'PASSIVE', key: null, name: '대혼란', description: '사망 시 폭탄 살포.', stats: { bombCount: 6, totalDamage: 250 } },
    ],
  },
  {
    codename: 'mei',
    description: '얼음으로 적을 둔화시키고 벽을 만들어 진형을 갈라놓는 통제형 딜러.',
    stat: { health: 250, moveSpeed: 5.5 },
    abilities: [
      { slot: 'PRIMARY', key: '좌클릭', name: '냉각총', description: '단거리 빔. 적을 둔화.', stats: { damage: 55, slowMax: 0.5, range: 10 } },
      { slot: 'SECONDARY', key: '우클릭', name: '냉각총 (고드름)', description: '장거리 고드름 발사.', stats: { damage: 75, headshotMultiplier: 2 } },
      { slot: 'ABILITY_1', key: 'Shift', name: '눈송이', description: '자신을 얼음에 가두어 무적+자가 회복.', stats: { duration: 4, healPerSecond: 75, cooldown: 12 } },
      { slot: 'ABILITY_2', key: 'E', name: '얼음벽', description: '5개 얼음 기둥의 벽 생성.', stats: { wallHp: 250, duration: 5, cooldown: 15 } },
      { slot: 'ULTIMATE', key: 'Q', name: '눈보라', description: '광역 동결.', stats: { freezeDuration: 4, radius: 10, damagePerSecond: 30 } },
      { slot: 'PASSIVE', key: null, name: '딜러 패시브', description: '처치/도움 시 짧게 이동속도 증가.', stats: { duration: 2.5, moveSpeedBoost: 0.3 } },
    ],
  },
  {
    codename: 'pharah',
    description: '로켓 점프로 상공을 점령하고 폭격으로 진형을 흩는 공중 딜러.',
    stat: { health: 250, moveSpeed: 5.5 },
    abilities: [
      { slot: 'PRIMARY', key: '좌클릭', name: '로켓 발사기', description: '직선 폭발 로켓.', stats: { directDamage: 80, splashDamage: 40, magazine: 6 } },
      { slot: 'ABILITY_1', key: 'Shift', name: '제트 부스터', description: '상승 부스트.', stats: { burstDuration: 0.6, cooldown: 10 } },
      { slot: 'ABILITY_2', key: 'E', name: '폭풍 로켓', description: '6발 미니 로켓 일제 발사.', stats: { damagePerRocket: 17, count: 6, cooldown: 8 } },
      { slot: 'ULTIMATE', key: 'Q', name: '폭격', description: '연속 로켓을 쏟아부음.', stats: { damagePerRocket: 40, fireRate: 'high', duration: 3 } },
      { slot: 'PASSIVE', key: null, name: '비행', description: '연료를 사용한 호버링 + 공중 이동.', stats: { fuel: 100, fuelRegen: '20/s' } },
    ],
  },
  {
    codename: 'reaper',
    description: '듀얼 산탄총과 영혼 흡수로 근접 폭딜을 내는 사신.',
    stat: { health: 250, moveSpeed: 5.5 },
    abilities: [
      { slot: 'PRIMARY', key: '좌클릭', name: '헬파이어 산탄총', description: '두 정 산탄총 동시 발사.', stats: { damage: '6×11 / pellet', magazine: 8 } },
      { slot: 'ABILITY_1', key: 'Shift', name: '망령화', description: '잠시 무적 상태 + 이동 속도 증가.', stats: { duration: 3, moveSpeed: 7.5, cooldown: 8 } },
      { slot: 'ABILITY_2', key: 'E', name: '그림자 밟기', description: '지정 위치로 텔레포트.', stats: { castTime: 1.2, range: 35, cooldown: 8 } },
      { slot: 'ULTIMATE', key: 'Q', name: '죽음의 꽃', description: '주변 적에게 광역 데미지.', stats: { dps: 170, duration: 3, radius: 8 } },
      { slot: 'PASSIVE', key: null, name: '수확', description: '입힌 데미지의 일부를 자가 치유.', stats: { lifesteal: '40%' } },
    ],
  },
  {
    codename: 'sojourn',
    description: '에너지를 모아 한 발의 레일건으로 적을 처치하는 캐나다 출신 딜러.',
    stat: { health: 200, moveSpeed: 5.5 },
    abilities: [
      { slot: 'PRIMARY', key: '좌클릭', name: '레일건', description: '연사 발사. 적중 시 에너지 충전.', stats: { damagePerShot: 9, fireRate: 'auto', energyPerHit: 1 } },
      { slot: 'SECONDARY', key: '우클릭', name: '레일건 (충전 사격)', description: '충전 에너지로 한 발의 강력한 일격.', stats: { minDamage: 30, maxDamage: 130, energyCost: 100 } },
      { slot: 'ABILITY_1', key: 'Shift', name: '파워 슬라이드', description: '슬라이드. 점프 가능.', stats: { duration: 1.2, cooldown: 6 } },
      { slot: 'ABILITY_2', key: 'E', name: '교란 사격', description: '에너지 영역으로 적 둔화.', stats: { damagePerSecond: 50, duration: 4, cooldown: 14 } },
      { slot: 'ULTIMATE', key: 'Q', name: '오버클럭', description: '레일건 자동 충전 + 관통.', stats: { duration: 8, autoCharge: true } },
      { slot: 'PASSIVE', key: null, name: '딜러 패시브', description: '처치/도움 시 짧게 이동속도 증가.', stats: { duration: 2.5, moveSpeedBoost: 0.3 } },
    ],
  },
  {
    codename: 'soldier-76',
    description: '돌격소총과 자가 치유 필드를 갖춘 정통파 만능 딜러.',
    stat: { health: 250, moveSpeed: 5.5 },
    abilities: [
      { slot: 'PRIMARY', key: '좌클릭', name: '펄스 소총', description: '돌격 소총. 연사 시 정확도 감소.', stats: { damage: 19, magazine: 30 } },
      { slot: 'SECONDARY', key: '우클릭', name: '나선 로켓', description: '3발 폭발 로켓.', stats: { damagePerRocket: 100, cooldown: 6 } },
      { slot: 'ABILITY_1', key: 'Shift', name: '질주', description: '이동 속도 증가.', stats: { speed: 9, cooldown: 0 } },
      { slot: 'ABILITY_2', key: 'E', name: '생체 영역', description: '영역 내 아군 자가 치유.', stats: { healPerSecond: 40, duration: 5, cooldown: 15 } },
      { slot: 'ULTIMATE', key: 'Q', name: '전술 조준경', description: '시야 내 적 자동 조준.', stats: { duration: 6, autoAim: true } },
      { slot: 'PASSIVE', key: null, name: '딜러 패시브', description: '처치/도움 시 짧게 이동속도 증가.', stats: { duration: 2.5, moveSpeedBoost: 0.3 } },
    ],
  },
  {
    codename: 'sombra',
    description: '해킹과 은신으로 적의 능력을 봉인하는 사이버 침투자.',
    stat: { health: 250, moveSpeed: 5.5 },
    abilities: [
      { slot: 'PRIMARY', key: '좌클릭', name: '기관단총', description: '자동 사격 무기.', stats: { damage: 8, fireRate: 'auto', magazine: 60 } },
      { slot: 'SECONDARY', key: '우클릭', name: '바이러스', description: '적에게 DOT 부여.', stats: { initialDamage: 15, dotTotal: 100, cooldown: 6 } },
      { slot: 'ABILITY_1', key: 'Shift', name: '위치 변환기', description: '소환 후 그 위치로 텔레포트.', stats: { cooldown: 7, castTime: 1 } },
      { slot: 'ABILITY_2', key: 'E', name: '해킹', description: '적 영웅의 능력 봉인.', stats: { silenceDuration: 1.75, castTime: 1, cooldown: 4 } },
      { slot: 'ULTIMATE', key: 'Q', name: 'EMP', description: '광역 적의 보호막 제거 + 해킹.', stats: { shieldDestroy: '40%', hackDuration: 2, radius: 15 } },
      { slot: 'PASSIVE', key: null, name: '은신', description: '잠시 후 자동 은신 + 이속 증가.', stats: { activationDelay: 5, moveSpeedStealth: '+50%' } },
    ],
  },
  {
    codename: 'symmetra',
    description: '광자 빔과 자동 포탑으로 영역을 통제하는 인도 출신 빌더.',
    stat: { health: 100, shield: 100, moveSpeed: 5.5 },
    abilities: [
      { slot: 'PRIMARY', key: '좌클릭', name: '광자 프로젝터', description: '빔. 적중 지속 시 데미지 증가.', stats: { minDps: 60, maxDps: 180, range: 12 } },
      { slot: 'SECONDARY', key: '우클릭', name: '광자 프로젝터 (구체)', description: '관통하는 에너지 구체.', stats: { minDamage: 60, maxDamage: 120 } },
      { slot: 'ABILITY_1', key: 'Shift', name: '센트리 터렛', description: '벽/천장에 부착되는 자동 터렛 (3대).', stats: { damage: 50, slow: 0.2, charges: 3 } },
      { slot: 'ABILITY_2', key: 'E', name: '텔레포터', description: '두 지점 간 텔레포트 게이트 설치.', stats: { range: 25, duration: 10, cooldown: 16 } },
      { slot: 'ULTIMATE', key: 'Q', name: '광자 방벽', description: '대형 광자 방벽 설치.', stats: { barrierHp: 5000, range: 'global' } },
      { slot: 'PASSIVE', key: null, name: '딜러 패시브', description: '처치/도움 시 짧게 이동속도 증가.', stats: { duration: 2.5, moveSpeedBoost: 0.3 } },
    ],
  },
  {
    codename: 'torbjorn',
    description: '터렛과 화염 액으로 거점을 만드는 스웨덴 출신 엔지니어.',
    stat: { health: 250, armor: 50, moveSpeed: 5.5 },
    abilities: [
      { slot: 'PRIMARY', key: '좌클릭', name: '리벳건', description: '단발 리벳 발사.', stats: { damage: 70, magazine: 18 } },
      { slot: 'SECONDARY', key: '우클릭', name: '리벳건 (산탄)', description: '근거리 산탄 모드.', stats: { damage: '7×8 / pellet', range: 'close' } },
      { slot: 'ABILITY_1', key: 'Shift', name: '터렛 배치', description: '자동 사격 터렛 설치.', stats: { turretHp: 250, damage: 14, range: 40, cooldown: 8 } },
      { slot: 'ABILITY_2', key: 'E', name: '과부하', description: '자가 임시 체력 + 이속 + 발사속도.', stats: { tempHp: 100, duration: 5, cooldown: 12 } },
      { slot: 'ULTIMATE', key: 'Q', name: '용암 분사기', description: '광역 화염 액 살포 — 영역 데미지.', stats: { initialDamage: 50, dotPerSecond: 50, duration: 8 } },
      { slot: 'PASSIVE', key: null, name: '딜러 패시브', description: '처치/도움 시 짧게 이동속도 증가.', stats: { duration: 2.5, moveSpeedBoost: 0.3 } },
    ],
  },
  {
    codename: 'vendetta',
    description: '신비로운 신영웅 딜러. (2025-12 출시) — 능력 수치는 추정치이며 추후 보정 필요.',
    stat: { health: 225, moveSpeed: 5.5 },
    abilities: [
      { slot: 'PASSIVE', key: null, name: '딜러 패시브', description: '처치/도움 시 짧게 이동속도 증가.', stats: { duration: 2.5, moveSpeedBoost: 0.3 } },
    ],
  },
  {
    codename: 'venture',
    description: '드릴로 땅을 파고 솟구쳐 적을 띄우는 고고학자 딜러.',
    stat: { health: 250, moveSpeed: 5.5 },
    abilities: [
      { slot: 'PRIMARY', key: '좌클릭', name: '스마트 굴착기', description: '폭발하는 충돌 발사체.', stats: { directDamage: 30, splashDamage: 25, magazine: 6 } },
      { slot: 'ABILITY_1', key: 'Shift', name: '드릴 대시', description: '전방 돌진 + 통과 적 띄움.', stats: { damage: 40, distance: 12, cooldown: 8 } },
      { slot: 'ABILITY_2', key: 'E', name: '땅속 잠수', description: '땅속으로 잠수해 이동 후 솟구침.', stats: { burrowDuration: 'unlimited', emergeDamage: 60, cooldown: 12 } },
      { slot: 'ULTIMATE', key: 'Q', name: '거대 굴착', description: '거대한 드릴 + 광역 강타.', stats: { damagePerHit: 75, duration: 4, radius: 6 } },
      { slot: 'PASSIVE', key: null, name: '클로버', description: '능력 사용 후 일시 임시 체력.', stats: { tempHpPerAbility: 75 } },
    ],
  },
  {
    codename: 'widowmaker',
    description: '저격 라이플 한 발로 후방을 정리하는 정통파 저격수.',
    stat: { health: 175, moveSpeed: 5.5 },
    abilities: [
      { slot: 'PRIMARY', key: '좌클릭', name: '위도우 키스', description: '돌격소총 모드 — 연사.', stats: { hipDamage: 13, fireRate: 'auto', magazine: 30 } },
      { slot: 'SECONDARY', key: '우클릭', name: '위도우 키스 (저격)', description: '저격 모드 — 충전 후 단발.', stats: { maxDamage: 120, headshotMultiplier: 2.5, chargeTime: 0.7 } },
      { slot: 'ABILITY_1', key: 'Shift', name: '갈고리', description: '벽이나 천장으로 위치 변경.', stats: { range: 30, cooldown: 6 } },
      { slot: 'ABILITY_2', key: 'E', name: '독성 지뢰', description: '근접 적에게 DOT 부여.', stats: { dotPerSecond: 15, duration: 4, cooldown: 15 } },
      { slot: 'ULTIMATE', key: 'Q', name: '적외선 시야', description: '팀이 모든 적의 위치 시야.', stats: { duration: 15, teamWide: true } },
      { slot: 'PASSIVE', key: null, name: '딜러 패시브', description: '처치/도움 시 짧게 이동속도 증가.', stats: { duration: 2.5, moveSpeedBoost: 0.3 } },
    ],
  },
  // === Support (추가) ===
  {
    codename: 'baptiste',
    description: '치유 수류탄과 부활 방지 영역을 가진 전직 의무병 서포터.',
    stat: { health: 250, moveSpeed: 5.5 },
    abilities: [
      { slot: 'PRIMARY', key: '좌클릭', name: '생체 발사기 (사격)', description: '3연발 단속 사격.', stats: { damagePerShot: 25, burstCount: 3, magazine: 12 } },
      { slot: 'SECONDARY', key: '우클릭', name: '생체 발사기 (치유)', description: '치유 수류탄 — 광역 회복.', stats: { healPerGrenade: 50, splashHeal: 50, cooldown: 'magazine' } },
      { slot: 'ABILITY_1', key: 'Shift', name: '재생 강화', description: '주변 아군 광역 자가 회복.', stats: { healPerSecond: 25, duration: 5, cooldown: 13 } },
      { slot: 'ABILITY_2', key: 'E', name: '불사 장치', description: '영역 내 아군 사망 직전 무적 처리.', stats: { duration: 5, hp: 50, cooldown: 25 } },
      { slot: 'ULTIMATE', key: 'Q', name: '증폭 매트릭스', description: '관통하는 영역 — 통과한 아군 데미지/회복 ×2.', stats: { duration: 10, multiplier: 2.0 } },
      { slot: 'PASSIVE', key: null, name: '엑소 부츠', description: '점프 차지 — 더 높이 점프.', stats: { holdToCharge: true, maxJumpHeight: 'high' } },
    ],
  },
  {
    codename: 'brigitte',
    description: '근접 메이스와 방패로 라인을 지원하는 전사형 서포터.',
    stat: { health: 200, armor: 50, moveSpeed: 5.5 },
    abilities: [
      { slot: 'PRIMARY', key: '좌클릭', name: '로켓 도리깨', description: '근접 광역 강타.', stats: { damage: 35, swingRange: 6 } },
      { slot: 'SECONDARY', key: '우클릭', name: '방패', description: '전방 방벽.', stats: { barrierHp: 250, regenRate: '125/s' } },
      { slot: 'ABILITY_1', key: 'Shift', name: '방패 강타', description: '돌진해 적을 띄움.', stats: { damage: 5, knockup: true, cooldown: 5 } },
      { slot: 'ABILITY_2', key: 'E', name: '수리 팩', description: '아군에게 즉시 치유.', stats: { instantHeal: 70, overheal: 50, charges: 3, recharge: 6 } },
      { slot: 'ABILITY_1', key: '아무 키', name: '채찍 강타', description: '원거리 적을 밀쳐냄.', stats: { damage: 70, range: 20, cooldown: 4 }, order: 1 },
      { slot: 'ULTIMATE', key: 'Q', name: '집결 나팔', description: '주변 아군에 임시 체력 부여 + 자가 가속.', stats: { tempHpRate: '15/s', maxTempHp: 100, duration: 10 } },
      { slot: 'PASSIVE', key: null, name: '의욕', description: '근접 적중 시 주변 아군 자가 회복.', stats: { healPerSecond: 16, duration: 5 } },
    ],
  },
  {
    codename: 'illari',
    description: '태양광 라이플과 치유 파일론을 다루는 페루 서포터.',
    stat: { health: 250, moveSpeed: 5.5 },
    abilities: [
      { slot: 'PRIMARY', key: '좌클릭', name: '솔라 라이플', description: '충전식 정밀 사격. 헤드샷 가능.', stats: { minDamage: 40, maxDamage: 70, chargeTime: 1 } },
      { slot: 'SECONDARY', key: '우클릭', name: '치유 광선', description: '광선으로 아군 치유.', stats: { healPerSecond: 90, range: 'mid' } },
      { slot: 'ABILITY_1', key: 'Shift', name: '아웃버스트', description: '점프 + 적 띄움.', stats: { damage: 30, knockback: true, cooldown: 9 } },
      { slot: 'ABILITY_2', key: 'E', name: '치유 파일론', description: '자동 치유 터렛 설치.', stats: { healPerSecond: 70, turretHp: 70, cooldown: 14 } },
      { slot: 'ULTIMATE', key: 'Q', name: '갇힌 태양', description: '적에게 부착되는 태양 폭탄.', stats: { initialDamage: 75, finalDamage: 150, fuseTime: 4 } },
      { slot: 'PASSIVE', key: null, name: '서포트 패시브', description: '피격 후 일정 시간 뒤 자가 체력 재생.', stats: { delay: 2.5, healRate: '15 HP/s' } },
    ],
  },
  {
    codename: 'juno',
    description: '로켓 부츠로 공중 기동을 가진 화성 출신 서포터.',
    stat: { health: 250, moveSpeed: 5.5 },
    abilities: [
      { slot: 'PRIMARY', key: '좌클릭', name: '메디블래스터', description: '아군 자동 치유 + 적 데미지 발사체.', stats: { healPerProjectile: 16, damagePerProjectile: 9, magazine: 'auto' } },
      { slot: 'SECONDARY', key: '우클릭', name: '펄사 어뢰', description: '자동 추적 어뢰. 적 데미지 + 아군 치유.', stats: { damage: 50, heal: 50, lockOn: true, cooldown: 13 } },
      { slot: 'ABILITY_1', key: 'Shift', name: '글라이드 부스트', description: '제트로 빠른 비행.', stats: { duration: 1.6, speed: '15 m/s', cooldown: 8 } },
      { slot: 'ABILITY_2', key: 'E', name: '하이퍼 링', description: '통과한 아군에게 이속 부스트.', stats: { speedBoost: 0.5, duration: 4, cooldown: 14 } },
      { slot: 'ULTIMATE', key: 'Q', name: '오비탈 레이', description: '광역 영역 — 아군 치유 + 적 데미지 + 이속 부스트.', stats: { healPerSecond: 75, damagePerSecond: 100, duration: 9, radius: 12 } },
      { slot: 'PASSIVE', key: null, name: '글라이드', description: '낙하 속도 감소 + 이단 점프.', stats: { glide: true, doubleJump: true } },
    ],
  },
  {
    codename: 'kiriko',
    description: '쿠나이와 슈즈로 적을 처치하고 아군을 정화하는 일본 출신 서포터.',
    stat: { health: 200, moveSpeed: 5.5 },
    abilities: [
      { slot: 'PRIMARY', key: '좌클릭', name: '쿠나이', description: '연사 가능한 단검. 헤드샷 가능.', stats: { damage: 45, headshotMultiplier: 2.5, magazine: 12 } },
      { slot: 'SECONDARY', key: '우클릭', name: '치유 오후다', description: '자동 추적 치유 부적.', stats: { healPerOfuda: 18, count: 5, cooldown: 'auto' } },
      { slot: 'ABILITY_1', key: 'Shift', name: '보호의 영혼', description: '아군에게 무적 + 디버프 정화.', stats: { duration: 0.85, range: 'mid', cooldown: 14 } },
      { slot: 'ABILITY_2', key: 'E', name: '신속한 도약', description: '시야 내 아군에게 즉시 텔레포트.', stats: { range: 'global', cooldown: 7 } },
      { slot: 'ULTIMATE', key: 'Q', name: '여우령', description: '경로를 따라 영역 생성 — 아군 이속/공속/재장전 부스트.', stats: { duration: 12, moveSpeedBoost: 0.5, fireRateBoost: 0.5 } },
      { slot: 'PASSIVE', key: null, name: '벽 타기', description: '벽을 잠시 타고 올라감.', stats: { wallClimb: true } },
    ],
  },
  {
    codename: 'lifeweaver',
    description: '치유 꽃과 가시로 아군과 적을 동시에 다루는 태국 출신 서포터.',
    stat: { health: 275, moveSpeed: 5.5 },
    abilities: [
      { slot: 'PRIMARY', key: '좌클릭', name: '치유의 꽃', description: '충전 후 단발 치유.', stats: { minHeal: 30, maxHeal: 65, chargeTime: 1.2 } },
      { slot: 'SECONDARY', key: '우클릭', name: '가시 무기', description: '데미지 발사체로 모드 전환.', stats: { damagePerThorn: 6, magazine: 60 } },
      { slot: 'ABILITY_1', key: 'Shift', name: '꽃잎 발판', description: '상승 발판 생성.', stats: { liftSpeed: '7 m/s', cooldown: 12 } },
      { slot: 'ABILITY_2', key: 'E', name: '생명의 결속', description: '아군을 끌어와 안전한 위치로 이동.', stats: { range: 30, cooldown: 19 } },
      { slot: 'ULTIMATE', key: 'Q', name: '생명의 나무', description: '거대 나무 — 광역 치유 + 적 진입 방해.', stats: { treeHp: 1000, healAura: 90, duration: 15 } },
      { slot: 'PASSIVE', key: null, name: '재기 대시', description: '뒤로 짧게 대시.', stats: { distance: 7, cooldown: 4 } },
    ],
  },
  {
    codename: 'lucio',
    description: '음악으로 팀을 가속하거나 치유하는 브라질 출신 DJ 서포터. 벽타기 명수.',
    stat: { health: 200, moveSpeed: 5.5 },
    abilities: [
      { slot: 'PRIMARY', key: '좌클릭', name: '사운드웨이브 증폭기', description: '4발 음파 발사체.', stats: { damage: 16, magazine: 20 } },
      { slot: 'SECONDARY', key: '우클릭', name: '사운드웨이브 (밀쳐냄)', description: '근접 적을 밀어냄.', stats: { damage: 25, knockback: 'strong', cooldown: 4 } },
      { slot: 'ABILITY_1', key: 'Shift', name: '크로스페이드', description: '치유/이속 오라 전환.', stats: { healPerSecond: 16, speedBoost: 0.2, range: 12 } },
      { slot: 'ABILITY_2', key: 'E', name: '엠프 잇 업', description: '현재 오라 효과 ×2 잠시 증폭.', stats: { duration: 3, multiplier: 2, cooldown: 12 } },
      { slot: 'ULTIMATE', key: 'Q', name: '사운드 배리어', description: '주변 아군에 일시 보호막 부여.', stats: { tempShieldHp: 750, duration: 6, radius: 30 } },
      { slot: 'PASSIVE', key: null, name: '벽 타기', description: '벽 옆에서 점프 시 벽을 따라 이동.', stats: { wallRide: true } },
    ],
  },
  {
    codename: 'moira',
    description: '생체 광선으로 아군 치유와 적 흡수를 동시에 하는 아일랜드 출신 과학자.',
    stat: { health: 250, moveSpeed: 5.5 },
    abilities: [
      { slot: 'PRIMARY', key: '좌클릭', name: '생체 손길 (치유)', description: '아군에게 광선 치유. 자원 소비.', stats: { healPerSecond: 70, range: 15 } },
      { slot: 'SECONDARY', key: '우클릭', name: '생체 손길 (데미지)', description: '적 흡수 — 데미지 + 자원 충전.', stats: { damagePerSecond: 65, range: 21 } },
      { slot: 'ABILITY_1', key: 'Shift', name: '생체 구체 (치유)', description: '튕기는 광역 치유 구체.', stats: { totalHeal: 300, radius: 4, cooldown: 8 } },
      { slot: 'ABILITY_2', key: 'E', name: '생체 구체 (데미지)', description: '튕기는 광역 데미지 구체.', stats: { totalDamage: 200, radius: 4, cooldown: 8 } },
      { slot: 'ABILITY_1', key: 'Space', name: '소멸', description: '잠시 무적 + 이동속도 증가.', stats: { duration: 0.8, moveSpeed: 12, cooldown: 7 }, order: 1 },
      { slot: 'ULTIMATE', key: 'Q', name: '융합', description: '관통 빔 — 아군 치유 + 적 데미지.', stats: { healPerSecond: 140, damagePerSecond: 70, duration: 8 } },
      { slot: 'PASSIVE', key: null, name: '서포트 패시브', description: '피격 후 일정 시간 뒤 자가 체력 재생.', stats: { delay: 2.5, healRate: '15 HP/s' } },
    ],
  },
  {
    codename: 'wuyang',
    description: '물과 안개를 다루는 신영웅 서포터. (2025-08 출시) — 능력 수치는 추정치이며 추후 보정 필요.',
    stat: { health: 250, moveSpeed: 5.5 },
    abilities: [
      { slot: 'PASSIVE', key: null, name: '서포트 패시브', description: '피격 후 일정 시간 뒤 자가 체력 재생.', stats: { delay: 2.5, healRate: '15 HP/s' } },
    ],
  },
  // === 2026-02-11 출시 신영웅 — 학습 컷오프 이후. stub만, hero:edit으로 보정 필요 ===
  {
    codename: 'emre',
    description: '신영웅 딜러. (2026-02 출시) — 능력 수치는 추정치이며 추후 보정 필요.',
    stat: { health: 200, moveSpeed: 5.5 },
    abilities: [
      { slot: 'PASSIVE', key: null, name: '딜러 패시브', description: '처치/도움 시 짧게 이동속도 증가.', stats: { duration: 2.5, moveSpeedBoost: 0.3 } },
    ],
  },
  {
    codename: 'mizuki',
    description: '신영웅 딜러. (2026-02 출시) — 능력 수치는 추정치이며 추후 보정 필요.',
    stat: { health: 200, moveSpeed: 5.5 },
    abilities: [
      { slot: 'PASSIVE', key: null, name: '딜러 패시브', description: '처치/도움 시 짧게 이동속도 증가.', stats: { duration: 2.5, moveSpeedBoost: 0.3 } },
    ],
  },
  {
    codename: 'jetpack-cat',
    description: '신영웅 딜러. (2026-02 출시) — 능력 수치는 추정치이며 추후 보정 필요.',
    stat: { health: 200, moveSpeed: 5.5 },
    abilities: [
      { slot: 'PASSIVE', key: null, name: '딜러 패시브', description: '처치/도움 시 짧게 이동속도 증가.', stats: { duration: 2.5, moveSpeedBoost: 0.3 } },
    ],
  },
  {
    codename: 'zenyatta',
    description: '구체 명상을 통해 아군 치유와 적 견제를 동시에 하는 옴닉 승려.',
    stat: { health: 200, shield: 50, moveSpeed: 5.5 },
    abilities: [
      { slot: 'PRIMARY', key: '좌클릭', name: '파괴의 구슬', description: '단발 에너지 발사체.', stats: { damage: 48, fireRate: 1 } },
      { slot: 'SECONDARY', key: '우클릭', name: '파괴의 구슬 (난사)', description: '충전 후 일제 발사.', stats: { damagePerOrb: 48, maxOrbs: 5 } },
      { slot: 'ABILITY_1', key: 'Shift', name: '조화의 구슬', description: '아군에게 부착해 지속 치유.', stats: { healPerSecond: 30, range: 'global' } },
      { slot: 'ABILITY_2', key: 'E', name: '부조화의 구슬', description: '적에게 부착해 받는 데미지 ×1.25.', stats: { damageAmp: 0.25, range: 'global' } },
      { slot: 'ULTIMATE', key: 'Q', name: '초월', description: '잠시 무적 + 광역 강력 치유.', stats: { healPerSecond: 300, duration: 6, radius: 10 } },
      { slot: 'PASSIVE', key: null, name: '발차기', description: '근접 공격이 차서 보내는 형태.', stats: { meleeDamage: 30, knockback: true } },
    ],
  },
];

export async function applyHeroDetailSeeds(prisma: PrismaClient): Promise<{ stat: number; abilities: number }> {
  let statApplied = 0;
  let abilitiesApplied = 0;

  for (const seed of HERO_DETAIL_SEEDS) {
    const hero = await prisma.hero.findUnique({ where: { codename: seed.codename } });
    if (!hero) continue;

    await prisma.hero.update({
      where: { id: hero.id },
      data: {
        description: seed.description,
        ...(seed.nameTranslations && {
          nameTranslations: seed.nameTranslations as Prisma.InputJsonValue,
        }),
      },
    });

    await prisma.heroStat.upsert({
      where: { heroId: hero.id },
      update: {},
      create: {
        heroId: hero.id,
        health: seed.stat.health,
        armor: seed.stat.armor ?? 0,
        shield: seed.stat.shield ?? 0,
        moveSpeed: seed.stat.moveSpeed,
        extras: (seed.stat.extras ?? Prisma.JsonNull) as Prisma.InputJsonValue,
      },
    });
    statApplied += 1;

    for (const ability of seed.abilities) {
      const order = ability.order ?? 0;
      const nameTranslationsValue =
        ability.nameTranslations !== undefined
          ? (ability.nameTranslations as Prisma.InputJsonValue)
          : Prisma.JsonNull;
      await prisma.heroAbility.upsert({
        where: { heroId_slot_order: { heroId: hero.id, slot: ability.slot, order } },
        update: {
          name: ability.name,
          nameTranslations: nameTranslationsValue,
        },
        create: {
          heroId: hero.id,
          slot: ability.slot,
          key: ability.key,
          name: ability.name,
          nameTranslations: nameTranslationsValue,
          description: ability.description,
          stats: (ability.stats ?? Prisma.JsonNull) as Prisma.InputJsonValue,
          order,
        },
      });
      abilitiesApplied += 1;
    }
  }

  return { stat: statApplied, abilities: abilitiesApplied };
}
