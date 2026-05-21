import { PrismaPg } from '@prisma/adapter-pg';
import { config } from 'dotenv';

import { HERO_CATALOG } from '../src/domain/hero-catalog';
import { PrismaClient } from '../src/generated/prisma/client';
import { applyHeroDetailSeeds } from './seeds/hero-details';

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
      await prisma.hero.update({
        where: { id: existing.id },
        data: {
          name: entry.name,
          role: entry.role,
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

async function main(): Promise<void> {
  const { created, updated } = await seedCatalog();
  console.log(`hero catalog seeded — created ${created}, updated ${updated}`);

  const { stat, abilities } = await applyHeroDetailSeeds(prisma);
  console.log(`hero details seeded — stat upserts ${stat}, abilities inserted ${abilities}`);
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
