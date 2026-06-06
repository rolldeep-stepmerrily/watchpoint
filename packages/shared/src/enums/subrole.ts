/**
 * 2026-02 Reign of Talon 시즌 1에서 도입된 서브 역할군 패시브 식별자.
 * 정식 영문 식별자를 DB에 저장. 한국어 라벨/패시브 설명은 표시 계층(웹)에서 매핑.
 *
 * - TANK: Bruiser/Initiator/Stalwart
 * - DAMAGE: Sharpshooter/Flanker/Specialist/Recon
 * - SUPPORT: Tactician/Medic/Survivor
 */
export type Subrole =
  | 'Bruiser'
  | 'Initiator'
  | 'Stalwart'
  | 'Sharpshooter'
  | 'Flanker'
  | 'Specialist'
  | 'Recon'
  | 'Tactician'
  | 'Medic'
  | 'Survivor';

export const SUBROLES = [
  'Bruiser',
  'Initiator',
  'Stalwart',
  'Sharpshooter',
  'Flanker',
  'Specialist',
  'Recon',
  'Tactician',
  'Medic',
  'Survivor',
] as const satisfies readonly Subrole[];

/**
 * 주어진 값이 유효한 Subrole 식별자(Bruiser/Sharpshooter 등)인지 검증
 *
 * @param {unknown} value 검증할 값
 * @returns {boolean} Subrole로 안전하게 좁힐 수 있으면 true
 */
export const isSubrole = (value: unknown): value is Subrole => {
  return typeof value === 'string' && (SUBROLES as readonly string[]).includes(value);
};
