import type { AbilitySlot, EntryCategory, HeroRole, Locale, PerkTier, Subrole } from '@@shared';

/**
 * 실제 번역이 준비된 로케일. Locale 타입의 ja는 잠정적으로 en으로 fallback한다.
 */
type SupportedLocale = 'ko' | 'en';

function supportedLocale(locale: Locale): SupportedLocale {
  return locale === 'ja' ? 'en' : locale;
}

export interface SubroleStat {
  label: string;
  value: string;
}

const ROLE_LABELS: Record<SupportedLocale, Record<HeroRole, string>> = {
  ko: { TANK: '돌격', DAMAGE: '공격', SUPPORT: '지원' },
  en: { TANK: 'Tank', DAMAGE: 'Damage', SUPPORT: 'Support' },
};

const SLOT_LABELS: Record<SupportedLocale, Record<AbilitySlot, string>> = {
  ko: {
    PASSIVE: '패시브',
    PRIMARY: '기본 공격',
    SECONDARY: '보조 공격',
    ABILITY_1: '기술 1',
    ABILITY_2: '기술 2',
    ULTIMATE: '궁극기',
  },
  en: {
    PASSIVE: 'Passive',
    PRIMARY: 'Primary Fire',
    SECONDARY: 'Secondary Fire',
    ABILITY_1: 'Ability 1',
    ABILITY_2: 'Ability 2',
    ULTIMATE: 'Ultimate',
  },
};

const CATEGORY_LABELS: Record<SupportedLocale, Record<EntryCategory, string>> = {
  ko: {
    HERO_BALANCE: '영웅 밸런스',
    BUG_FIX: '버그 수정',
    MAP: '지도',
    SYSTEM: '시스템',
    GENERAL: '일반',
  },
  en: {
    HERO_BALANCE: 'Hero Balance',
    BUG_FIX: 'Bug Fix',
    MAP: 'Map',
    SYSTEM: 'System',
    GENERAL: 'General',
  },
};

const PERK_TIER_LABELS: Record<SupportedLocale, Record<PerkTier, string>> = {
  ko: { MINOR: '보조 특전', MAJOR: '주요 특전' },
  en: { MINOR: 'Minor Perk', MAJOR: 'Major Perk' },
};

const SUBROLE_LABELS: Record<SupportedLocale, Record<Subrole, string>> = {
  ko: {
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
  },
  en: {
    Bruiser: 'Bruiser',
    Initiator: 'Initiator',
    Stalwart: 'Stalwart',
    Sharpshooter: 'Sharpshooter',
    Flanker: 'Flanker',
    Specialist: 'Specialist',
    Recon: 'Recon',
    Tactician: 'Tactician',
    Medic: 'Medic',
    Survivor: 'Survivor',
  },
};

// PR review 시 Blizzard 영문 공식 표기와 대조 후 verbatim으로 수정 권장.
const SUBROLE_PASSIVES: Record<SupportedLocale, Record<Subrole, string>> = {
  ko: {
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
  },
  en: {
    Bruiser: 'Gain critical damage resistance. Move faster when below half health.',
    Initiator: 'After using a movement ability, gain healing over time.',
    Stalwart: 'Gain knockback and slow resistance.',
    Sharpshooter: 'Critical hits reduce movement ability cooldowns.',
    Flanker: 'Recover more health from health packs.',
    Specialist: 'Eliminating an enemy briefly increases reload speed.',
    Recon: 'Reveal enemies below half health when you damage them.',
    Tactician: 'Hold extra ultimate charge.',
    Medic: 'Heal yourself when healing allies with your weapon.',
    Survivor: 'Using a movement ability triggers health regeneration.',
  },
};

