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
};
