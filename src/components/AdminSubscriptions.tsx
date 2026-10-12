import { useEffect, useState } from 'react';
import { api, post } from '../lib/apiClient';
import { brl } from './SubscriptionPanel';

export function AdminSubscriptions() {
  const [data, setData] = useState<any>(null),
    [message, setMessage] = useState(''),
    [busy, setBusy] = useState(false);
  const load = async () => setData(await api('/api/admin/subscriptions/status'));
  useEffect(() => {
    let alive = true;
    api('/api/admin/subscriptions/status')
      .then((value) => {
        if (alive) setData(value);
      })
      .catch((e) => {
        if (alive) setMessage(e.message);
      });
    return () => {
      alive = false;
    };
  }, []);
  const save = async (work: () => Promise<unknown>) => {
    setBusy(true);
    setMessage('');
    try {
      await work();
      await load();
      setMessage('Atualização registrada');
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <section aria-label="Administração das assinaturas" className="card space-y-4 mt-6">
      <h2 className="text-2xl font-bold">Assinaturas e repasses</h2>
      <button disabled={busy} onClick={() => void save(load)}>
        Atualizar acompanhamento
      </button>
      {message && <p role="status">{message}</p>}
      <h3 className="font-bold">Recebedores dos professores</h3>
      <p>
        Verifique no Asaas a subconta vinculada à Talkê, o titular e a aprovação cadastral antes de
        liberar o professor. Não informe chaves de API neste formulário.
      </p>
      {data?.recipients.map((row: any) => (
        <form
          className="border-t py-4 space-y-3"
          key={row.id}
          onSubmit={(e) => {
            e.preventDefault();
            const fields = new FormData(e.currentTarget);
            void save(() =>
              post('/api/admin/subscriptions/recipients/' + row.id, {
                walletId: fields.get('wallet'),
                verified: fields.get('verified') === 'on',
                evidence: fields.get('evidence'),
              }),
            );
          }}
        >
          <p>
            {row.name} · {row.recipientVerified ? 'Repasse liberado' : 'Repasse pendente'}
          </p>
          <label>
            Wallet ID da subconta vinculada
            <input name="wallet" required pattern="[a-fA-F0-9-]{36}" maxLength={36} />
          </label>
          <label>
            Referência da verificação realizada
            <input name="evidence" required minLength={10} maxLength={1000} />
          </label>
          <label className="flex gap-2">
            <input name="verified" type="checkbox" />
            Cadastro, titularidade e vínculo conferidos; liberar repasses.
          </label>
          <button disabled={busy || row.status !== 'ACTIVE'}>
            Salvar verificação do recebedor
          </button>
        </form>
      ))}
      <h3 className="font-bold">Repasses em acompanhamento</h3>
      {!data?.payouts.length && <p>Nenhum repasse pendente registrado.</p>}
      {data?.payouts.map((p: any) => (
        <p key={p.id}>
          {brl(p.amountCents)} · aula {p.lessonId} · {p.status}{' '}
          {p.reviewRequired ? '· revisão necessária' : ''}
        </p>
      ))}
      <p>
        Operações sem resposta conclusiva precisam ser conferidas no Asaas. Não repita uma
        transferência para tentar resolver uma falha.
      </p>
      <h3 className="font-bold">Compras que precisam de conciliação</h3>
      {!data?.checkouts.length && <p>Nenhuma criação de checkout pendente de análise.</p>}
      {data?.checkouts.map((c: any) => (
        <p key={c.id}>
          Aluno {c.studentId} · plano {c.planId} · {c.status}
        </p>
      ))}
    </section>
  );
}
