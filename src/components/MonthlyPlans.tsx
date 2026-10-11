import type { MonthlyPlan } from '../domain/monthlyPlans';

const money = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export function MonthlyPlans({
  plans,
  compact = false,
}: {
  plans: MonthlyPlan[];
  compact?: boolean;
}) {
  const Heading = compact ? 'h2' : 'h1';
  const PlanHeading = compact ? 'h3' : 'h2';
  return (
    <section className="space-y-6 mb-8" aria-label="Planos mensais">
      <div>
        <Heading className="text-3xl font-bold text-blue-900">Planos mensais</Heading>
        <p className="mt-2 text-slate-600">
          Aulas de inglês de 50 minutos, com professores diferentes.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {plans.map((plan) => (
          <article
            key={plan.id}
            className="card space-y-4"
            aria-label={`${plan.lessonsPerMonth} aulas por mês`}
          >
            <PlanHeading className="text-xl font-bold">{plan.lessonsPerMonth} aulas</PlanHeading>
            <p className="text-sm text-slate-600">por mês</p>
            <p className="text-3xl font-bold text-blue-700">
              {money.format(plan.amountCents / 100)}
              <span className="block mt-1 text-sm font-normal text-slate-600">/ mês</span>
            </p>
          </article>
        ))}
      </div>
      <p className="text-sm text-slate-600">
        As aulas não usadas acumulam por mais um ciclo mensal.
      </p>
      <p className="text-sm text-slate-600">
        Assinatura mensal com renovação automática. A contratação dos planos ainda não está
        disponível.
      </p>
    </section>
  );
}