const SUBROLE_STATS: Record<SupportedLocale, Record<Subrole, readonly SubroleStat[]>> = {
  ko: {
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
  },
  en: {
    Bruiser: [
      { label: 'Critical Damage Resistance', value: '25%' },
      { label: 'Move Speed Increase', value: '20%' },
    ],
    Initiator: [
      { label: 'Duration', value: '1s' },
      { label: 'Healing', value: '50/s' },
      { label: 'Cooldown', value: '5s' },
    ],
    Stalwart: [
      { label: 'Knockback Resistance', value: '40%' },
      { label: 'Slow Resistance', value: '40%' },
    ],
    Sharpshooter: [{ label: 'Cooldown Reduction', value: '0.75% of damage dealt' }],
    Flanker: [{ label: 'Extra Healing', value: '75' }],
    Specialist: [
      { label: 'Duration', value: '3s after elimination' },
      { label: 'Reload Speed Increase', value: '50%' },
    ],
    Recon: [{ label: 'Reveal Duration', value: '3.5s' }],
    Tactician: [
      { label: 'Extra Ultimate Charge', value: 'Up to 125%' },
      { label: 'Ultimate Charge Reduction', value: '25% (above 100%)' },
    ],
    Medic: [{ label: 'Heal Amount', value: '40% of weapon healing' }],
    Survivor: [{ label: 'Minimum Regen Duration', value: '0.25s' }],
  },
};

interface Copy {
  site: {
    name: string;
    description: string;
    tagline: string;
  };
  nav: {
    heroes: string;
    patchNotes: string;
    menuOpen: string;
    menuClose: string;
  };
  common: {
    home: string;
    retry: string;
    source: string;
    language: string;
    languageComingSoon: string;
    pageLoading: string;
    footerAttribution: string;
    error: {
      heading: string;
      body: string;
      kicker: string;
    };
    notFound: {
      title: string;
      heading: string;
      body: string;
      kicker: string;
    };
  };
  home: {
    description: string;
    patchNotesHeading: string;
    patchNotesBody: string;
    heroesHeading: string;
    heroesBody: string;
    latestPatches: string;
    viewAll: string;
  };
  heroes: {
    title: string;
    titleWithCount: (n: number) => string;
    description: string;
    empty: string;
    loading: string;
    allLabel: string;
    columns: {
      hero: string;
      role: string;
      subrole: string;
      released: string;
    };
    notFound: {
      title: string;
      kicker: string;
      heading: string;
      body: string;
      cta: string;
      ogAlt: string;
      ogFallback: string;
    };
  };
  hero: {
    release: string;
    subPassive: string;
    stats: string;
    statLabels: { health: string; armor: string; shield: string; moveSpeed: string };
    abilities: string;
    perks: string;
    patchHistory: string;
    history: {
      columns: { version: string; date: string; changes: string };
    };
    descriptionFallback: (name: string) => string;
  };
  patchNotes: {
    title: string;
    titleWithCount: (n: number) => string;
    description: string;
    subtitle: string;
    empty: string;
    loading: string;
    released: string;
    noChanges: string;
    columns: {
      version: string;
      date: string;
      title: string;
      category: string;
      changes: string;
    };
    descriptionFallback: (version: string, title: string) => string;
    notFound: {
      title: string;
      kicker: string;
      heading: string;
      body: string;
      cta: string;
      ogAlt: string;
      ogFallback: string;
    };
  };
  search: {
    placeholder: string;
    ariaLabel: string;
    searching: string;
    empty: string;
    groupHeroes: string;
    groupPatchNotes: string;
  };
}

