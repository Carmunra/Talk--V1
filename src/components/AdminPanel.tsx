import React, { useEffect, useState } from 'react';
import { api, post } from '../lib/apiClient';
export function AdminPanel({ subscriptionsEnabled = false }: { subscriptionsEnabled?: boolean }) {
  const [queue, setQueue] = useState<any>(null),
    [message, setMessage] = useState(''),
    [busy, setBusy] = useState(false);
  const load = async () => {
    const [base, financial] = await Promise.all([
      api<any>('/api/admin/queue'),
      subscriptionsEnabled ? api<any>('/api/admin/subscriptions/status') : Promise.resolve(null),
    ]);
    setQueue({ ...base, financial });
  };
  useEffect(() => {
    load().catch((e) => setMessage(e.message));
  }, []);
  const action = async (work: () => Promise<unknown>) => {
    setBusy(true);
    try {
      await work();
      setMessage('Atendimento registrado');
      await load();
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className="card space-y-4">
      <h1 className="text-2xl font-bold">Atendimento e aprovações</h1>
      <p>
        Comece pelos relatos de segurança e operações financeiras em análise. Depois, acompanhe os
        cadastros e solicitações.
      </p>
      {queue && (
        <section
          className="rounded-xl bg-slate-50 p-4 space-y-2"
          aria-label="Prioridades de atendimento"
        >
          <h2 className="font-bold">Fila de prioridades</h2>
          <p className="text-sm">
            Resumo dos registros exibidos abaixo. As listas financeiras mostram até 100 registros de
            cada tipo por consulta.
          </p>
          {[
            ['reports', 'Relatos de segurança', queue.reports?.length || 0],
            [
              'admin-finance',
              'Repasses e compras em acompanhamento',
              (queue.financial?.checkouts?.length || 0) + (queue.financial?.payouts?.length || 0),
            ],
            ['refunds', 'Reembolsos em acompanhamento', queue.refunds?.length || 0],
            ['privacyRequests', 'Solicitações de privacidade', queue.privacyRequests?.length || 0],
            ['ageReviews', 'Verificações de idade', queue.ageReviews?.length || 0],
            ['guardians', 'Vínculos com responsáveis', queue.guardians?.length || 0],
            ['teachers', 'Aprovações de professores', queue.teachers?.length || 0],
            ['roomClosures', 'Acesso a salas em acompanhamento', queue.roomClosures?.length || 0],
          ].map(([anchor, label, count]) => (
            <p key={anchor}>
              <a href={'#' + anchor}>{label}</a> · {count} pendência(s)
            </p>
          ))}
        </section>
      )}
      <button disabled={busy} onClick={() => void action(load)}>
        Atualizar fila
      </button>
      {message && <p role="status">{message}</p>}
      <h2 className="font-bold">Manutenção de pagamentos e salas</h2>
      {queue?.maintenance ? (
        <p>
          Última execução: {queue.maintenance.finishedAt || queue.maintenance.startedAt} ·{' '}
          {queue.maintenance.status} · {queue.maintenance.failures} falha(s)
        </p>
      ) : (
        <p>Nenhuma execução registrada. Configure e acompanhe o serviço de manutenção.</p>
      )}
      {[
        ['ageReviews', 'Aferição de idade de adultos', 'age'],
        ['teachers', 'Professores', 'teacher'],
        ['guardians', 'Vínculos com responsáveis', 'guardian'],
      ].map(([key, label, kind]) => (
        <div key={key} id={key}>
          <h2 className="font-bold">{label}</h2>
          {queue?.[key]?.map((row: any) => (
            <form
              className="border-t py-3 space-y-2"
              key={row.id}
              onSubmit={async (e) => {
                e.preventDefault();
                const data = new FormData(e.currentTarget);
                await action(() =>
                  post('/api/admin/approve', {
                    kind,
                    subjectId: row.id,
                    evidenceReference: data.get('evidence'),
                  }),
                );
              }}
            >
              <p>
                {row.name} · {row.id}
              </p>
              {row.birthDate && (
                <p>
                  Nascimento declarado: {row.birthDate} · responsável:{' '}
                  {row.guardianId || 'Conta adulta'}
                </p>
              )}
              <label>
                Referência da verificação realizada
                <input name="evidence" required minLength={10} maxLength={200} />
              </label>
              <button disabled={busy}>Aprovar após verificação</button>
            </form>
          ))}
        </div>
      ))}
      {[
        ['privacyRequests', 'Solicitações de privacidade', 'privacy'],
        ['reports', 'Relatos de segurança', 'safety'],
      ].map(([key, label, kind]) => (
        <div key={key} id={key}>
          <h2 className="font-bold">{label}</h2>
          {queue?.[key]?.map((row: any) => (
            <form
              className="border-t py-3 space-y-2"
              key={row.id}
              onSubmit={async (e) => {
                e.preventDefault();
                const data = new FormData(e.currentTarget);
                const resolution = String(data.get('resolution'));
                await action(() =>
                  row.kind === 'DELETION'
                    ? post('/api/admin/privacy/' + row.id + '/delete', {
                        retentionDecision: resolution,
                      })
                    : post('/api/admin/resolve', { kind, requestId: row.id, resolution }),
                );
              }}
            >
              <p>
                Protocolo {row.id} · {row.kind || 'Relato'} · titular{' '}
                {row.subjectId || row.reporterId}
              </p>
              <p>{row.details}</p>
              <label>
                Resposta/justificativa de retenção
                <textarea name="resolution" required minLength={20} maxLength={2000} />
              </label>
              <button disabled={busy}>
                {row.kind === 'DELETION'
                  ? 'Executar exclusão com retenção justificada'
                  : 'Registrar resolução'}
              </button>
            </form>
          ))}
        </div>
      ))}
      <h2 id="refunds" className="font-bold">
        Reembolsos que exigem atendimento
      </h2>
      {queue?.refunds?.map((row: any) => (
        <p key={row.id}>
          {row.id} · pedido {row.orderId} · professor {row.teacherId}
        </p>
      ))}
      <h2 id="roomClosures" className="font-bold">
        Salas com encerramento pendente
      </h2>
      {queue?.roomClosures?.map((row: any) => (
        <p key={row.id}>Aula {row.lessonId} · acionar manutenção/suporte do provedor</p>
      ))}
      <form
        className="space-y-3 border-t pt-4"
        onSubmit={async (e) => {
          e.preventDefault();
          const data = new FormData(e.currentTarget);
          await action(() =>
            post('/api/admin/suspend', {
              subjectId: data.get('subjectId'),
              reason: data.get('reason'),
            }),
          );
        }}
      >
        <h2 className="font-bold">Suspender acesso para proteção</h2>
        <label>
          Identificador da conta
          <input name="subjectId" required />
        </label>
        <label>
          Motivo
          <textarea name="reason" minLength={10} required />
        </label>
        <button disabled={busy}>Suspender acesso</button>
      </form>
    </section>
  );
}
