import { config } from 'dotenv';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';

config({ path: ['.env', '../../.env'] });

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is not defined');
}

const adapter = new PrismaPg({ connectionString: databaseUrl });
const prisma = new PrismaClient({ adapter });

async function seedSierra(): Promise<void> {
  const sierra = await prisma.hero.upsert({
    where: { codename: 'sierra' },
    update: {},
    create: {
      codename: 'sierra',
      name: '시에라',
      role: 'DAMAGE',
      releasedAt: new Date('2026-04-22T00:00:00Z'),
      portraitUrl: null,
      description:
        '오버워치 44번째 영웅. 정밀 사격에 특화된 저격 딜러로, 장거리 교전에서 빛을 발한다.',
      sourceUrl: 'https://namu.wiki/w/시에라(오버워치)',
      stat: {
        create: {
          health: 200,
          armor: 0,
          shield: 0,
          moveSpeed: 5.5,
          extras: { critMultiplier: 2.5 },
        },
      },
      abilities: {
        create: [
          {
            slot: 'PRIMARY',
            key: '좌클릭',
            name: '정밀 라이플',
            description: '장거리 저격용 라이플. 줌 시 헤드샷 배율 증가.',
            stats: { damage: 80, fireRate: 1.0, magazine: 6 },
            order: 0,
          },
          {
            slot: 'SECONDARY',
            key: '우클릭',
            name: '정조준',
            description: '확대경을 사용해 명중률을 높인다.',
            stats: { zoomLevel: 4.0 },
            order: 0,
          },
          {
            slot: 'ABILITY_1',
            key: 'Shift',
            name: '연막탄',
            description: '시야를 차단하는 연막을 투척한다.',
            stats: { duration: 5, radius: 6 },
            order: 0,
          },
          {
            slot: 'ABILITY_2',
            key: 'E',
            name: '회피 기동',
            description: '뒤로 빠르게 회피한다.',
            stats: { distance: 8, cooldown: 8 },
            order: 0,
          },
          {
            slot: 'ULTIMATE',
            key: 'Q',
            name: '퍼펙트 샷',
            description: '벽 너머의 적을 관통하는 한 발의 저격탄.',
            stats: { damage: 300, charges: 1 },
            order: 0,
          },
          {
            slot: 'PASSIVE',
            key: null,
            name: '집중',
            description: '정조준 상태에서 일정 시간 후 헤드샷 배율이 추가 증가한다.',
            stats: { activationTime: 1.5, bonusMultiplier: 0.5 },
            order: 0,
          },
        ],
      },
    },
  });

  console.log(`Seeded hero: ${sierra.codename} (id=${sierra.id})`);
}

seedSierra()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
