const dateFormatter = new Intl.DateTimeFormat("ko-KR", {
  year: "numeric",
  month: "long",
  day: "numeric",
});

export function formatDate(iso: string): string {
  return dateFormatter.format(new Date(iso));
}

const ROLE_LABELS = {
  TANK: "돌격",
  DAMAGE: "공격",
  SUPPORT: "지원",
} as const;

export function roleLabel(role: keyof typeof ROLE_LABELS): string {
  return ROLE_LABELS[role];
}

const SLOT_LABELS = {
  PASSIVE: "패시브",
  PRIMARY: "기본 공격",
  SECONDARY: "보조 공격",
  ABILITY_1: "기술 1",
  ABILITY_2: "기술 2",
  ULTIMATE: "궁극기",
} as const;

export function slotLabel(slot: keyof typeof SLOT_LABELS): string {
  return SLOT_LABELS[slot];
}

const CATEGORY_LABELS = {
  HERO_BALANCE: "영웅 밸런스",
  BUG_FIX: "버그 수정",
  MAP: "지도",
  SYSTEM: "시스템",
  GENERAL: "일반",
} as const;

export function categoryLabel(category: keyof typeof CATEGORY_LABELS): string {
  return CATEGORY_LABELS[category];
}
