import { useState, useRef } from 'react';
import type { MonthlyPlan } from '../domain/monthlyPlans';
import { post } from '../lib/apiClient';
import { useDialog } from '../lib/useDialog';
import { checkoutLink } from '../lib/checkoutLink';

export interface SubscriptionSummary {
  id: string;
  studentId: string;
  planId: string;
  status: string;
  amountCents: number;
  creditsExpireOn?: string;
  cancellationCreditPolicy: 'keep_until_expiry' | 'block_booking' | '60_days_after_cancel';
  cycles: { id: string; startsOn: string; expiresOn: string; remaining: number; status: string }[];
  payments: { id: string; dueDate: string; amountCents: number; status: string }[];
}
export interface PendingCheckout {
  id: string;
  studentId: string;
  planId: string;
  status: string;
  url?: string;
}
export const brl = (cents: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100);
const date = (value: string) =>
  new Date(value + 'T12:00:00Z').toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });

export function SubscriptionPurchase({
  plan,
  studentId,
  studentName,
  email,
  sandbox,
  onClose,
  onSaved,
}: {
  plan: MonthlyPlan;
  studentId: string;
  studentName: string;
  email: string;
  sandbox: boolean;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const [accepted, setAccepted] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [url, setUrl] = useState('');
  const requestKey = useRef(crypto.randomUUID());
  const dialog = useDialog(onClose, !busy);
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <section
        ref={dialog}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="purchase-title"
        className="card max-w-lg w-full space-y-4 max-h-[90vh] overflow-y-auto"
      >
        <button aria-label="Fechar contratação" disabled={busy} onClick={onClose}>
          Fechar
        </button>
        <h2 id="purchase-title" className="text-2xl font-bold">
          Assinar {plan.name}
        </h2>
        {sandbox && (
          <p role="status" className="bg-amber-50 p-3 rounded-lg">
            Ambiente de teste. Não use dados ou cartão reais.
          </p>
        )}
        <p>
          {plan.lessonsPerMonth} aulas de 50 minutos por mês para {studentName}.
        </p>
        <p className="font-bold text-xl">{brl(plan.amountCents)} por mês</p>
        <p>
          A cobrança no cartão se renova automaticamente todo mês até você cancelar a renovação. As
          aulas não usadas acumulam por mais um ciclo mensal.
        </p>
        <p>
          Informe no pagamento o mesmo e-mail da sua conta: <strong>{email}</strong>.
        </p>
        <p>Seu cartão será informado na página de pagamento do Asaas.</p>
        <p>
          Para cancelar uma aula sem perder o crédito, solicite com pelo menos 24 horas de
          antecedência. O crédito conserva sua validade; para remarcar, escolha depois outro horário
          disponível. Pedidos tardios e faltas ficam para análise do suporte, sem devolução de
          crédito ou repasse automático ao professor.
        </p>
        {error && <p role="alert">{error}</p>}
        {url ? (
          <div className="space-y-3">
            <a className="block" href={url}>
              Continuar pagamento no Asaas
            </a>
            <p>As aulas serão liberadas após a confirmação do pagamento pelo servidor.</p>
          </div>
        ) : (
          <form
            className="space-y-4"
            onSubmit={async (e) => {
              e.preventDefault();
              if (!accepted || busy) return;
              setBusy(true);
              setError('');
              try {
                const result = await post<{ url: string; sandbox: boolean }>(
                  '/api/subscriptions/checkout',
                  { planId: plan.id, studentId },
                  { 'Idempotency-Key': requestKey.current },
                );
                if (result.sandbox !== sandbox)
                  throw new Error('Ambiente de pagamento divergente. Procure o suporte.');
                setUrl(checkoutLink(result.url, sandbox));
                await onSaved();
              } catch (e) {
                setError((e as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          >
            <label className="flex gap-2 items-start">
              <input
                type="checkbox"
                required
                checked={accepted}
                onChange={(e) => setAccepted(e.target.checked)}
              />
              Li os termos e concordo com o valor e a renovação mensal automática.
            </label>
            <a href="/termos" target="_blank" rel="noopener noreferrer">
              Consultar termos de uso
            </a>
            <button type="submit" disabled={!accepted || busy}>
              {busy ? 'Preparando pagamento…' : 'Preparar pagamento'}
            </button>
          </form>
        )}
      </section>
    </div>
  );
}

export function SubscriptionPanel({
  rows,
  checkouts,
  plans,
  sandbox,
  busy,
  onRefresh,
  onCancel,
}: {
  rows: SubscriptionSummary[];
  checkouts: PendingCheckout[];
  plans: MonthlyPlan[];
  sandbox: boolean;
  busy: boolean;
  onRefresh: () => void;
  onCancel: (id: string) => Promise<boolean>;
}) {
  const [cancelId, setCancelId] = useState('');
  const cancelling = rows.find((row) => row.id === cancelId);
  const dialog = useDialog(() => setCancelId(''), !busy, Boolean(cancelling));
  return (
    <section aria-label="Minha assinatura" className="space-y-4 mb-8">
      <div className="flex gap-4 items-center flex-wrap">
        <h2 className="text-2xl font-bold">Minha assinatura</h2>
        <button disabled={busy} onClick={onRefresh}>
          Atualizar assinatura
        </button>
      </div>
      {sandbox && <p className="bg-amber-50 rounded-lg p-3">Assinaturas em ambiente de teste.</p>}
      {new URLSearchParams(location.search).has('checkout') && (
        <p role="status">
          Retorno do pagamento recebido. Aguarde a confirmação do servidor e atualize sua
          assinatura. O retorno da página não confirma a cobrança.
        </p>
      )}
      {!rows.length && !checkouts.length && (
        <p>Você ainda não tem uma assinatura para este aluno.</p>
      )}
      {checkouts.map((row) => (
        <article key={row.id} className="card space-y-3">
          <h3 className="font-bold">
            {plans.find((p) => p.id === row.planId)?.name || 'Plano mensal'} · pagamento em
            acompanhamento
          </h3>
          {row.status === 'CREATED' && row.url ? (
            <a href={checkoutLink(row.url, sandbox)}>Continuar pagamento no Asaas</a>
          ) : (
            <p>
              A criação do pagamento está em análise. Procure o suporte antes de tentar outra
              compra.
            </p>
          )}
          <p>Se a página expirou, aguarde a atualização do status ou procure o suporte.</p>
        </article>
      ))}
      {rows.map((row) => (
        <article className="card space-y-3" key={row.id}>
          <h3 className="text-xl font-bold">
            {plans.find((p) => p.id === row.planId)?.name || 'Plano mensal'}
          </h3>
          <p>
            {brl(row.amountCents)} / mês ·{' '}
            {row.status === 'ACTIVE'
              ? 'Renovação ativa'
              : row.status === 'CANCELLED'
                ? 'Renovação cancelada'
                : 'Em análise'}
          </p>
          <p>
            <strong>{row.cycles.reduce((sum, c) => sum + c.remaining, 0)} aulas disponíveis</strong>
          </p>
          {row.cycles
            .filter((c) => c.remaining > 0)
            .map((c) => (
              <p key={c.id}>
                {c.remaining} aulas do ciclo iniciado em {date(c.startsOn)}. Use antes de{' '}
                {date(c.expiresOn)}.
              </p>
            ))}
          {row.payments.length > 0 && (
            <details>
              <summary>Cobranças da assinatura</summary>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm mt-3">
                  <thead>
                    <tr>
                      <th>Vencimento</th>
                      <th>Valor</th>
                      <th>Situação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {row.payments.map((p) => (
                      <tr key={p.id}>
                        <td>{date(p.dueDate)}</td>
                        <td>{brl(p.amountCents)}</td>
                        <td>
                          {(
                            {
                              CONFIRMED: 'Pagamento confirmado',
                              RECEIVED: 'Pagamento recebido',
                              PENDING: 'Aguardando pagamento',
                              OVERDUE: 'Pagamento atrasado',
                              REFUNDED: 'Reembolsado',
                            } as Record<string, string>
                          )[p.status] || 'Em acompanhamento'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          )}
          {row.status === 'ACTIVE' && (
            <button disabled={busy} onClick={() => setCancelId(row.id)}>
              Cancelar renovação
            </button>
          )}
          {row.status === 'CANCELLED' && (
            <p>
              {row.cancellationCreditPolicy === '60_days_after_cancel'
                ? `Você tem 60 dias desde o cancelamento para realizar suas aulas já pagas e válidas. Realize-as antes de ${row.creditsExpireOn?.split('-').reverse().join('/')}.`
                : row.cancellationCreditPolicy === 'keep_until_expiry'
                  ? 'As aulas já pagas continuam disponíveis até sua validade.'
                  : 'Novas reservas com esta assinatura estão bloqueadas. Procure o suporte sobre o saldo de aulas.'}
            </p>
          )}
        </article>
      ))}
      {cancelling && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <section
            ref={dialog}
            role="dialog"
            aria-modal="true"
            aria-labelledby="cancel-subscription-title"
            tabIndex={-1}
            className="card max-w-lg space-y-4"
          >
            <h2 id="cancel-subscription-title" className="text-xl font-bold">
              Cancelar a renovação mensal?
            </h2>
            <p>
              Você está solicitando o encerramento das próximas cobranças recorrentes. Cobranças já
              emitidas e pedidos de reembolso precisam de acompanhamento.
            </p>
            <p>
              {cancelling.cancellationCreditPolicy === '60_days_after_cancel'
                ? 'Você terá 60 dias após o cancelamento para realizar as aulas já pagas e ainda válidas. Aulas vencidas ou estornadas não são recuperadas.'
                : cancelling.cancellationCreditPolicy === 'keep_until_expiry'
                  ? 'As aulas já pagas poderão ser reservadas até sua validade.'
                  : 'Após cancelar, novas reservas com esta assinatura ficarão bloqueadas. O suporte acompanhará seu saldo de aulas.'}
            </p>
            <button disabled={busy} onClick={() => setCancelId('')}>
              Manter assinatura
            </button>
            <button
              disabled={busy}
              onClick={async () => {
                if (await onCancel(cancelId)) setCancelId('');
              }}
            >
              Confirmar cancelamento da renovação
            </button>
          </section>
        </div>
      )}
    </section>
  );
}
