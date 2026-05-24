const dateFormatter = new Intl.DateTimeFormat('ko-KR', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
});

export function formatDate(iso: string): string {
  return dateFormatter.format(new Date(iso));
}

const ROLE_LABELS = {
  TANK: '돌격',
  DAMAGE: '공격',
  SUPPORT: '지원',
} as const;

export type RoleKey = keyof typeof ROLE_LABELS;

export function roleLabel(role: RoleKey): string {
  return ROLE_LABELS[role];
}

const ROLE_COLOR_VAR = {
  TANK: '--color-role-tank',
  DAMAGE: '--color-role-damage',
  SUPPORT: '--color-role-support',
} as const;

export function roleColorVar(role: RoleKey): string {
  return ROLE_COLOR_VAR[role];
}

export const ROLE_ORDER: readonly RoleKey[] = ['TANK', 'DAMAGE', 'SUPPORT'];

const SLOT_LABELS = {
  PASSIVE: '패시브',
  PRIMARY: '기본 공격',
  SECONDARY: '보조 공격',
  ABILITY_1: '기술 1',
  ABILITY_2: '기술 2',
  ULTIMATE: '궁극기',
} as const;

export function slotLabel(slot: keyof typeof SLOT_LABELS): string {
  return SLOT_LABELS[slot];
}

const CATEGORY_LABELS = {
  HERO_BALANCE: '영웅 밸런스',
  BUG_FIX: '버그 수정',
  MAP: '지도',
  SYSTEM: '시스템',
  GENERAL: '일반',
} as const;

export type CategoryKey = keyof typeof CATEGORY_LABELS;

export function categoryLabel(category: CategoryKey): string {
  return CATEGORY_LABELS[category];
}

const CATEGORY_COLOR_VAR = {
  HERO_BALANCE: '--color-cat-balance',
  BUG_FIX: '--color-cat-bug',
  MAP: '--color-cat-map',
  SYSTEM: '--color-cat-system',
  GENERAL: '--color-cat-general',
} as const;

export function categoryColorVar(category: CategoryKey): string {
  return CATEGORY_COLOR_VAR[category];
}

export const CATEGORY_ORDER: readonly CategoryKey[] = ['HERO_BALANCE', 'BUG_FIX', 'MAP', 'SYSTEM', 'GENERAL'];

/**
 * 2026-02 Reign of Talon 시즌1에서 도입된 서브 역할군 패시브.
 * 영문 식별자 → 공식 한국어 라벨 (블리자드 한국 영웅 페이지 기준).
 */
const SUBROLE_LABELS = {
  Bruiser: '투사',
  Initiator: '개시자',
  Stalwart: '강건한 자',
  Sharpshooter: '명사수',
  Flanker: '측면 공격가',
  Specialist: '전문가',
  Recon: '수색가',
  Tactician: '전술가',
  Medic: '의무관',
  Survivor: '생존왕',
} as const;

export type SubroleKey = keyof typeof SUBROLE_LABELS;

export function subroleLabel(subrole: SubroleKey): string {
  return SUBROLE_LABELS[subrole];
}

/**
 * 같은 subrole의 모든 영웅에게 자동 부여되는 패시브 효과.
 */
const SUBROLE_PASSIVES: Record<SubroleKey, string> = {
  Bruiser: '치명타 저항력을 얻습니다. 생명력이 절반 미만일 시 더 빨리 이동합니다.',
  Initiator: '특정 기술을 사용한 후 지속 치유를 얻습니다.',
  Stalwart: '밀쳐내기 및 감속에 저항력을 얻습니다.',
  Sharpshooter: '치명타 적중 시 이동 기술 재사용 대기시간이 감소합니다.',
  Flanker: '생명력 팩으로 생명력을 더 회복합니다.',
  Specialist: '적을 처치하면 잠깐 동안 재장전 속도가 증가합니다.',
  Recon: '생명력이 절반 미만인 적에게 피해를 주면 적이 드러납니다.',
  Tactician: '추가 궁극기 충전을 유지합니다.',
  Medic: '무기로 아군을 치유하면 자신도 치유합니다.',
  Survivor: '이동 기술을 사용하면 생명력 지속 재생이 발동합니다.',
};

export function subrolePassive(subrole: SubroleKey): string {
  return SUBROLE_PASSIVES[subrole];
}

export interface SubroleStat {
  label: string;
  value: string;
}

/**
 * subrole 패시브의 세부 수치. 영웅 상세 페이지에서 패시브 설명과 함께 표시한다.
 */
const SUBROLE_STATS: Record<SubroleKey, readonly SubroleStat[]> = {
  Bruiser: [
    { label: '치명타 피해 저항', value: '25%' },
    { label: '이동 속도 증가', value: '20%' },
  ],
  Initiator: [
    { label: '지속시간', value: '1초' },
    { label: '치유량', value: '50/초' },
    { label: '재사용 대기시간', value: '5초' },
  ],
  Stalwart: [
    { label: '밀쳐내기 저항', value: '40%' },
    { label: '감속 저항', value: '40%' },
  ],
  Sharpshooter: [{ label: '재사용 대기시간 감소량', value: '준 피해량의 0.75%' }],
  Flanker: [{ label: '추가 치유량', value: '75' }],
  Specialist: [
    { label: '지속 시간', value: '처치 후 3초' },
    { label: '재장전 속도 증가', value: '50%' },
  ],
  Recon: [{ label: '위치 노출 지속 시간', value: '3.5초' }],
  Tactician: [
    { label: '추가 궁극기 게이지', value: '최대 125%' },
    { label: '궁극기 충전 감소', value: '25% (100% 초과 시)' },
  ],
  Medic: [{ label: '회복량', value: '무기 치유량의 40%' }],
  Survivor: [{ label: '생명력 재생 최소 지속시간', value: '0.25초' }],
};

export function subroleStats(subrole: SubroleKey): readonly SubroleStat[] {
  return SUBROLE_STATS[subrole];
}
