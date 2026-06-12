import { DEFAULT_LOCALE } from '@@shared';
import { redirect } from 'next/navigation';

/**
 * `/`는 default locale로 영구 redirect — middleware가 unprefixed entry를 잡지만, 직접 라우트가 그대로 hit되는
 * 케이스(예: 미들웨어 미동작 환경)에 대한 안전망.
 */
export default function RootPage(): never {
  redirect(`/${DEFAULT_LOCALE}`);
}
