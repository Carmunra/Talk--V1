import React, { useState } from 'react';
import { api, post } from '../lib/apiClient';
export function Registration({
  config,
  onSaved,
  profile,
}: {
  config: any;
  onSaved: () => Promise<void>;
  profile?: any;
}) {
  const [message, setMessage] = useState(''),
    [busy, setBusy] = useState(false);
  return (
    <form
      className="card space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        const data = new FormData(e.currentTarget);
        try {
          await post('/api/profiles', {
            name: data.get('name'),
            birthDate: data.get('birthDate'),
            accountType: data.get('accountType'),
            acceptedTerms: data.get('terms') === 'on',
            termsVersion: config.termsVersion,
          });
          await onSaved();
        } catch (error) {
          setMessage((error as Error).message);
        } finally {
          setBusy(false);
        }
      }}
    >
      <h2 className="text-xl font-bold">Complete seu cadastro</h2>
      <label>
        Nome
        <input name="name" required maxLength={120} defaultValue={profile?.name} />
      </label>
      <label>
        Data de nascimento
        <input name="birthDate" type="date" required defaultValue={profile?.birthDate} />
      </label>
      <label>
        Tipo de conta
        <select
          name="accountType"
          defaultValue={profile?.accountType || 'STUDENT'}
          disabled={!!profile}
        >
          <option value="STUDENT">Aluno adulto</option>
          <option value="GUARDIAN">Responsável por menor</option>
          <option value="TEACHER">Professor</option>
        </select>
      </label>
      {profile && <input type="hidden" name="accountType" value={profile.accountType} />}
      <p>
        Menores precisam de cadastro pelo responsável adulto. Idade mínima atendida:{' '}
        {config.minimumAge} anos.
      </p>
      <label className="flex gap-2">
        <input name="terms" type="checkbox" required />
        Li os termos e o aviso de privacidade (versão {config.termsVersion}).
      </label>
      <button disabled={busy}>Salvar cadastro</button>
      {message && <p role="status">{message}</p>}
    </form>
  );
}
export function FamilyForm({ config, onSaved }: { config: any; onSaved: () => Promise<void> }) {
  const [message, setMessage] = useState(''),
    [busy, setBusy] = useState(false);
  if (!config.minorsEnabled)
    return (
      <p>Atendimento a menores aguarda habilitação e revisão dos procedimentos de proteção.</p>
    );
  return (
    <form
      className="card space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        const data = new FormData(e.currentTarget);
        try {
          const result = await post('/api/family/dependents', {
            name: data.get('name'),
            birthDate: data.get('birthDate'),
            guardianDeclaration: data.get('consent') === 'on',
            termsVersion: config.termsVersion,
          });
          setMessage('Cadastro enviado para verificação do vínculo. Protocolo: ' + result.id);
          await onSaved();
        } catch (error) {
          setMessage((error as Error).message);
        } finally {
          setBusy(false);
        }
      }}
    >
      <h2 className="text-xl font-bold">Cadastrar dependente</h2>
      <label>
        Nome
        <input name="name" required maxLength={120} />
      </label>
      <label>
        Data de nascimento
        <input name="birthDate" type="date" required />
      </label>
      <p>
        Reservas só serão liberadas após verificação pela equipe. Consulte o atendimento para saber
        o procedimento de comprovação do vínculo.
      </p>
      <label className="flex gap-2">
        <input name="consent" type="checkbox" required />
        Sou responsável legal e autorizo o cadastro e a participação nas aulas conforme os termos e
        o aviso de privacidade.
      </label>
      <button disabled={busy}>Enviar para verificação</button>
      {message && <p role="status">{message}</p>}
    </form>
  );
}
export function TeacherEditor({
  teacher,
  onSaved,
  monthlyOnly = true,
}: {
  teacher: any;
  monthlyOnly?: boolean;
  onSaved: () => Promise<void>;
}) {
  const [message, setMessage] = useState(''),
    [busy, setBusy] = useState(false);
  const [days, setDays] = useState<any[]>(
    Array.from(
      { length: 7 },
      (_, day) =>
        teacher.availability.find((s: any) => s.dayOfWeek === day) || {
          id: 'day-' + day,
          dayOfWeek: day,
          dayLabel: ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'][day],
          startTime: '09:00',
          endTime: '18:00',
          isAvailable: false,
        },
    ),
  );
  return (
    <form
      className="card space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        const data = new FormData(e.currentTarget);
        try {
          await api('/api/teachers/me', {
            method: 'PUT',
            body: JSON.stringify({
              headline: data.get('headline'),
              bio: data.get('bio'),
              hourlyPriceBrl: monthlyOnly
                ? teacher.hourlyPriceBrl || 100
                : Number(data.get('price')),
              levelsTaught: data.getAll('levels').map(Number),
              specialties: data.getAll('specialties'),
              languages: ['Inglês'],
              certifications: String(data.get('certifications') || '')
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean),
              availability: days,
            }),
          });
          setMessage(
            monthlyOnly
              ? 'Perfil salvo. A publicação depende da aprovação profissional e da verificação para receber os repasses.'
              : 'Perfil salvo. Publicação depende de aprovação e conexão Mercado Pago.',
          );
          await onSaved();
        } catch (error) {
          setMessage((error as Error).message);
        } finally {
          setBusy(false);
        }
      }}
    >
      <h2 className="text-xl font-bold">Perfil e disponibilidade</h2>
      <label>
        Apresentação curta
        <input name="headline" defaultValue={teacher.headline} required maxLength={120} />
      </label>
      <label>
        Sobre suas aulas
        <textarea name="bio" defaultValue={teacher.bio} required minLength={20} maxLength={2000} />
      </label>
      {!monthlyOnly && (
        <label>
          Preço por aula de 50 minutos (R$)
          <input
            name="price"
            type="number"
            min="10"
            max="2000"
            step="0.01"
            required
            defaultValue={teacher.hourlyPriceBrl || 100}
          />
        </label>
      )}
      <fieldset>
        <legend>Níveis</legend>
        {[1, 2, 3, 4, 5, 6].map((n, i) => (
          <label className="inline-flex gap-2 mr-4" key={n}>
            <input
              type="checkbox"
              name="levels"
              value={n}
              defaultChecked={teacher.levelsTaught.includes(n)}
            />
            {['A1', 'A2', 'B1', 'B2', 'C1', 'C2'][i]}
          </label>
        ))}
      </fieldset>
      <fieldset>
        <legend>Objetivos</legend>
        {[
          ['CONVERSATION', 'Conversação'],
          ['BUSINESS', 'Negócios'],
          ['EXAMS', 'Exames'],
          ['TRAVEL', 'Viagens'],
          ['BEGINNER_FOUNDATION', 'Iniciantes'],
          ['PRONUNCIATION', 'Pronúncia'],
        ].map(([value, label]) => (
          <label className="inline-flex gap-2 mr-4" key={value}>
            <input
              type="checkbox"
              name="specialties"
              value={value}
              defaultChecked={teacher.specialties.includes(value)}
            />
            {label}
          </label>
        ))}
      </fieldset>
      <label>
        Certificações, separadas por vírgula
        <input name="certifications" defaultValue={teacher.certifications.join(', ')} />
      </label>
      <p>Disponibilidade no horário de Brasília:</p>
      {days.map((day, i) => (
        <div key={day.id} className="flex gap-3 flex-wrap items-center">
          <label className="flex gap-2 w-32">
            <input
              type="checkbox"
              checked={day.isAvailable}
              onChange={(e) =>
                setDays((prev) =>
                  prev.map((s, n) => (n === i ? { ...s, isAvailable: e.target.checked } : s)),
                )
              }
            />
            {day.dayLabel}
          </label>
          <input
            aria-label={'Início ' + day.dayLabel}
            type="time"
            value={day.startTime}
            onChange={(e) =>
              setDays((prev) =>
                prev.map((s, n) => (n === i ? { ...s, startTime: e.target.value } : s)),
              )
            }
          />
          <input
            aria-label={'Fim ' + day.dayLabel}
            type="time"
            value={day.endTime}
            onChange={(e) =>
              setDays((prev) =>
                prev.map((s, n) => (n === i ? { ...s, endTime: e.target.value } : s)),
              )
            }
          />
        </div>
      ))}
      {monthlyOnly ? (
        <p>
          Nos planos mensais, o repasse é de R$ 40 por aula de 50 minutos concluída e confirmada
          pelo aluno adulto ou responsável. O suporte acompanha a verificação para recebimento.
        </p>
      ) : (
        <>
          <p>
            Comissão Talkê: 15%. Tarifas Mercado Pago são adicionais na parcela do professor.
            Consulte os valores na sua conta.
          </p>
          <button disabled={busy}>Salvar perfil</button>
          <button
            type="button"
            disabled={busy}
            onClick={async () => {
              try {
                const result = await post('/api/payments/connect', {});
                window.location.assign(result.url);
              } catch (error) {
                setMessage((error as Error).message);
              }
            }}
          >
            Conectar Mercado Pago
          </button>
          <p>
            {teacher.isVerified ? 'Professor aprovado' : 'Aguardando aprovação'} ·{' '}
            {teacher.paymentConnected ? 'Mercado Pago conectado' : 'Conexão pendente'}
          </p>
        </>
      )}
      {monthlyOnly && (
        <p>
          {teacher.isVerified
            ? 'Perfil profissional aprovado'
            : 'Perfil profissional aguardando aprovação'}
        </p>
      )}
      {message && <p role="status">{message}</p>}
    </form>
  );
}
export function PrivacyPanel({ subjectId }: { subjectId: string }) {
  const [message, setMessage] = useState(''),
    [busy, setBusy] = useState(false);
  return (
    <section className="card space-y-4">
      <h2 className="text-xl font-bold">Seus direitos e solicitações</h2>
      <button
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          try {
            const data = await api('/api/privacy/export/' + subjectId);
            const url = URL.createObjectURL(
              new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }),
            );
            const link = document.createElement('a');
            link.href = url;
            link.download = 'dados-talke.json';
            link.click();
            URL.revokeObjectURL(url);
            setMessage('Exportação concluída');
          } catch (error) {
            setMessage((error as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        Exportar meus dados
      </button>
      <form
        className="space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          const data = new FormData(e.currentTarget);
          try {
            const result = await post('/api/privacy/requests', {
              subjectId,
              kind: data.get('kind'),
              details: data.get('details'),
            });
            setMessage('Solicitação registrada. Protocolo: ' + result.id);
          } catch (error) {
            setMessage((error as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <label>
          Solicitação
          <select name="kind">
            <option value="ACCESS">Informações e acesso</option>
            <option value="CORRECTION">Correção de dados</option>
            <option value="DELETION">Exclusão</option>
            <option value="CONSENT_WITHDRAWAL">Retirar autorização do dependente</option>
            <option value="OBJECTION">Oposição</option>
          </select>
        </label>
        <label>
          Detalhes
          <textarea name="details" maxLength={2000} />
        </label>
        <p>
          A retirada de autorização do dependente bloqueia reservas e sala. A equipe acompanha
          obrigações e pagamentos existentes. A exclusão exige analisar registros sujeitos a
          retenção legal.
        </p>
        <button disabled={busy}>Enviar solicitação</button>
      </form>
      {message && <p role="status">{message}</p>}
    </section>
  );
}
