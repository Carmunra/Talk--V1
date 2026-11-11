import React from 'react';
const brl = (cents: number) =>
  (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
export function TeacherEarnings({ data }: { data: any }) {
  if (!data) return <p role="status">Carregando seus repasses…</p>;
  const rows = data.payouts || [],
    awaiting = data.awaitingConfirmation || [];
  const sum = (filter: (p: any) => boolean) =>
    rows.filter(filter).reduce((v: number, p: any) => v + p.amountCents, 0);
  const states: Record<string, string> = {
    QUEUED: 'Aguardando liberação financeira',
    PENDING: 'Em processamento no provedor',
    DONE: 'Repassado',
    UNKNOWN: 'Em análise pelo suporte',
    SUBMITTING: 'Confirmação em acompanhamento',
    REVIEW: 'Em análise pelo suporte',
    CANCELLED: 'Repasse cancelado; procure o suporte',
  };
  return (
    <section className="space-y-4" aria-label="Repasses do professor">
      <h2 className="text-xl font-bold">Seus repasses dos planos</h2>
      <p>
        {brl(data.payoutPerLessonCents)} por aula concluída e confirmada pelo aluno adulto ou
        responsável.
      </p>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="card">
          <p>Aguardando confirmação</p>
          <strong>{awaiting.length} aula(s)</strong>
        </div>
        <div className="card">
          <p>Aguardando repasse ou análise</p>
          <strong>{brl(sum((p) => p.status !== 'DONE' && p.status !== 'CANCELLED'))}</strong>
        </div>
        <div className="card">
          <p>Repassado</p>
          <strong>{brl(sum((p) => p.status === 'DONE'))}</strong>
        </div>
      </div>
      <p className="text-sm">
        A confirmação da aula não garante liquidação imediata. Repasses dependem do recebimento da
        mensalidade, saldo disponível e análise do provedor.
      </p>
      {!data.recipientVerified && (
        <p role="status">
          Seu cadastro para receber está em verificação. Procure o suporte para acompanhar.
        </p>
      )}
      {awaiting.map((a: any) => (
        <p key={a.lessonId}>Aula de {a.scheduledDate} · aguardando confirmação da realização.</p>
      ))}
      {rows.map((p: any) => (
        <p key={p.id}>
          Aula {p.lessonId} · {brl(p.amountCents)} ·{' '}
          {p.reviewRequired ? 'Em análise pelo suporte' : states[p.status] || 'Em acompanhamento'}
        </p>
      ))}
      {!awaiting.length && !rows.length && (
        <p>Seus repasses aparecerão aqui conforme as aulas forem concluídas e confirmadas.</p>
      )}
    </section>
  );
}
