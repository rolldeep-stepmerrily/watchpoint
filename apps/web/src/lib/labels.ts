import type { AbilitySlot, CompetitiveTier, EntryCategory, HeroRole, Locale, PerkTier, Subrole } from '@@shared';

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
    career: string;
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
    spotlight: {
      kicker: string;
      changedHeroes: string;
      noChangedHeroes: string;
      viewPatch: string;
    };
    rolesHeading: string;
    rolesSubtitle: string;
    stats: {
      heroesLabel: string;
      patchesLabel: string;
      cronLabel: string;
      cronSub: string;
      sourceLabel: string;
      sourceSub: string;
    };
  };
  footer: {
    description: string;
    navHeading: string;
    sourcesHeading: string;
    sourcePatchNotes: string;
    sourceHeroes: string;
    sourceGithub: string;
    disclaimer: string;
  };
  auth: {
    login: string;
    signup: string;
    logout: string;
    profile: string;
    email: string;
    password: string;
    name: string;
    nameOptional: string;
    passwordHint: string;
    submitLogin: string;
    submitSignup: string;
    noAccount: string;
    haveAccount: string;
    githubLogin: string;
    or: string;
    loginTitle: string;
    signupTitle: string;
    loading: string;
    errors: {
      emailInUse: string;
      invalidCredentials: string;
      validation: string;
      network: string;
      generic: string;
      wrongPassword: string;
      samePassword: string;
      noPassword: string;
    };
  };
  profile: {
    title: string;
    profileSection: string;
    nameLabel: string;
    avatarUrlLabel: string;
    avatarUrlHint: string;
    saveProfile: string;
    saved: string;
    passwordSection: string;
    currentPassword: string;
    newPassword: string;
    changePassword: string;
    passwordChanged: string;
    oauthOnlyHint: string;
    joinedAt: (iso: string) => string;
    accountSection: string;
    bookmarks: {
      heroSection: string;
      playerSection: string;
      emptyHero: string;
      emptyPlayer: string;
      addLabel: string;
      removeLabel: string;
      removeEntryAria: (name: string) => string;
      limitReached: (n: number) => string;
    };
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
  career: {
    title: string;
    description: string;
    betaLabel: string;
    betaTooltip: string;
    searchPlaceholder: string;
    searchHelp: string;
    searchSubmit: string;
    searchEmpty: string;
    noResults: (q: string) => string;
    resultsHeading: (count: number) => string;
    privacyGuide: {
      heading: string;
      body: string;
      steps: readonly string[];
      blizzardLinkLabel: string;
      blizzardLinkHref: string;
    };
    disclaimer: string;
    tierLabels: Record<CompetitiveTier, string>;
    division: (n: number) => string;
    unranked: string;
    platform: {
      pc: string;
      console: string;
      noData: string;
    };
    detail: {
      backToSearch: string;
      endorsement: string;
      battleTag: string;
      competitiveHeading: string;
      notFound: {
        kicker: string;
        heading: string;
        body: string;
        cta: string;
      };
      private: {
        kicker: string;
        heading: string;
        body: string;
        cta: string;
      };
    };
    upstreamError: {
      kicker: string;
      heading: string;
      body: string;
      cta: string;
    };
    stats: {
      heading: string;
      viewStats: string;
      backToSummary: string;
      noData: string;
      generalHeading: string;
      rolesHeading: string;
      heroesHeading: string;
      hoursPlayed: (h: number) => string;
      gamesPlayed: string;
      winrate: string;
      kda: string;
      hero: string;
      timePlayed: string;
      eliminations: string;
      assists: string;
      deaths: string;
      damage: string;
      healing: string;
      sortAscAria: (col: string) => string;
      sortDescAria: (col: string) => string;
    };
    favorites: {
      heading: string;
      empty: string;
      addLabel: string;
      removeLabel: string;
      addedAria: (name: string) => string;
      removedAria: (name: string) => string;
      removeEntryAria: (name: string) => string;
      limitReached: (n: number) => string;
    };
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
      career: '전적',
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
      footerAttribution:
        '데이터 출처: Blizzard 공식 패치노트 / Blizzard 공식 영웅 정보 / 나무위키 (CC BY-NC-SA 2.0 KR)',
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
      spotlight: {
        kicker: '최신 패치',
        changedHeroes: '이번 패치에서 변경된 영웅',
        noChangedHeroes: '이번 패치에는 영웅 변경 사항이 없습니다.',
        viewPatch: '패치 전체 보기 →',
      },
      rolesHeading: '역할별 영웅',
      rolesSubtitle: '돌격 · 공격 · 지원',
      stats: {
        heroesLabel: '등록된 영웅',
        patchesLabel: '공개 패치노트',
        cronLabel: '자동 수집',
        cronSub: 'cron 주기',
        sourceLabel: '데이터',
        sourceSub: '공식 출처',
      },
    },
    footer: {
      description: '오버워치 패치노트와 영웅 능력 수치를 한곳에서 추적하는 비공식 팬 사이트.',
      navHeading: '탐색',
      sourcesHeading: '데이터 출처',
      sourcePatchNotes: 'Blizzard 공식 패치노트',
      sourceHeroes: 'Blizzard 공식 영웅 정보',
      sourceGithub: 'GitHub',
      disclaimer: '본 사이트는 Blizzard Entertainment와 무관한 팬 프로젝트입니다.',
    },
    auth: {
      login: '로그인',
      signup: '회원가입',
      logout: '로그아웃',
      profile: '내 프로필',
      email: '이메일',
      password: '비밀번호',
      name: '이름',
      nameOptional: '이름 (선택)',
      passwordHint: '영문/숫자/특수문자 포함 8자 이상',
      submitLogin: '로그인',
      submitSignup: '계정 만들기',
      noAccount: '계정이 없으신가요?',
      haveAccount: '이미 계정이 있으신가요?',
      githubLogin: 'GitHub로 계속하기',
      or: '또는',
      loginTitle: '로그인',
      signupTitle: '회원가입',
      loading: '처리 중…',
      errors: {
        emailInUse: '이미 사용 중인 이메일입니다.',
        invalidCredentials: '이메일 또는 비밀번호가 올바르지 않습니다.',
        validation: '입력값을 확인해주세요.',
        network: '네트워크 오류가 발생했습니다.',
        generic: '문제가 발생했습니다. 잠시 후 다시 시도해주세요.',
        wrongPassword: '현재 비밀번호가 올바르지 않습니다.',
        samePassword: '새 비밀번호가 현재 비밀번호와 동일합니다.',
        noPassword: '비밀번호 로그인을 사용하지 않는 계정입니다.',
      },
    },
    profile: {
      title: '내 정보',
      profileSection: '프로필',
      nameLabel: '이름',
      avatarUrlLabel: '아바타 URL',
      avatarUrlHint: '비워두면 이메일 첫 글자가 표시됩니다.',
      saveProfile: '저장',
      saved: '저장되었습니다.',
      passwordSection: '비밀번호 변경',
      currentPassword: '현재 비밀번호',
      newPassword: '새 비밀번호',
      changePassword: '비밀번호 변경',
      passwordChanged: '비밀번호가 변경되었습니다.',
      oauthOnlyHint: 'GitHub 계정으로 가입한 회원은 비밀번호 로그인을 사용하지 않습니다.',
      joinedAt: (iso) => `가입일: ${new Intl.DateTimeFormat('ko-KR', { dateStyle: 'long' }).format(new Date(iso))}`,
      accountSection: '계정',
      bookmarks: {
        heroSection: '북마크한 영웅',
        playerSection: '북마크한 플레이어',
        emptyHero: '영웅 상세 페이지의 별 아이콘으로 북마크를 추가해 보세요.',
        emptyPlayer: '전적조회 결과 페이지에서 별 아이콘으로 자주 보는 플레이어를 저장해 보세요.',
        addLabel: '북마크 추가',
        removeLabel: '북마크 제거',
        removeEntryAria: (name) => `${name} 북마크 제거`,
        limitReached: (n) => `북마크는 최대 ${n}개까지 저장할 수 있습니다.`,
      },
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
    career: {
      title: '전적 검색',
      description: '오버워치 플레이어의 프로필과 경쟁전 랭크를 조회합니다.',
      betaLabel: 'Beta',
      betaTooltip:
        '데이터 제공: OverFast API (비공식 Overwatch 데이터). 블리자드 페이지 구조 변경 시 일시적으로 깨질 수 있습니다.',
      searchPlaceholder: 'BattleTag 또는 이름 (예: TeKrop)',
      searchHelp: 'BattleTag 입력 시 # 대신 그대로 입력하세요. 예: TeKrop#2217',
      searchSubmit: '검색',
      searchEmpty: '검색어를 입력하면 결과가 표시됩니다.',
      noResults: (q) => `"${q}"에 해당하는 플레이어를 찾을 수 없습니다.`,
      resultsHeading: (count) => `검색 결과 (${count})`,
      privacyGuide: {
        heading: '내 전적이 안 보이나요?',
        body: '오버워치는 기본적으로 프로필이 비공개입니다. 게임 내에서 다음 순서로 공개 설정을 변경해야 데이터를 조회할 수 있습니다.',
        steps: [
          '게임 클라이언트에서 메뉴 → 옵션 → 소셜로 이동',
          '"경력 프로필 공개" 항목을 "공개"로 변경',
          '저장 후 몇 분 뒤 이 페이지에서 다시 검색',
        ],
        blizzardLinkLabel: 'Blizzard 공식 안내 →',
        blizzardLinkHref: 'https://us.support.blizzard.com/article/301983',
      },
      disclaimer:
        '본 기능은 베타입니다. 데이터는 비공식 OverFast API를 통해 제공되며 Blizzard 페이지 구조 변경 시 일시적으로 응답하지 않을 수 있습니다.',
      tierLabels: {
        bronze: '브론즈',
        silver: '실버',
        gold: '골드',
        platinum: '플래티넘',
        diamond: '다이아몬드',
        master: '마스터',
        grandmaster: '그랜드마스터',
        champion: '챔피언',
        ultimate: '얼티밋',
      },
      division: (n) => `${n} 단계`,
      unranked: '랭크 없음',
      platform: {
        pc: 'PC',
        console: '콘솔',
        noData: '랭크 데이터 없음',
      },
      detail: {
        backToSearch: '← 다시 검색하기',
        endorsement: '추천',
        battleTag: 'BattleTag',
        competitiveHeading: '경쟁전 랭크',
        notFound: {
          kicker: '404 · Career',
          heading: '해당 플레이어를 찾을 수 없어요.',
          body: 'playerId가 잘못됐거나, 프로필이 비공개 상태일 수 있어요. 게임 내에서 "경력 프로필 공개"를 "공개"로 설정해주세요.',
          cta: '검색으로 돌아가기',
        },
        private: {
          kicker: 'Private',
          heading: '비공개 프로필입니다.',
          body: '플레이어가 프로필을 비공개로 설정해 데이터를 조회할 수 없습니다.',
          cta: '검색으로 돌아가기',
        },
      },
      upstreamError: {
        kicker: 'Upstream',
        heading: '잠시 후 다시 시도해 주세요.',
        body: '전적 조회 서비스(OverFast API)가 일시적으로 응답하지 않습니다. 베타 기능 특성상 발생할 수 있는 현상입니다.',
        cta: '검색으로 돌아가기',
      },
      stats: {
        heading: '통계',
        viewStats: '통계 보기 →',
        backToSummary: '← 프로필 요약으로',
        noData: '통계 데이터가 없습니다.',
        generalHeading: '전체',
        rolesHeading: '역할별',
        heroesHeading: '영웅별',
        hoursPlayed: (h) => `${h.toFixed(1)}시간`,
        gamesPlayed: '게임 수',
        winrate: '승률',
        kda: 'KDA',
        hero: '영웅',
        timePlayed: '플레이타임',
        eliminations: '처치',
        assists: '어시스트',
        deaths: '죽음',
        damage: '피해량',
        healing: '치유량',
        sortAscAria: (col) => `${col} 오름차순 정렬`,
        sortDescAria: (col) => `${col} 내림차순 정렬`,
      },
      favorites: {
        heading: '즐겨찾는 플레이어',
        empty: '검색 후 별 아이콘으로 자주 보는 플레이어를 저장해 보세요.',
        addLabel: '즐겨찾기에 추가',
        removeLabel: '즐겨찾기에서 제거',
        addedAria: (name) => `${name}을(를) 즐겨찾기에 추가했습니다.`,
        removedAria: (name) => `${name}을(를) 즐겨찾기에서 제거했습니다.`,
        removeEntryAria: (name) => `${name} 제거`,
        limitReached: (n) => `즐겨찾기는 최대 ${n}명까지 저장할 수 있습니다.`,
      },
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
      career: 'Career',
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
      footerAttribution:
        'Sources: Blizzard official patch notes / Blizzard official hero info / Namuwiki (CC BY-NC-SA 2.0 KR)',
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
      spotlight: {
        kicker: 'Latest patch',
        changedHeroes: 'Heroes changed in this patch',
        noChangedHeroes: 'No hero changes in this patch.',
        viewPatch: 'View full patch →',
      },
      rolesHeading: 'Heroes by role',
      rolesSubtitle: 'Tank · Damage · Support',
      stats: {
        heroesLabel: 'Registered heroes',
        patchesLabel: 'Published patch notes',
        cronLabel: 'Auto-sync',
        cronSub: 'cron interval',
        sourceLabel: 'Data',
        sourceSub: 'official source',
      },
    },
    footer: {
      description: 'Unofficial fan site tracking Overwatch patch notes and hero ability stats in one place.',
      navHeading: 'Navigate',
      sourcesHeading: 'Data sources',
      sourcePatchNotes: 'Blizzard official patch notes',
      sourceHeroes: 'Blizzard official hero info',
      sourceGithub: 'GitHub',
      disclaimer: 'This site is not affiliated with Blizzard Entertainment.',
    },
    auth: {
      login: 'Sign in',
      signup: 'Sign up',
      logout: 'Sign out',
      profile: 'My profile',
      email: 'Email',
      password: 'Password',
      name: 'Name',
      nameOptional: 'Name (optional)',
      passwordHint: 'At least 8 chars, with letter, number, and symbol',
      submitLogin: 'Sign in',
      submitSignup: 'Create account',
      noAccount: "Don't have an account?",
      haveAccount: 'Already have an account?',
      githubLogin: 'Continue with GitHub',
      or: 'or',
      loginTitle: 'Sign in',
      signupTitle: 'Sign up',
      loading: 'Working…',
      errors: {
        emailInUse: 'That email is already in use.',
        invalidCredentials: 'Email or password is incorrect.',
        validation: 'Please check your input.',
        network: 'Network error.',
        generic: 'Something went wrong. Please try again.',
        wrongPassword: 'Current password is incorrect.',
        samePassword: 'New password must differ from the current one.',
        noPassword: 'This account does not use password sign-in.',
      },
    },
    profile: {
      title: 'My Account',
      profileSection: 'Profile',
      nameLabel: 'Name',
      avatarUrlLabel: 'Avatar URL',
      avatarUrlHint: 'Leave blank to show the email initial.',
      saveProfile: 'Save',
      saved: 'Saved.',
      passwordSection: 'Change Password',
      currentPassword: 'Current password',
      newPassword: 'New password',
      changePassword: 'Change password',
      passwordChanged: 'Password updated.',
      oauthOnlyHint: 'GitHub-only accounts do not use password sign-in.',
      joinedAt: (iso) => `Joined ${new Intl.DateTimeFormat('en-US', { dateStyle: 'long' }).format(new Date(iso))}`,
      accountSection: 'Account',
      bookmarks: {
        heroSection: 'Bookmarked heroes',
        playerSection: 'Bookmarked players',
        emptyHero: 'Tap the star icon on any hero page to add a bookmark.',
        emptyPlayer: 'Star players in career search results to save them here.',
        addLabel: 'Add bookmark',
        removeLabel: 'Remove bookmark',
        removeEntryAria: (name) => `Remove ${name}`,
        limitReached: (n) => `You can save up to ${n} bookmarks.`,
      },
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
    career: {
      title: 'Career Lookup',
      description: 'Look up Overwatch player profiles and competitive ranks.',
      betaLabel: 'Beta',
      betaTooltip:
        'Powered by OverFast API (unofficial Overwatch data). May break temporarily when Blizzard updates pages.',
      searchPlaceholder: 'BattleTag or name (e.g. TeKrop)',
      searchHelp: 'For BattleTags, type as-is — replace # is not required. e.g. TeKrop#2217',
      searchSubmit: 'Search',
      searchEmpty: 'Enter a query to see results.',
      noResults: (q) => `No players found for "${q}".`,
      resultsHeading: (count) => `Results (${count})`,
      privacyGuide: {
        heading: "Can't find your career?",
        body: 'Overwatch profiles are private by default. In-game, follow these steps to make your career visible:',
        steps: [
          'Open the in-game menu → Options → Social',
          'Change "Career Profile Visibility" to "Public"',
          'Save, then search again here in a few minutes',
        ],
        blizzardLinkLabel: 'Blizzard official guide →',
        blizzardLinkHref: 'https://us.support.blizzard.com/article/301983',
      },
      disclaimer:
        'This feature is in beta. Data is provided via the unofficial OverFast API and may be unavailable when Blizzard updates the source pages.',
      tierLabels: {
        bronze: 'Bronze',
        silver: 'Silver',
        gold: 'Gold',
        platinum: 'Platinum',
        diamond: 'Diamond',
        master: 'Master',
        grandmaster: 'Grandmaster',
        champion: 'Champion',
        ultimate: 'Ultimate',
      },
      division: (n) => `Div ${n}`,
      unranked: 'Unranked',
      platform: {
        pc: 'PC',
        console: 'Console',
        noData: 'No rank data',
      },
      detail: {
        backToSearch: '← Back to search',
        endorsement: 'Endorsement',
        battleTag: 'BattleTag',
        competitiveHeading: 'Competitive Ranks',
        notFound: {
          kicker: '404 · Career',
          heading: "We couldn't find that player.",
          body: 'The playerId may be invalid, or the profile is private. In-game, set "Career Profile Visibility" to "Public".',
          cta: 'Back to search',
        },
        private: {
          kicker: 'Private',
          heading: 'This profile is private.',
          body: 'The player has set their profile to private, so we cannot show their data.',
          cta: 'Back to search',
        },
      },
      upstreamError: {
        kicker: 'Upstream',
        heading: 'Please try again shortly.',
        body: 'The career lookup service (OverFast API) is temporarily unavailable. This can happen as the feature is in beta.',
        cta: 'Back to search',
      },
      stats: {
        heading: 'Stats',
        viewStats: 'View stats →',
        backToSummary: '← Back to summary',
        noData: 'No stats data available.',
        generalHeading: 'All',
        rolesHeading: 'By Role',
        heroesHeading: 'By Hero',
        hoursPlayed: (h) => `${h.toFixed(1)}h`,
        gamesPlayed: 'Games',
        winrate: 'Win %',
        kda: 'KDA',
        hero: 'Hero',
        timePlayed: 'Time',
        eliminations: 'Elims',
        assists: 'Assists',
        deaths: 'Deaths',
        damage: 'Damage',
        healing: 'Healing',
        sortAscAria: (col) => `Sort ${col} ascending`,
        sortDescAria: (col) => `Sort ${col} descending`,
      },
      favorites: {
        heading: 'Favorite players',
        empty: 'Search for a player and tap the star to save them here.',
        addLabel: 'Add to favorites',
        removeLabel: 'Remove from favorites',
        addedAria: (name) => `${name} added to favorites.`,
        removedAria: (name) => `${name} removed from favorites.`,
        removeEntryAria: (name) => `Remove ${name}`,
        limitReached: (n) => `You can save up to ${n} favorite players.`,
      },
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
