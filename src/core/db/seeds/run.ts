/**
 * Seed runner — runs all seed scripts in order.
 * Run with: npm run seed
 *
 * Idempotent: uses upsert so it can be run multiple times safely.
 */
import prisma from '../../database/prisma.client';
import { SUBSCRIPTION_PLANS } from './plans';

const seed = async (): Promise<void> => {
  console.info('🌱  Starting database seed...\n');

  // ── Subscription Plans ──────────────────────────────────────────────────────
  console.info('  Seeding subscription plans...');
  for (const plan of SUBSCRIPTION_PLANS) {
    await prisma.subscriptionPlan.upsert({
      where: { name: plan.name } as never, // name is unique enough for seeding
      update: {
        priceEgp: plan.priceEgp,
        productLimit: plan.productLimit ?? null,
        orderLimitMonthly: plan.orderLimitMonthly ?? null,
        features: plan.features as object,
      },
      create: {
        name: plan.name,
        priceEgp: plan.priceEgp,
        productLimit: plan.productLimit ?? null,
        orderLimitMonthly: plan.orderLimitMonthly ?? null,
        features: plan.features as object,
      },
    });
    console.info(`    ✓ ${plan.name} plan`);
  }

  console.info('\n  Seed complete!\n');
  console.info('  Note: Delivery zones are batch-inserted per vendor on registration.');
  console.info('  Governorate list is in src/db/seeds/governorates.ts\n');
};

seed()
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
