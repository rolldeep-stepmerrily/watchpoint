import { createHash, timingSafeEqual } from 'node:crypto';

/**
 * 길이가 다른 값도 timing-safe하게 비교하기 위해 SHA-256으로 정규화 후 비교.
 * 두 값의 길이 차이로 인한 timing oracle 및 조기 return 문제를 제거.
 *
 * @param {string} provided 사용자 입력 값
 * @param {string} expected 기대 값
 * @returns {boolean} 두 값이 동일하면 true
 */
export const safeEqualHashed = (provided: string, expected: string): boolean => {
  const providedHash = createHash('sha256').update(provided).digest();
  const expectedHash = createHash('sha256').update(expected).digest();

  return timingSafeEqual(providedHash, expectedHash);
};
