/**
 * JSON translations 필드(예: `{ ko: '...', en: '...' }`)에 locale 키를 병합한 새 객체 반환.
 * current가 객체가 아니면 빈 객체에서 시작.
 *
 * @param {unknown} current 기존 translations (Prisma JsonValue 또는 null)
 * @param {string} locale 추가/갱신할 로케일 키
 * @param {string} value 값
 * @returns {Record<string, string>} 병합된 translations
 */
export function mergeTranslation(current: unknown, locale: string, value: string): Record<string, string> {
  const base = current && typeof current === 'object' ? (current as Record<string, string>) : {};
  return { ...base, [locale]: value };
}
