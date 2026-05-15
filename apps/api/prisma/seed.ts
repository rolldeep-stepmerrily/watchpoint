import { PrismaPg } from '@prisma/adapter-pg';
import { config } from 'dotenv';

import { HERO_CATALOG } from '../src/domain/hero-catalog';
import { PrismaClient } from '../src/generated/prisma/client';

config({ path: ['.env', '../../.env'] });

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is not defined');
}

const adapter = new PrismaPg({ connectionString: databaseUrl });
const prisma = new PrismaClient({ adapter });

async function seedCatalog(): Promise<{ created: number; updated: number }> {
  let created = 0;
  let updated = 0;

  for (const entry of HERO_CATALOG) {
    const existing = await prisma.hero.findUnique({ where: { codename: entry.codename } });
    const heroData = {
      name: entry.name,
      role: entry.role,
      releasedAt: new Date(`${entry.releasedAt}T00:00:00Z`),
      sourceUrl: `https://namu.wiki/w/${entry.pageTitle}`,
    };

    if (existing) {
      // 메타만 보정. 기존에 namuwiki sync로 채워진 portrait/description은 보존.
      await prisma.hero.update({
        where: { id: existing.id },
        data: {
          name: entry.name,
          role: entry.role,
          // releasedAt은 한 번만 설정 (덮어쓰지 않음)
        },
      });
      updated += 1;
    } else {
      await prisma.hero.create({
        data: { codename: entry.codename, ...heroData },
      });
      created += 1;
    }
  }

  return { created, updated };
}

async function seedSierraDetails(): Promise<void> {
  const sierra = await prisma.hero.findUnique({ where: { codename: 'sierra' } });
  if (!sierra) return;

  await prisma.hero.update({
    where: { id: sierra.id },
    data: {
      description:
        '오버워치 44번째 영웅. 정밀 사격에 특화된 저격 딜러로, 장거리 교전에서 빛을 발한다.',
    },
  });

  await prisma.heroStat.upsert({
    where: { heroId: sierra.id },
    update: {},
    create: {
      heroId: sierra.id,
      health: 200,
      armor: 0,
      shield: 0,
      moveSpeed: 5.5,
      extras: { critMultiplier: 2.5 },
    },
  });

  const existingAbilities = await prisma.heroAbility.count({ where: { heroId: sierra.id } });
  if (existingAbilities > 0) return;

  await prisma.heroAbility.createMany({
    data: [
      {
        heroId: sierra.id,
        slot: 'PRIMARY',
        key: '좌클릭',
        name: '정밀 라이플',
        description: '장거리 저격용 라이플. 줌 시 헤드샷 배율 증가.',
        stats: { damage: 80, fireRate: 1.0, magazine: 6 },
        order: 0,
      },
      {
        heroId: sierra.id,
        slot: 'SECONDARY',
        key: '우클릭',
        name: '정조준',
        description: '확대경을 사용해 명중률을 높인다.',
        stats: { zoomLevel: 4.0 },
        order: 0,
      },
      {
        heroId: sierra.id,
        slot: 'ABILITY_1',
        key: 'Shift',
        name: '연막탄',
        description: '시야를 차단하는 연막을 투척한다.',
        stats: { duration: 5, radius: 6 },
        order: 0,
      },
      {
        heroId: sierra.id,
        slot: 'ABILITY_2',
        key: 'E',
        name: '회피 기동',
        description: '뒤로 빠르게 회피한다.',
        stats: { distance: 8, cooldown: 8 },
        order: 0,
      },
      {
        heroId: sierra.id,
        slot: 'ULTIMATE',
        key: 'Q',
        name: '퍼펙트 샷',
        description: '벽 너머의 적을 관통하는 한 발의 저격탄.',
        stats: { damage: 300, charges: 1 },
        order: 0,
      },
      {
        heroId: sierra.id,
        slot: 'PASSIVE',
        key: null,
        name: '집중',
        description: '정조준 상태에서 일정 시간 후 헤드샷 배율이 추가 증가한다.',
        stats: { activationTime: 1.5, bonusMultiplier: 0.5 },
        order: 0,
      },
    ],
  });
}

async function main(): Promise<void> {
  const { created, updated } = await seedCatalog();
  console.log(`hero catalog seeded — created ${created}, updated ${updated}`);

  await seedSierraDetails();
  console.log('sierra detail seed (stat + abilities) ensured');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