const UI_COPY: Record<SupportedLocale, Copy> = {
  ko: {
    site: {
      name: 'Watchpoint',
      description: '오버워치 패치노트와 영웅 능력 수치를 한곳에서 추적합니다.',
      tagline: 'Quis custodiet ipsos custodes?',
    },
    nav: {
      heroes: '영웅',
      patchNotes: '패치노트',
      menuOpen: '메뉴 열기',
      menuClose: '메뉴 닫기',
    },
    common: {
      home: '홈으로',
      retry: '다시 시도',
      source: '출처',
      language: '언어 선택',
      languageComingSoon: '준비 중',
      pageLoading: '페이지 불러오는 중',
      footerAttribution: '데이터 출처: Blizzard 공식 패치노트 / Blizzard 공식 영웅 정보',
      error: {
        heading: '잠깐, 무언가 잘못됐어요.',
        body: '페이지를 불러오는 중 오류가 발생했습니다. 잠시 후 다시 시도하거나 다른 페이지로 이동해 주세요.',
        kicker: 'Error',
      },
      notFound: {
        title: '페이지를 찾을 수 없음',
        heading: '페이지를 찾을 수 없어요.',
        body: '이동하려던 페이지가 존재하지 않거나 삭제됐을 수 있어요.',
        kicker: '404',
      },
    },
    home: {
      description:
        '오버워치 패치노트와 영웅별 능력 상세 수치를 한곳에서 추적·열람합니다. 블리자드 공식 패치노트와 영웅 정보를 자동으로 모읍니다.',
      patchNotesHeading: '패치노트 →',
      patchNotesBody: '2026년 1월 이후의 모든 공식 패치 변경사항.',
      heroesHeading: '영웅 →',
      heroesBody: '전체 영웅의 스탯, 능력, 패치 이력.',
      latestPatches: '최신 패치',
      viewAll: '전체 보기 →',
    },
    heroes: {
      title: '영웅',
      titleWithCount: (n) => `영웅 (${n})`,
      description: '오버워치 전체 영웅 목록 — 역할별 분류, 능력 수치, 패치 이력으로 연결.',
      empty: '아직 등록된 영웅이 없습니다.',
      loading: '영웅 목록 불러오는 중',
      allLabel: '전체',
      columns: {
        hero: '영웅',
        role: '역할',
        subrole: '서브 역할',
        released: '출시일',
      },
      notFound: {
        title: '영웅을 찾을 수 없음',
        kicker: '404 · Hero',
        heading: '해당 영웅을 찾을 수 없어요.',
        body: 'codename이 잘못됐거나 아직 동기화되지 않은 영웅일 수 있어요.',
        cta: '전체 영웅 보기',
        ogAlt: '영웅 상세',
        ogFallback: '영웅을 찾을 수 없음',
      },
    },
    hero: {
      release: '출시',
      subPassive: '서브 패시브',
      stats: '기본 스탯',
      statLabels: { health: '생명력', armor: '방어력', shield: '보호막', moveSpeed: '이동 속도' },
      abilities: '능력',
      perks: '특전',
      patchHistory: '패치 이력',
      history: {
        columns: { version: '버전', date: '날짜', changes: '변경 내용' },
      },
      descriptionFallback: (name) => `오버워치 영웅 ${name}의 능력 수치와 패치 이력.`,
    },
    patchNotes: {
      title: '패치노트',
      titleWithCount: (n) => `패치노트 (${n})`,
      description: '오버워치 공식 패치노트 — 2026년 1월 이후 모든 버전 변경사항.',
      subtitle: '최신순으로 표시 — PUBLISHED만 노출',
      empty: '등록된 패치노트가 없습니다.',
      loading: '패치노트 목록 불러오는 중',
      released: '발표',
      noChanges: '변경사항이 없습니다.',
      columns: {
        version: '버전',
        date: '날짜',
        title: '제목',
        category: '분류',
        changes: '변경 내용',
      },
      descriptionFallback: (version, title) => `오버워치 ${version} 패치노트 — ${title}`,
      notFound: {
        title: '패치노트를 찾을 수 없음',
        kicker: '404 · Patch',
        heading: '해당 패치노트를 찾을 수 없어요.',
        body: '버전이 잘못됐거나 비공개(PENDING_REVIEW/DRAFT) 상태일 수 있어요.',
        cta: '패치노트 목록',
        ogAlt: '패치노트',
        ogFallback: '패치노트를 찾을 수 없음',
      },
    },
    search: {
      placeholder: '영웅·패치노트 검색',
      ariaLabel: '검색',
      searching: '검색 중…',
      empty: '결과 없음',
      groupHeroes: '영웅',
      groupPatchNotes: '패치노트',
    },
  },
  en: {
    site: {
      name: 'Watchpoint',
      description: 'Track Overwatch patch notes and hero ability stats in one place.',
      tagline: 'Quis custodiet ipsos custodes?',
    },
    nav: {
      heroes: 'Heroes',
      patchNotes: 'Patch Notes',
      menuOpen: 'Open menu',
      menuClose: 'Close menu',
    },
    common: {
      home: 'Home',
      retry: 'Try again',
      source: 'Source',
      language: 'Language',
      languageComingSoon: 'Coming soon',
      pageLoading: 'Loading page',
      footerAttribution: 'Sources: Blizzard official patch notes / Blizzard official hero info',
      error: {
        heading: 'Something went wrong.',
        body: 'An error occurred while loading the page. Please try again in a moment or navigate elsewhere.',
        kicker: 'Error',
      },
      notFound: {
        title: 'Page not found',
        heading: "We couldn't find that page.",
        body: 'The page may not exist or has been removed.',
        kicker: '404',
      },
    },
    home: {
      description:
        'Track and browse Overwatch patch notes and detailed hero ability stats in one place. Automatically aggregates official Blizzard patch notes and hero info.',
      patchNotesHeading: 'Patch Notes →',
      patchNotesBody: 'All official patch changes since January 2026.',
      heroesHeading: 'Heroes →',
      heroesBody: 'Stats, abilities, and patch history for every hero.',
      latestPatches: 'Latest patches',
      viewAll: 'View all →',
    },
    heroes: {
      title: 'Heroes',
      titleWithCount: (n) => `Heroes (${n})`,
      description: 'Full Overwatch hero roster — grouped by role, with ability stats and linked patch history.',
      empty: 'No heroes yet.',
      loading: 'Loading heroes',
      allLabel: 'All',
      columns: {
        hero: 'Hero',
        role: 'Role',
        subrole: 'Subrole',
        released: 'Released',
      },
      notFound: {
        title: 'Hero not found',
        kicker: '404 · Hero',
        heading: "We couldn't find that hero.",
        body: 'The codename may be invalid, or the hero is not synced yet.',
        cta: 'View all heroes',
        ogAlt: 'Hero detail',
        ogFallback: 'Hero not found',
      },
    },
    hero: {
      release: 'Released',
      subPassive: 'Subrole passive',
      stats: 'Base stats',
      statLabels: { health: 'Health', armor: 'Armor', shield: 'Shield', moveSpeed: 'Move speed' },
      abilities: 'Abilities',
      perks: 'Perks',
      patchHistory: 'Patch history',
      history: {
        columns: { version: 'Version', date: 'Date', changes: 'Changes' },
      },
      descriptionFallback: (name) => `Ability stats and patch history for Overwatch hero ${name}.`,
    },
    patchNotes: {
      title: 'Patch Notes',
      titleWithCount: (n) => `Patch Notes (${n})`,
      description: 'Official Overwatch patch notes — all version changes since January 2026.',
      subtitle: 'Newest first — PUBLISHED only',
      empty: 'No patch notes yet.',
      loading: 'Loading patch notes',
      released: 'Released',
      noChanges: 'No changes.',
      columns: {
        version: 'Version',
        date: 'Date',
        title: 'Title',
        category: 'Category',
        changes: 'Changes',
      },
      descriptionFallback: (version, title) => `Overwatch ${version} patch notes — ${title}`,
      notFound: {
        title: 'Patch note not found',
        kicker: '404 · Patch',
        heading: "We couldn't find that patch note.",
        body: 'The version may be invalid, or the patch is unpublished (PENDING_REVIEW/DRAFT).',
        cta: 'Patch notes list',
        ogAlt: 'Patch notes',
        ogFallback: 'Patch note not found',
      },
    },
    search: {
      placeholder: 'Search heroes & patch notes',
      ariaLabel: 'Search',
      searching: 'Searching…',
      empty: 'No results',
      groupHeroes: 'Heroes',
      groupPatchNotes: 'Patch Notes',
    },
  },
};

