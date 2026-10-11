import React, { useEffect, useState } from 'react';
import { api, post } from '../lib/apiClient';
export function AdminPanel() {
  const [queue, setQueue] = useState<any>(null),
    [message, setMessage] = useState(''),
    [busy, setBusy] = useState(false);
  const load = async () => setQueue(await api('/api/admin/queue'));
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
        <div key={key}>
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
        <div key={key}>
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
      <h2 className="font-bold">Reembolsos que exigem atendimento</h2>
      {queue?.refunds?.map((row: any) => (
        <p key={row.id}>
          {row.id} · pedido {row.orderId} · professor {row.teacherId}
        </p>
      ))}
      <h2 className="font-bold">Salas com encerramento pendente</h2>
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
