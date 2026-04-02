/**
 * Subscription plans seed data.
 * These are the 4 pricing tiers for the Orde-X SaaS platform.
 */
export const SUBSCRIPTION_PLANS = [
  {
    name: 'Starter',
    priceEgp: 199,
    productLimit: 30,
    orderLimitMonthly: 200,
    features: {
      customDomain: false,
      analytics: 'basic',
      support: 'email',
      staff: 0,
    },
  },
  {
    name: 'Growth',
    priceEgp: 499,
    productLimit: 150,
    orderLimitMonthly: 1000,
    features: {
      customDomain: true,
      analytics: 'advanced',
      support: 'priority_email',
      staff: 2,
    },
  },
  {
    name: 'Pro',
    priceEgp: 999,
    productLimit: 500,
    orderLimitMonthly: 5000,
    features: {
      customDomain: true,
      analytics: 'advanced',
      support: 'chat',
      staff: 5,
    },
  },
  {
    name: 'Enterprise',
    priceEgp: 1999,
    productLimit: null,        // unlimited
    orderLimitMonthly: null,   // unlimited
    features: {
      customDomain: true,
      analytics: 'enterprise',
      support: 'dedicated',
      staff: null,             // unlimited
    },
  },
] as const;
