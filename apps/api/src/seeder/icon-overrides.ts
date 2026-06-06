import type { AbilitySlot } from '@@prisma';

/**
 * Blizzard 영문 페이지의 ability id → DB AbilitySlot 매핑.
 *
 * - 값이 AbilitySlot 하나면 해당 slot의 첫 번째 빈 ability(order asc)에 매핑
 * - 값이 AbilitySlot[]이면 각 slot에 동일 parsed icon을 모두 매핑 (예: 무기 1개로 PRIMARY+SECONDARY 통합)
 * - 같은 slot에 여러 parsed id가 있으면 등장 순서대로 order 0, 1, ...에 채움
 * - 매핑이 없는 parsed id는 무시
 * - matcher fallback(drop-last 등)으로도 잘못 매칭될 영웅(PASSIVE/ULT 위치 비일관 등)은 여기 등록 권장
 */
export const ABILITY_ID_TO_SLOT: Record<string, Partial<Record<string, AbilitySlot | AbilitySlot[]>>> = {
  'd-va': {
    'fusion-cannons': 'PRIMARY',
    'micro-missiles': 'SECONDARY',
    boosters: 'ABILITY_1',
    'defense-matrix': 'ABILITY_2',
    'self-destruct': 'ULTIMATE',
    'call-mech': 'PASSIVE',
  },
  echo: {
    'tri-shot': 'PRIMARY',
    'sticky-bombs': 'SECONDARY',
    'focusing-beam': 'ABILITY_1',
    flight: 'ABILITY_2',
    duplicate: 'ULTIMATE',
    glide: 'PASSIVE',
  },
  hazard: {
    bonespur: 'PRIMARY',
    'spike-guard': 'SECONDARY',
    'violent-leap': 'ABILITY_1',
    'jagged-wall': 'ABILITY_2',
    downpour: 'ULTIMATE',
  },
  juno: {
    mediblaster: 'PRIMARY',
    'pulsar-torpedoes': 'SECONDARY',
    'glide-boost': 'ABILITY_1',
    'hyper-ring': 'ABILITY_2',
    'orbital-ray': 'ULTIMATE',
    'martian-overboots': 'PASSIVE',
  },
  lifeweaver: {
    'healing-blossom': 'PRIMARY',
    'thorn-volley': 'SECONDARY',
    'petal-platform': 'ABILITY_1',
    'life-grip': 'ABILITY_2',
    'tree-of-life': 'ULTIMATE',
    'rejuvenating-dash': 'PASSIVE',
  },
  lucio: {
    'sonic-amplifier': 'PRIMARY',
    soundwave: 'SECONDARY',
    crossfade: 'ABILITY_1',
    'amp-it-up': 'ABILITY_2',
    'sound-barrier': 'ULTIMATE',
    'wall-ride': 'PASSIVE',
  },
  mercy: {
    'caduceus-staff': 'PRIMARY',
    'caduceus-blaster': 'SECONDARY',
    'guardian-angel': 'ABILITY_1',
    resurrect: 'ABILITY_2',
    valkyrie: 'ULTIMATE',
    'angelic-descent': 'PASSIVE',
  },
  pharah: {
    'rocket-launcher': 'PRIMARY',
    'jump-jet': 'ABILITY_1',
    'concussive-blast': 'ABILITY_2',
    barrage: 'ULTIMATE',
    'hover-jets': 'PASSIVE',
  },
  reaper: {
    'hellfire-shotguns': 'PRIMARY',
    'wraith-form': 'ABILITY_1',
    'shadow-step': 'ABILITY_2',
    'death-blossom': 'ULTIMATE',
    'the-reaping': 'PASSIVE',
  },
  'wrecking-ball': {
    'quad-cannons': 'PRIMARY',
    piledriver: 'SECONDARY',
    'grappling-claw': 'ABILITY_1',
    'adaptive-shield': 'ABILITY_2',
    minefield: 'ULTIMATE',
    roll: 'PASSIVE',
  },
  hanzo: {
    'storm-bow': 'PRIMARY',
    'sonic-arrow': 'ABILITY_1',
    lunge: 'ABILITY_1',
    'storm-arrows': 'ABILITY_2',
    dragonstrike: 'ULTIMATE',
    'wall-climb': 'PASSIVE',
  },
  brigitte: {
    'rocket-flail': 'PRIMARY',
    'barrier-shield': 'SECONDARY',
    'shield-bash': 'ABILITY_1',
    'whip-shot': 'ABILITY_1',
    'repair-pack': 'ABILITY_2',
    rally: 'ULTIMATE',
    inspire: 'PASSIVE',
  },
  moira: {
    'biotic-grasp': ['PRIMARY', 'SECONDARY'],
    'biotic-orb': ['ABILITY_1', 'ABILITY_2'],
    fade: 'ABILITY_1',
    coalescence: 'ULTIMATE',
  },
  cassidy: {
    peacekeeper: 'PRIMARY',
    'combat-roll': 'ABILITY_1',
    deadeye: 'ULTIMATE',
  },
  ana: {
    'biotic-rifle': ['PRIMARY', 'SECONDARY'],
    'sleep-dart': 'ABILITY_1',
    'biotic-grenade': 'ABILITY_2',
    'nano-boost': 'ULTIMATE',
  },
  ashe: {
    'the-viper': ['PRIMARY', 'SECONDARY'],
    'coach-gun': 'ABILITY_1',
    dynamite: 'ABILITY_2',
    bob: 'ULTIMATE',
  },
  baptiste: {
    'biotic-launcher': ['PRIMARY', 'SECONDARY'],
    'regenerative-burst': 'ABILITY_1',
    'immortality-field': 'ABILITY_2',
    'amplification-matrix': 'ULTIMATE',
    'exo-boots': 'PASSIVE',
  },
  // NOTE: PASSIVE는 Blizzard 페이지에 카드 없음. reconfigure는 모드 전환 능력 (DB ABILITY_2의 "재설정")으로 확인됨.
  bastion: {
    'configuration-recon': 'PRIMARY',
    'a-36-tactical-grenade': 'SECONDARY',
    'configuration-assault': 'ABILITY_1',
    reconfigure: 'ABILITY_2',
    'configuration-artillery': 'ULTIMATE',
  },
  doomfist: {
    'hand-cannon': 'PRIMARY',
    'rocket-punch': 'SECONDARY',
    'seismic-slam': 'ABILITY_1',
    'power-block': 'ABILITY_2',
    'meteor-strike': 'ULTIMATE',
  },
  // NOTE: Freja PRIMARY(석궁)는 Blizzard 페이지에 카드 없음 — ko sync는 매핑된 slot만 upsert하고
  // PRIMARY는 시드 데이터 그대로 보존한다.
  freja: {
    'take-aim': 'SECONDARY',
    updraft: 'ABILITY_1',
    'quick-dash': 'ABILITY_2',
    'bola-shot': 'ULTIMATE',
  },
  genji: {
    shuriken: ['PRIMARY', 'SECONDARY'],
    'swift-strike': 'ABILITY_1',
    deflect: 'ABILITY_2',
    dragonblade: 'ULTIMATE',
    'cyber-agility': 'PASSIVE',
  },
  illari: {
    'solar-rifle': ['PRIMARY', 'SECONDARY'],
    outburst: 'ABILITY_1',
    'healing-pylon': 'ABILITY_2',
    'captive-sun': 'ULTIMATE',
  },
  // NOTE: SECONDARY 재기드 블레이드(jagged-blade)는 Blizzard 페이지에 카드 없음 — 매핑 누락.
  'junker-queen': {
    scattergun: 'PRIMARY',
    carnage: 'ABILITY_1',
    'commanding-shout': 'ABILITY_2',
    rampage: 'ULTIMATE',
    'adrenaline-rush': 'PASSIVE',
  },
  junkrat: {
    'frag-launcher': 'PRIMARY',
    'concussion-mine': 'ABILITY_1',
    'steel-trap': 'ABILITY_2',
    'rip-tire': 'ULTIMATE',
    'total-mayhem': 'PASSIVE',
  },
  kiriko: {
    kunai: 'PRIMARY',
    'healing-ofuda': 'SECONDARY',
    'protection-suzu': 'ABILITY_1',
    'swift-step': 'ABILITY_2',
    'kitsune-rush': 'ULTIMATE',
  },
  // NOTE: PRIMARY 간 톰 / SECONDARY 쿠앙 머는 Blizzard 페이지에 무기 카드 없음 — 매핑 누락.
  mauga: {
    overrun: 'ABILITY_1',
    'cardiac-overdrive': 'ABILITY_2',
    'cage-fight': 'ULTIMATE',
    berserker: 'PASSIVE',
  },
  mei: {
    'endothermic-blaster': ['PRIMARY', 'SECONDARY'],
    'cryo-freeze': 'ABILITY_1',
    'ice-wall': 'ABILITY_2',
    blizzard: 'ULTIMATE',
  },
  orisa: {
    'augmented-fusion-driver': 'PRIMARY',
    'energy-javelin': 'SECONDARY',
    fortify: 'ABILITY_1',
    'javelin-spin': 'ABILITY_2',
    'terra-surge': 'ULTIMATE',
  },
  ramattra: {
    'void-accelerator-omnic-form': 'PRIMARY',
    'void-barrier-omnic-form': 'SECONDARY',
    'pummel-nemesis-form': 'ABILITY_1',
    'ravenous-vortex': 'ABILITY_2',
    annihilation: 'ULTIMATE',
  },
  reinhardt: {
    'rocket-hammer': 'PRIMARY',
    'fire-strike': 'SECONDARY',
    charge: 'ABILITY_1',
    'barrier-field': 'ABILITY_2',
    earthshatter: 'ULTIMATE',
  },
  roadhog: {
    'scrap-gun': ['PRIMARY', 'SECONDARY'],
    'chain-hook': 'ABILITY_1',
    'take-a-breather': 'ABILITY_2',
    'whole-hog': 'ULTIMATE',
  },
  // NOTE: Sierra(신영웅) — tracking-shot/tremor-charge/anchor-drone/trailblazer 의미 미확정.
  // 영문 카드 5개를 DB matchable 5개에 1:1로 추정 매핑. 사용자 검수 필수.
  sierra: {
    'helix-rifle': ['PRIMARY', 'SECONDARY'],
    'tracking-shot': 'ABILITY_1',
    'tremor-charge': 'ABILITY_2',
    'anchor-drone': 'ULTIMATE',
    trailblazer: 'PASSIVE',
  },
  sigma: {
    hyperspheres: 'PRIMARY',
    'experimental-barrier': 'SECONDARY',
    'kinetic-grasp': 'ABILITY_1',
    accretion: 'ABILITY_2',
    'gravitic-flux': 'ULTIMATE',
  },
  sojourn: {
    railgun: ['PRIMARY', 'SECONDARY'],
    'power-slide': 'ABILITY_1',
    'disruptor-shot': 'ABILITY_2',
    overclock: 'ULTIMATE',
  },
  'soldier-76': {
    'heavy-pulse-rifle': 'PRIMARY',
    'helix-rockets': 'SECONDARY',
    sprint: 'ABILITY_1',
    'biotic-field': 'ABILITY_2',
    'tactical-visor': 'ULTIMATE',
  },
  sombra: {
    'machine-pistol': 'PRIMARY',
    virus: 'SECONDARY',
    translocator: 'ABILITY_1',
    hack: 'ABILITY_2',
    emp: 'ULTIMATE',
  },
  symmetra: {
    'photon-projector': ['PRIMARY', 'SECONDARY'],
    'sentry-turret': 'ABILITY_1',
    teleporter: 'ABILITY_2',
    'photon-barrier': 'ULTIMATE',
  },
  // NOTE: forge-hammer(단조 망치)는 DB에 매핑 없어 무시. SECONDARY는 리벳건의 보조사격(통합).
  torbjorn: {
    'rivet-gun': ['PRIMARY', 'SECONDARY'],
    'deploy-turret': 'ABILITY_1',
    overload: 'ABILITY_2',
    'molten-core': 'ULTIMATE',
  },
  tracer: {
    'pulse-pistols': 'PRIMARY',
    blink: 'ABILITY_1',
    recall: 'ABILITY_2',
    'pulse-bomb': 'ULTIMATE',
  },
  venture: {
    'smart-excavator': 'PRIMARY',
    'drill-dash': 'ABILITY_1',
    burrow: 'ABILITY_2',
    'tectonic-shock': 'ULTIMATE',
  },
  widowmaker: {
    'widows-kiss': ['PRIMARY', 'SECONDARY'],
    'grappling-hook': 'ABILITY_1',
    'venom-mine': 'ABILITY_2',
    'infra-sight': 'ULTIMATE',
  },
  winston: {
    'tesla-cannon': ['PRIMARY', 'SECONDARY'],
    'jump-pack': 'ABILITY_1',
    'barrier-projector': 'ABILITY_2',
    'primal-rage': 'ULTIMATE',
  },
  zarya: {
    'particle-cannon': ['PRIMARY', 'SECONDARY'],
    'particle-barrier': 'ABILITY_1',
    'projected-barrier': 'ABILITY_2',
    'graviton-surge': 'ULTIMATE',
    energy: 'PASSIVE',
  },
  zenyatta: {
    'orb-of-destruction': ['PRIMARY', 'SECONDARY'],
    'orb-of-harmony': 'ABILITY_1',
    'orb-of-discord': 'ABILITY_2',
    transcendence: 'ULTIMATE',
    'snap-kick': 'PASSIVE',
  },
};
