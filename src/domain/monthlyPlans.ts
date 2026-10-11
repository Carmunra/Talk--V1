export interface MonthlyPlan {
  id: string;
  lessonsPerMonth: number;
  amountCents: number;
  currency: 'BRL';
  interval: 'month';
  automaticRenewal: boolean;
  multipleTeachers: boolean;
}

// The server publishes this catalog; the browser does not choose charge amounts.
export const MONTHLY_PLANS: readonly MonthlyPlan[] = [
  {
    id: 'monthly-4',
    lessonsPerMonth: 4,
    amountCents: 43900,
    currency: 'BRL',
    interval: 'month',
    automaticRenewal: true,
    multipleTeachers: true,
  },
  {
    id: 'monthly-6',
    lessonsPerMonth: 6,
    amountCents: 56900,
    currency: 'BRL',
    interval: 'month',
    automaticRenewal: true,
    multipleTeachers: true,
  },
  {
    id: 'monthly-8',
    lessonsPerMonth: 8,
    amountCents: 70900,
    currency: 'BRL',
    interval: 'month',
    automaticRenewal: true,
    multipleTeachers: true,
  },
  {
    id: 'monthly-12',
    lessonsPerMonth: 12,
    amountCents: 96900,
    currency: 'BRL',
    interval: 'month',
    automaticRenewal: true,
    multipleTeachers: true,
  },
  {
    id: 'monthly-16',
    lessonsPerMonth: 16,
    amountCents: 123900,
    currency: 'BRL',
    interval: 'month',
    automaticRenewal: true,
    multipleTeachers: true,
  },
];
