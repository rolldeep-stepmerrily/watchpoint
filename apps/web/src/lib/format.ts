import type { AbilitySlot, EntryCategory, HeroRole, PerkTier } from '@@shared';

const ROLE_COLOR_VAR: Record<HeroRole, string> = {
  TANK: '--color-role-tank',
  DAMAGE: '--color-role-damage',
  SUPPORT: '--color-role-support',
};

export function roleColorVar(role: HeroRole): string {
  return ROLE_COLOR_VAR[role];
}

export const ROLE_ORDER: readonly HeroRole[] = ['TANK', 'DAMAGE', 'SUPPORT'];

const SLOT_COLOR_VAR: Record<AbilitySlot, string> = {
  PASSIVE: '--color-slot-passive',
  PRIMARY: '--color-slot-primary',
  SECONDARY: '--color-slot-secondary',
  ABILITY_1: '--color-slot-ability1',
  ABILITY_2: '--color-slot-ability2',
  ULTIMATE: '--color-slot-ultimate',
};

export function slotColorVar(slot: AbilitySlot): string {
  return SLOT_COLOR_VAR[slot];
}

export const SLOT_ORDER: readonly AbilitySlot[] = [
  'PASSIVE',
  'PRIMARY',
  'SECONDARY',
  'ABILITY_1',
  'ABILITY_2',
  'ULTIMATE',
];

/**
 * 능력 stats JSON의 영어 키를 한글 라벨로 변환.
 * 매핑이 없으면 원본 키 그대로 반환 (향후 신규 키가 누락돼도 화면은 안 깨짐).
 * 향후 i18n 후속: labels.ts로 옮기고 lang별 분기.
 */
