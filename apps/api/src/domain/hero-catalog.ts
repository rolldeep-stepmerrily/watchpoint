/**
 * 영웅 카탈로그는 web middleware의 codename 검증에서도 필요해 shared로 이동.
 * 이 shim은 기존 import 경로(`../domain/hero-catalog`)를 깨뜨리지 않기 위해 유지.
 */
export { HERO_CATALOG, HERO_CATALOG_BY_CODENAME, HERO_CODENAMES, type HeroCatalogEntry } from '@watchpoint/shared';
