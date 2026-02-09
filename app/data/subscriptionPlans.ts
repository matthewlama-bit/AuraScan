import { SubscriptionPlan } from '../types';

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    tier: 'free',
    name: 'Free',
    price: 0,
    bidsPerMonth: 3,
    features: [
      'Browse all published jobs',
      '3 bids per month',
      'Basic job details',
      'Email notifications',
    ],
  },
  {
    tier: 'starter',
    name: 'Starter',
    price: 49,
    bidsPerMonth: 15,
    features: [
      'Everything in Free',
      '15 bids per month',
      'Full logistics breakdown',
      'Priority in search results',
      'Bid analytics dashboard',
    ],
  },
  {
    tier: 'professional',
    name: 'Professional',
    price: 149,
    bidsPerMonth: 0, // unlimited
    highlighted: true,
    features: [
      'Everything in Starter',
      'Unlimited bids',
      'Full 3D packing diagrams',
      'Customer contact details',
      'Priority support',
      'Company profile badge',
      'Win-rate analytics',
    ],
  },
  {
    tier: 'enterprise',
    name: 'Enterprise',
    price: 399,
    bidsPerMonth: 0, // unlimited
    features: [
      'Everything in Professional',
      'Multi-user team accounts',
      'API access',
      'Custom branding',
      'Dedicated account manager',
      'Fleet management tools',
      'SLA guarantees',
    ],
  },
];
