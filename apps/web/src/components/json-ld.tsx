import type { JsonLdValue } from '@/lib/seo';

interface JsonLdProps {
  data: JsonLdValue | JsonLdValue[];
}

/**
 * schema.org 구조화 데이터를 <script type="application/ld+json">으로 렌더 — </script> 인젝션 방지를 위해 < 이스케이프
 *
 * @param {JsonLdProps} props 구조화 데이터 객체 또는 배열
 * @returns {JSX.Element} 스크립트 태그
 */
export const JsonLd = ({ data }: JsonLdProps) => {
  const json = JSON.stringify(data).replace(/</g, '\\u003c');

  return (
    <script
      type="application/ld+json"
      // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD는 dangerouslySetInnerHTML가 사실상 유일한 방법. </script> 인젝션은 위에서 이스케이프 처리됨
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
};
