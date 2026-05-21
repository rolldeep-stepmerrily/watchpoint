import { type AbilitySlot, Prisma, type PrismaClient } from '../../src/generated/prisma/client';

/**
 * 풀데이터(stat + abilities)가 들어가는 영웅의 정적 시드.
 *
 * - 멱등: hero_stats는 `update: {}` upsert(이미 있으면 손대지 않음),
 *   hero_abilities는 행 수가 0일 때만 createMany.
 * - 수치는 OW2 기준 근사치. 패치마다 변동하므로 `pnpm hero:edit <codename>`으로
 *   보정 가능.
 */
export interface HeroDetailSeed {
  codename: string;
  description: string;
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
];

export async function applyHeroDetailSeeds(prisma: PrismaClient): Promise<{ stat: number; abilities: number }> {
  let statApplied = 0;
  let abilitiesApplied = 0;

  for (const seed of HERO_DETAIL_SEEDS) {
    const hero = await prisma.hero.findUnique({ where: { codename: seed.codename } });
    if (!hero) continue;

    await prisma.hero.update({
      where: { id: hero.id },
      data: { description: seed.description },
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

    const existingAbilities = await prisma.heroAbility.count({ where: { heroId: hero.id } });
    if (existingAbilities > 0) continue;

    await prisma.heroAbility.createMany({
      data: seed.abilities.map((ability) => ({
        heroId: hero.id,
        slot: ability.slot,
        key: ability.key,
        name: ability.name,
        description: ability.description,
        stats: (ability.stats ?? Prisma.JsonNull) as Prisma.InputJsonValue,
        order: ability.order ?? 0,
      })),
    });
    abilitiesApplied += seed.abilities.length;
  }

  return { stat: statApplied, abilities: abilitiesApplied };
}