const DATE_FORMATTERS: Record<SupportedLocale, Intl.DateTimeFormat> = {
  ko: new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' }),
  en: new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
};

function formatDateFor(iso: string, locale: SupportedLocale): string {
  return DATE_FORMATTERS[locale].format(new Date(iso));
}

/**
 * 서버/클라이언트에서 현재 로케일에 맞는 라벨/카피/포맷터 묶음을 반환한다.
 * 컴포넌트 진입부에서 한 번 호출 후 `t.heroes.title` 등으로 사용.
 */
export function getLabels(locale: Locale) {
  const l = supportedLocale(locale);
  return {
    role: (key: HeroRole): string => ROLE_LABELS[l][key],
    slot: (key: AbilitySlot): string => SLOT_LABELS[l][key],
    category: (key: EntryCategory): string => CATEGORY_LABELS[l][key],
    perkTier: (key: PerkTier): string => PERK_TIER_LABELS[l][key],
    subrole: (key: Subrole): string => SUBROLE_LABELS[l][key],
    subrolePassive: (key: Subrole): string => SUBROLE_PASSIVES[l][key],
    subroleStats: (key: Subrole): readonly SubroleStat[] => SUBROLE_STATS[l][key],
    date: (iso: string): string => formatDateFor(iso, l),
    ...UI_COPY[l],
  };
}

export type Labels = ReturnType<typeof getLabels>;