const STAT_KEY_LABELS: Record<string, string> = {
  // 피해
  damage: '피해량',
  hipDamage: '무조준 피해',
  scopedDamage: '조준 피해',
  minDamage: '최소 피해',
  maxDamage: '최대 피해',
  impactDamage: '충돌 피해',
  impact: '충돌 피해',
  explosionDamage: '폭발 피해',
  directDamage: '직격 피해',
  splashDamage: '광역 피해',
  burnDamage: '화상 피해',
  woundDamage: '출혈 피해',
  wallDamage: '벽 충돌 피해',
  pinDamage: '고정 피해',
  stickDamage: '부착 피해',
  swingDamage: '휘두름 피해',
  throwDamage: '투척 피해',
  meleeDamage: '근접 피해',
  emergeDamage: '솟구침 피해',
  finalDamage: '최종 피해',
  initialDamage: '초기 피해',
  maxOuterDamage: '최대 외곽 피해',
  totalDamage: '총 피해',
  damagePerHit: '적중당 피해',
  damagePerShot: '발당 피해',
  damagePerOrb: '구체당 피해',
  damagePerThorn: '가시당 피해',
  damagePerShuriken: '표창당 피해',
  damagePerBomb: '폭탄당 피해',
  damagePerArrow: '화살당 피해',
  damagePerRocket: '로켓당 피해',
  damagePerShell: '포탄당 피해',
  damagePerLock: '잠금당 피해',
  damagePerSecond: '초당 피해',
  damagePerProjectile: '발사체당 피해',
  dps: 'DPS',
  maxDps: '최대 DPS',
  minDps: '최소 DPS',
  executeDps: '처형 DPS',
  dotPerSecond: '초당 도트',
  dotTotal: '도트 합계',
  bobDamage: 'B.O.B. 피해',

  // 회복
  heal: '회복량',
  healPerSecond: '초당 회복',
  healPerShot: '발당 회복',
  healPerOfuda: '부적당 회복',
  healPerGrenade: '수류탄당 회복',
  healPerProjectile: '발사체당 회복',
  healPerKill: '처치당 회복',
  healRate: '회복 속도',
  healFromWound: '출혈로부터 회복',
  healBoost: '회복 증폭',
  healIncrease: '회복 증가',
  healAura: '광역 회복',
  minHeal: '최소 회복',
  maxHeal: '최대 회복',
  instantHeal: '즉시 회복',
  overheal: '추가 회복',
  splashHeal: '광역 회복',
  totalHeal: '총 회복',

  // 체력/방어
  hp: '체력',
  maxHp: '최대 체력',
  tempHp: '임시 체력',
  tempHpSelf: '자가 임시 체력',
  tempHpAlly: '아군 임시 체력',
  tempHpRate: '임시 체력 속도',
  tempHpPerCrit: '치명타당 임시 체력',
  tempHpPerHit: '적중당 임시 체력',
  tempHpPerAbility: '능력당 임시 체력',
  maxTempHp: '최대 임시 체력',
  tempShieldHp: '임시 보호막',
  barrierHp: '방벽 체력',
  barrierHealth: '방벽 체력',
  treeHp: '나무 체력',
  turretHp: '터렛 체력',
  wallHp: '벽 체력',
  bobHp: 'B.O.B. 체력',
  shieldDestroy: '보호막 파괴',
  maxShieldGain: '최대 보호막 획득',
  baseShield: '기본 보호막',
  formArmor: '변신 방어력',
  pilotHealth: '조종사 체력',
  maxAbsorb: '최대 흡수량',

  // 시간/지속
  duration: '지속시간',
  baseDuration: '기본 지속시간',
  cooldown: '재사용 대기시간',
  delay: '지연',
  activationTime: '활성화 시간',
  activationDelay: '활성화 지연',
  chargeTime: '충전 시간',
  castTime: '시전 시간',
  recharge: '재충전 시간',
  rechargeTime: '재충전 시간',
  fireDuration: '발사 지속',
  burstDuration: '연사 지속',
  fuseTime: '폭발 지연',
  rewindWindow: '역행 범위',
  pullDuration: '끌어당김 지속',
  snareDuration: '결박 지속',
  sleepDuration: '수면 지속',
  freezeDuration: '빙결 지속',
  silenceDuration: '침묵 지속',
  hackDuration: '해킹 지속',
  antiHealDuration: '반힐 지속',
  knockdownDuration: '넘어짐 지속',
  wallDuration: '벽 지속',
  detectionDuration: '감지 지속',
  burrowDuration: '잠수 지속',
  heatLimit: '과열 한계',
  lockOnTime: '추적 시간',

  // 거리/범위
  range: '사거리',
  distance: '거리',
  radius: '반경',
  spread: '산탄 패턴',
  falloffRange: '감쇠 거리',
  falloff: '감쇠 거리',
  jumpHeight: '점프 높이',
  maxJumpHeight: '최대 점프 높이',

  // 속도
  speed: '속도',
  fireRate: '발사 속도',
  moveSpeed: '이동 속도',
  moveSpeedBoost: '이동 속도 증가',
  moveSpeedStealth: '은신 중 이속',
  shieldHp: '보호막',
  rollSpeed: '굴리기 속도',
  rollMoveSpeedBoost: '굴리기 이속 증가',
  liftSpeed: '상승 속도',
  speedBoost: '속도 증가',
  regenRate: '재생 속도',
  fireRateBoost: '발사속도 증가',
  projectileSpeed: '발사체 속도',

  // 개수
  count: '개수',
  charges: '충전 횟수',
  pelletsPerShot: '발당 산탄',
  magazine: '탄창',
  mineCount: '지뢰 개수',
  bombCount: '폭탄 개수',
  maxOrbs: '최대 구체',
  shellCount: '포탄 개수',
  chainTargets: '연쇄 대상',
  burstCount: '연사 개수',
  explosions: '폭발 수',

  // 배율/비율
  multiplier: '배율',
  critMultiplier: '치명타 배율',
  headshotMultiplier: '헤드샷 배율',
  bonusMultiplier: '추가 배율',
  critDamageReduction: '치명타 피해 감소',
  damageReduction: '피해 감소',
  dmgReduction: '피해 감소',
  damageBoost: '피해 증폭',
  damageAmp: '피해 증폭',
  ultChargeRate: '궁극기 충전 속도',
  lifesteal: '흡혈',
  lifestealRatio: '흡혈 비율',
  slow: '둔화',
  slowMax: '최대 둔화',

  // 기타
  knockup: '띄움',
  knockback: '밀쳐냄',
  knockbackResist: '밀쳐냄 저항',
  zoomLevel: '확대 배율',
  swingArc: '휘두름 각도',
  swingRange: '휘두름 거리',
  ignite: '점화',
  autoAim: '자동 조준',
  autoCharge: '자동 충전',
  blocksProjectiles: '발사체 차단',
  holdToCharge: '누르면 충전',
  holdSpaceToGlide: '스페이스 활공',
  flightEnabled: '비행 가능',
  wallClimb: '벽 타기',
  doubleJump: '이단 점프',
  wallRide: '벽 타기',
  glide: '활공',
  teamWide: '팀 전체',
  lockOn: '자동 추적',
  energyCost: '에너지 소비',
  energyPerHit: '적중당 에너지',
  maxCharge: '최대 충전',
  decay: '감소',
  perEnemy: '적당',
  meka: '메카',
  fuel: '연료',
  fuelRegen: '연료 재생',
};

export function statKeyLabel(key: string): string {
  return STAT_KEY_LABELS[key] ?? key;
}

const CATEGORY_COLOR_VAR: Record<EntryCategory, string> = {
  HERO_BALANCE: '--color-cat-balance',
  BUG_FIX: '--color-cat-bug',
  MAP: '--color-cat-map',
  SYSTEM: '--color-cat-system',
  GENERAL: '--color-cat-general',
};

export function categoryColorVar(category: EntryCategory): string {
  return CATEGORY_COLOR_VAR[category];
}

export const CATEGORY_ORDER: readonly EntryCategory[] = ['HERO_BALANCE', 'BUG_FIX', 'MAP', 'SYSTEM', 'GENERAL'];

const PERK_TIER_COLOR_VAR: Record<PerkTier, string> = {
  MINOR: '--color-perk-minor',
  MAJOR: '--color-perk-major',
};

export function perkTierColorVar(tier: PerkTier): string {
  return PERK_TIER_COLOR_VAR[tier];
}

export const PERK_TIER_ORDER: readonly PerkTier[] = ['MINOR', 'MAJOR'];
