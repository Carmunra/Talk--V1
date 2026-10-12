import React, { useEffect, useState, useRef, lazy, Suspense } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from './lib/firebase';
import { api, post } from './lib/apiClient';
import { useAuth } from './context/AuthContext';
import { TeacherDirectory } from './components/TeacherDirectory';
import { TeacherProfileModal } from './components/TeacherProfileModal';
import { BookingModal } from './components/BookingModal';
import { DiagnosticAndGoalView } from './components/DiagnosticAndGoalView';
import { PrivacyNotice } from './components/PrivacyNotice';
import { SupportContacts } from './components/SupportContacts';
import { MonthlyPlans } from './components/MonthlyPlans';
import { SchoolOverview } from './components/SchoolOverview';
import {
  SubscriptionPanel,
  SubscriptionPurchase,
  type SubscriptionSummary,
  type PendingCheckout,
} from './components/SubscriptionPanel';
import type { MonthlyPlan } from './domain/monthlyPlans';
import { Registration, FamilyForm, TeacherEditor, PrivacyPanel } from './components/AccountForms';
import { AdminPanel } from './components/AdminPanel';
import { AdminSubscriptions } from './components/AdminSubscriptions';
import { Teacher, Student, UserRole } from './domain/types';
import { TALKE_CURRICULUM_MATERIALS } from './data/talkeMaterials';
const VirtualClassroomModal = lazy(() =>
  import('./components/VirtualClassroomModal').then((module) => ({
    default: module.VirtualClassroomModal,
  })),
);

export default function App() {
  const {
    firebaseUser,
    session,
    loadingAuth,
    authError,
    loginWithGoogle,
    logout,
    refreshProfiles,
  } = useAuth();
  const [config, setConfig] = useState<any>(null),
    [tab, setTab] = useState(
      location.pathname === '/privacidade'
        ? 'privacy'
        : location.pathname === '/termos'
          ? 'terms'
          : location.pathname === '/planos'
            ? 'plans'
            : 'teachers',
    ),
    [teachers, setTeachers] = useState<Teacher[]>([]);
  const [lessons, setLessons] = useState<any[]>([]),
    [subscriptions, setSubscriptions] = useState<SubscriptionSummary[]>([]),
    [checkouts, setCheckouts] = useState<PendingCheckout[]>([]),
    [purchase, setPurchase] = useState<MonthlyPlan | null>(null),
    [payments, setPayments] = useState<any[]>([]),
    [notes, setNotes] = useState<any[]>([]);
  const [childId, setChildId] = useState(''),
    [student, setStudent] = useState<Student | null>(null);
  const [booking, setBooking] = useState<Teacher | null>(null),
    [profileTeacher, setProfileTeacher] = useState<Teacher | null>(null),
    [room, setRoom] = useState<any>(null);
  const [message, setMessage] = useState(''),
    [busy, setBusy] = useState(false);
  const subjectId = childId || firebaseUser?.uid || '',
    role = session?.profile?.accountType;
  const active = session?.profile?.status === 'ACTIVE';
  const currentIdentity = useRef({ uid: firebaseUser?.uid, subjectId });
  currentIdentity.current = { uid: firebaseUser?.uid, subjectId };
  const refresh = async () => {
    setTeachers(await api('/api/teachers'));
    const expectedUid = firebaseUser?.uid,
      expectedSubject = subjectId;
    const same = () =>
      auth.currentUser?.uid === expectedUid &&
      currentIdentity.current.subjectId === expectedSubject;
    if (!firebaseUser || !active || !same()) return;
    const [freshLessons, freshPayments, freshSubscriptions, freshCheckouts] = await Promise.all([
      api<any[]>('/api/lessons'),
      api<any[]>('/api/payments'),
      config?.subscriptionsEnabled
        ? api<SubscriptionSummary[]>('/api/subscriptions')
        : Promise.resolve([]),
      config?.subscriptionsEnabled
        ? api<PendingCheckout[]>('/api/subscriptions/checkouts')
        : Promise.resolve([]),
    ]);
    if (!same()) return;
    setLessons(freshLessons);
    setPayments(freshPayments);
    setSubscriptions(freshSubscriptions);
    setCheckouts(freshCheckouts);
    if (role === 'STUDENT' || childId) {
      const [freshStudent, freshNotes] = await Promise.all([
        api<Student>('/api/students/' + subjectId),
        api<any[]>('/api/progress?studentId=' + subjectId),
      ]);
      if (same()) {
        setStudent(freshStudent);
        setNotes(freshNotes);
      }
    } else if (role === 'TEACHER') {
      const freshNotes = await api<any[]>('/api/progress');
      if (same()) setNotes(freshNotes);
    }
  };
  useEffect(() => {
    api('/api/config')
      .then(setConfig)
      .catch((e) => setMessage(e.message));
  }, []);
  useEffect(() => {
    let cancelled = false;
    setLessons([]);
    setPayments([]);
    setStudent(null);
    setNotes([]);
    setSubscriptions([]);
    setCheckouts([]);
    setPurchase(null);
    setRoom(null);
    setBooking(null);
    (async () => {
      try {
        const catalog = await api<Teacher[]>('/api/teachers');
        if (cancelled) return;
        setTeachers(catalog);
        if (!firebaseUser || !active) return;
        const [ls, ps, ss, cs] = await Promise.all([
          api<any[]>('/api/lessons'),
          api<any[]>('/api/payments'),
          config?.subscriptionsEnabled
            ? api<SubscriptionSummary[]>('/api/subscriptions')
            : Promise.resolve([]),
          config?.subscriptionsEnabled
            ? api<PendingCheckout[]>('/api/subscriptions/checkouts')
            : Promise.resolve([]),
        ]);
        if (cancelled) return;
        setLessons(ls);
        setPayments(ps);
        setSubscriptions(ss);
        setCheckouts(cs);
        if (role === 'STUDENT' || childId) {
          const st = await api<Student>('/api/students/' + subjectId),
            ns = await api<any[]>('/api/progress?studentId=' + subjectId);
          if (!cancelled) {
            setStudent(st);
            setNotes(ns);
          }
        } else if (role === 'TEACHER') {
          const ns = await api<any[]>('/api/progress');
          if (!cancelled) setNotes(ns);
        }
      } catch (e) {
        if (!cancelled) setMessage((e as Error).message);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [firebaseUser?.uid, session, childId, config?.subscriptionsEnabled]);
  useEffect(() => {
    setChildId('');
    setMessage('');
  }, [firebaseUser?.uid]);
  const action = async (work: () => Promise<unknown>, success = 'Operação concluída') => {
    setBusy(true);
    setMessage('');
    try {
      await work();
      setMessage(success);
      await refresh();
      return true;
    } catch (e) {
      setMessage((e as Error).message);
      return false;
    } finally {
      setBusy(false);
    }
  };
  const selectedSubscriptions = subscriptions.filter((s) => s.studentId === subjectId);
  const selectedCheckouts = checkouts.filter((s) => s.studentId === subjectId);
  const bookingSubscription = selectedSubscriptions.find(
    (s) =>
      (s.status === 'ACTIVE' ||
        (s.status === 'CANCELLED' && s.cancellationCreditPolicy !== 'block_booking')) &&
      s.cycles.some((c) => c.remaining > 0),
  );
  const selectPlan = (plan: MonthlyPlan) => {
    if (
      !active ||
      !student ||
      !['STUDENT', 'GUARDIAN'].includes(role || '') ||
      session?.profile?.ageGroup !== 'ADULT'
    )
      setMessage(
        'Entre como aluno adulto ou responsável e selecione um aluno liberado para contratar.',
      );
    else setPurchase(plan);
  };
  if (!config)
    return (
      <main className="p-8">
        <p role="status">{message || 'Carregando Talkê…'}</p>
      </main>
    );
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <header className="bg-white border-b p-4 flex items-center justify-between flex-wrap gap-4">
        <a href="/" className="text-3xl font-bold text-blue-700">
          Talkê<span className="text-sky-400">.</span>
        </a>
        <span>Aulas de inglês · 50 minutos</span>
        {firebaseUser ? (
          <div className="flex gap-4 items-center">
            <span>{session?.profile?.name || firebaseUser.displayName || 'Sua conta'}</span>
            <button
              onClick={async () => {
                await logout();
                setTab('teachers');
              }}
            >
              Sair
            </button>
          </div>
        ) : (
          <button onClick={() => void action(loginWithGoogle, 'Login realizado')}>
            Entrar com Google
          </button>
        )}
      </header>
      {import.meta.env.MODE === 'test' && !firebaseUser && (
        <form
          className="p-4 flex gap-2"
          aria-label="Login de teste"
          onSubmit={async (e) => {
            e.preventDefault();
            const data = new FormData(e.currentTarget);
            await action(
              () =>
                signInWithEmailAndPassword(
                  auth,
                  String(data.get('email')),
                  String(data.get('password')),
                ),
              'Login realizado',
            );
          }}
        >
          <input aria-label="E-mail de teste" name="email" type="email" required />
          <input aria-label="Senha de teste" name="password" type="password" required />
          <button>Entrar no emulador</button>
        </form>
      )}
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        <nav aria-label="Navegação" className="flex gap-2 mb-6 flex-wrap">
          {[
            ['teachers', 'Professores'],
            ['plans', 'Planos'],
            ...(active
              ? [
                  ['lessons', 'Minhas aulas'],
                  ['payments', 'Pagamentos'],
                  ['progress', 'Desenvolvimento'],
                  ['materials', 'Materiais'],
                ]
              : []),
            ...(firebaseUser && session?.profile ? [['privacy-panel', 'Meus dados']] : []),
            ...(active && (role === 'STUDENT' || childId) ? [['diagnostic', 'Objetivos']] : []),
            ...(active && role === 'GUARDIAN' ? [['family', 'Família']] : []),
            ...(active && role === 'TEACHER' ? [['teacher-profile', 'Meu perfil']] : []),
            ...(session?.isAdmin ? [['admin', 'Administração']] : []),
            ['privacy', 'Privacidade'],
            ['terms', 'Termos'],
          ].map(([value, label]) => (
            <button
              className={tab === value ? 'selected' : ''}
              key={value}
              onClick={() => setTab(value)}
            >
              {label}
            </button>
          ))}
        </nav>
        {(message || authError) && (
          <p role="status" className="p-4 mb-4 rounded-xl bg-blue-50">
            {message || authError}
          </p>
        )}
        {loadingAuth && <p>Verificando sua sessão…</p>}
        {active && role === 'GUARDIAN' && (
          <label className="mb-6">
            Dependente selecionado
            <select
              aria-label="Dependente"
              value={childId}
              onChange={(e) => setChildId(e.target.value)}
            >
              <option value="">Selecione um dependente</option>
              {session?.dependents.map((child) => (
                <option key={child.id} value={child.id}>
                  {child.name} · {child.status === 'ACTIVE' ? 'Liberado' : 'Pendente ou suspenso'}
                </option>
              ))}
            </select>
          </label>
        )}
        {tab === 'privacy' ? (
          <PrivacyNotice config={config} />
        ) : tab === 'terms' ? (
          <PrivacyNotice config={config} terms />
        ) : tab === 'plans' ? (
          <>
            {active && config.subscriptionsEnabled && (
              <SubscriptionPanel
                rows={selectedSubscriptions}
                checkouts={selectedCheckouts}
                plans={config.monthlyPlans}
                sandbox={config.subscriptionsSandbox}
                busy={busy}
                onRefresh={() => void action(refresh, 'Assinatura atualizada')}
                onCancel={async (id) => {
                  return action(
                    () => post('/api/subscriptions/' + id + '/cancel', {}),
                    'Cancelamento registrado',
                  );
                }}
              />
            )}
            <MonthlyPlans
              plans={config.monthlyPlans}
              onSelect={config.subscriptionsEnabled ? selectPlan : undefined}
              unavailable={
                selectedSubscriptions.some((s) => s.status !== 'CANCELLED') ||
                selectedCheckouts.length > 0
              }
            />
          </>
        ) : tab === 'privacy-panel' && subjectId ? (
          <PrivacyPanel subjectId={subjectId} />
        ) : tab === 'admin' && session?.isAdmin ? (
          <>
            <AdminPanel />
            {config.subscriptionsEnabled && <AdminSubscriptions />}
          </>
        ) : firebaseUser &&
          session &&
          (!session.profile || session.profile.termsVersion !== config.termsVersion) ? (
          <Registration config={config} profile={session.profile} onSaved={refreshProfiles} />
        ) : session?.profile && !active ? (
          <section className="card space-y-4">
            <p>
              Cadastro suspenso ou em análise de idade/vínculo. Procure{' '}
              <SupportContacts config={config} fallback="o atendimento" />.
            </p>
            <button onClick={() => void action(refreshProfiles, 'Cadastro atualizado')}>
              Atualizar cadastro
            </button>
          </section>
        ) : tab === 'teachers' ? (
          <>
            {!firebaseUser && <SchoolOverview minorsEnabled={config.minorsEnabled} />}
            {!firebaseUser && (
              <MonthlyPlans
                plans={config.monthlyPlans}
                compact
                onSelect={config.subscriptionsEnabled ? selectPlan : undefined}
              />
            )}
            <TeacherDirectory
              monthlyOnly={config.subscriptionsEnabled && !config.paymentsEnabled}
              teachers={teachers}
              currentStudent={student}
              onSelectTeacher={setProfileTeacher}
              onBookTeacher={(teacher) => {
                if (!active || !student)
                  setMessage('Entre como aluno ou selecione um dependente liberado para reservar.');
                else if (
                  config.subscriptionsEnabled &&
                  !config.paymentsEnabled &&
                  !bookingSubscription
                ) {
                  setMessage('Selecione um plano com aulas disponíveis antes de reservar.');
                  setTab('plans');
                } else setBooking(teacher);
              }}
              onGoToDiagnostic={() => setTab('diagnostic')}
            />
            {!teachers.length && <p>Nenhum professor disponível para reservas neste momento.</p>}
          </>
        ) : tab === 'family' ? (
          <FamilyForm config={config} onSaved={refreshProfiles} />
        ) : tab === 'teacher-profile' && session?.teacher ? (
          <TeacherEditor teacher={session.teacher} onSaved={refreshProfiles} />
        ) : tab === 'diagnostic' && student ? (
          <DiagnosticAndGoalView
            currentStudent={student}
            onGoToTeachers={() => setTab('teachers')}
            onSave={async (level, goal, goalDescription) => {
              await post('/api/students/' + student.id + '/diagnostic', {
                level,
                goal,
                goalDescription,
              });
              await refresh();
              setTab('teachers');
            }}
          />
        ) : tab === 'lessons' ? (
          <section className="space-y-4">
            <div className="flex justify-between">
              <h1 className="text-2xl font-bold">Minhas aulas</h1>
              <button disabled={busy} onClick={() => void action(refresh, 'Aulas atualizadas')}>
                Atualizar status
              </button>
            </div>
            {lessons
              .filter((l) => !childId || l.studentId === childId)
              .map((l) => (
                <article className="card space-y-3" key={l.id}>
                  <h2 className="font-bold">
                    {l.teacherName} · {l.studentName}
                  </h2>
                  <p>
                    {l.scheduledDate} · {l.startTime} (Brasília) · {l.durationMinutes} min
                  </p>
                  <p>
                    {l.fundingSource === 'ASAAS_SUBSCRIPTION'
                      ? 'Aula do plano'
                      : `R$ ${l.priceBrl.toFixed(2)}`}{' '}
                    ·{' '}
                    {(
                      {
                        CONFIRMED: 'Confirmada',
                        REQUESTED: 'Aguardando pagamento',
                        COMPLETED: 'Concluída',
                        CANCELLED: 'Cancelada',
                      } as any
                    )[l.status] || 'Em andamento'}{' '}
                    · {l.isPaid ? 'Pagamento confirmado' : 'Sem confirmação de pagamento'}
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {l.status === 'REQUESTED' && l.payerId === firebaseUser?.uid && (
                      <button
                        disabled={busy}
                        onClick={() =>
                          void action(async () => {
                            const result = await post('/api/lessons/' + l.id + '/checkout', {});
                            window.location.assign(result.url);
                          }, 'Redirecionando para Mercado Pago')
                        }
                      >
                        Pagar no Mercado Pago
                      </button>
                    )}
                    {l.isPaid && l.status === 'CONFIRMED' && (
                      <button onClick={() => setRoom(l)}>Entrar na sala</button>
                    )}
                    {['REQUESTED', 'CONFIRMED'].includes(l.status) &&
                      l.fundingSource !== 'ASAAS_SUBSCRIPTION' && (
                        <button
                          disabled={busy}
                          onClick={() =>
                            void action(
                              () => post('/api/lessons/' + l.id + '/cancel', {}),
                              'Cancelamento registrado. Reembolsos ficam em acompanhamento.',
                            )
                          }
                        >
                          Cancelar aula
                        </button>
                      )}
                    {l.fundingSource === 'ASAAS_SUBSCRIPTION' &&
                      l.status === 'COMPLETED' &&
                      l.payerId === firebaseUser?.uid &&
                      !l.payerConfirmedAt && (
                        <button
                          disabled={busy}
                          onClick={() =>
                            void action(
                              () => post('/api/lessons/' + l.id + '/confirm-completion', {}),
                              'Realização da aula confirmada',
                            )
                          }
                        >
                          Confirmar que a aula ocorreu
                        </button>
                      )}
                    {l.fundingSource === 'ASAAS_SUBSCRIPTION' && l.payerConfirmedAt && (
                      <p>Realização confirmada pelo aluno ou responsável.</p>
                    )}
                    {l.fundingSource === 'ASAAS_SUBSCRIPTION' &&
                      ['CONFIRMED', 'COMPLETED'].includes(l.status) && (
                        <p>
                          Para cancelamento ou contestação desta aula, use “Relatar problema” ou
                          procure o suporte.
                        </p>
                      )}
                    {l.teacherId === firebaseUser?.uid && l.status === 'CONFIRMED' && (
                      <button
                        disabled={busy}
                        onClick={() =>
                          void action(
                            () => post('/api/lessons/' + l.id + '/complete', {}),
                            'Aula concluída',
                          )
                        }
                      >
                        Concluir aula
                      </button>
                    )}
                  </div>
                  {l.status === 'COMPLETED' && l.teacherId === firebaseUser?.uid && (
                    <form
                      className="space-y-3"
                      onSubmit={async (e) => {
                        e.preventDefault();
                        const data = new FormData(e.currentTarget);
                        await action(
                          () =>
                            post('/api/lessons/' + l.id + '/notes', {
                              notes: data.get('notes'),
                              homework: data.get('homework'),
                            }),
                          'Registro pedagógico salvo',
                        );
                      }}
                    >
                      <label>
                        Registro pedagógico
                        <textarea name="notes" required maxLength={2000} />
                      </label>
                      <label>
                        Tarefa
                        <textarea name="homework" maxLength={1000} />
                      </label>
                      <button disabled={busy}>Salvar desenvolvimento</button>
                    </form>
                  )}
                  {l.status === 'COMPLETED' && l.payerId === firebaseUser?.uid && (
                    <form
                      className="flex gap-3 flex-wrap"
                      onSubmit={async (e) => {
                        e.preventDefault();
                        const data = new FormData(e.currentTarget);
                        await action(
                          () =>
                            post('/api/lessons/' + l.id + '/review', {
                              rating: Number(data.get('rating')),
                              comment: data.get('comment'),
                            }),
                          'Avaliação registrada',
                        );
                      }}
                    >
                      <label>
                        Nota
                        <select name="rating">
                          {[5, 4, 3, 2, 1].map((n) => (
                            <option key={n}>{n}</option>
                          ))}
                        </select>
                      </label>
                      <label>
                        Comentário
                        <input name="comment" maxLength={1000} />
                      </label>
                      <button disabled={busy}>Avaliar aula</button>
                    </form>
                  )}
                  <details>
                    <summary>Relatar problema</summary>
                    <form
                      className="space-y-3"
                      onSubmit={async (e) => {
                        e.preventDefault();
                        const data = new FormData(e.currentTarget);
                        await action(
                          () =>
                            post('/api/safety/reports', {
                              lessonId: l.id,
                              details: data.get('details'),
                            }),
                          'Relato enviado para acompanhamento',
                        );
                      }}
                    >
                      <label>
                        O que aconteceu?
                        <textarea name="details" required minLength={10} maxLength={2000} />
                      </label>
                      <button disabled={busy}>Enviar relato</button>
                    </form>
                  </details>
                </article>
              ))}
            {!lessons.length && <p>Você ainda não tem aulas reservadas.</p>}
          </section>
        ) : tab === 'payments' ? (
          <section className="card space-y-4">
            <h1 className="text-2xl font-bold">Pagamentos</h1>
            <button disabled={busy} onClick={() => void action(refresh, 'Status atualizado')}>
              Atualizar status
            </button>
            <p>
              Pagamentos por aula no Checkout Pro. O servidor confirma o status após consulta ao
              Mercado Pago.
            </p>
            {role === 'TEACHER' && (
              <>
                <p>
                  A parcela estimada desconta 15% Talkê e ainda está sujeita às tarifas do Mercado
                  Pago. Consulte disponibilidade e retiradas na sua conta.
                </p>
                <a href="https://www.mercadopago.com.br/home" rel="noreferrer" target="_blank">
                  Abrir minha conta Mercado Pago
                </a>
              </>
            )}
            {payments.map((p) => (
              <div key={p.id} className="border-t pt-3">
                Aula {p.lessonId} · R$ {(p.amountCents / 100).toFixed(2)} ·{' '}
                {(
                  {
                    PENDING: 'Aguardando pagamento',
                    PAID: 'Pago',
                    REFUND_PENDING: 'Reembolso em acompanhamento',
                    REFUNDED: 'Reembolsado',
                    CANCELLED: 'Cancelado',
                    DISPUTED: 'Contestação',
                    PARTIAL_REFUND_REVIEW: 'Reembolso parcial em análise',
                  } as any
                )[p.status] || p.status}
              </div>
            ))}
            {!payments.length && <p>Não há pagamentos nesta conta.</p>}
          </section>
        ) : tab === 'privacy-panel' && subjectId ? (
          <PrivacyPanel subjectId={subjectId} />
        ) : tab === 'progress' ? (
          <section className="card space-y-4">
            <h1 className="text-2xl font-bold">Desenvolvimento</h1>
            {notes.map((n) => (
              <article className="border-t pt-4" key={n.id}>
                <p>{n.notes}</p>
                <p>Tarefa: {n.homework || 'Sem tarefa registrada'}</p>
                <small>{new Date(n.updatedAt).toLocaleDateString('pt-BR')}</small>
              </article>
            ))}
            {!notes.length && (
              <p>
                Ainda não há registros pedagógicos. Seu professor poderá registrar seu
                desenvolvimento após as aulas.
              </p>
            )}
          </section>
        ) : tab === 'materials' ? (
          <section className="space-y-4">
            <h1 className="text-2xl font-bold">Materiais para estudar</h1>
            {TALKE_CURRICULUM_MATERIALS.map((m) => (
              <details className="card" key={m.id}>
                <summary>
                  {m.title} · {m.cefr}
                </summary>
                <p>{m.objective}</p>
                {m.slides.map((s, i) => (
                  <article className="mt-4" key={i}>
                    <h2 className="font-bold">{s.title}</h2>
                    <ul>
                      {s.bullets.map((b, n) => (
                        <li key={n}>{b}</li>
                      ))}
                    </ul>
                    {s.example && <p>{s.example}</p>}
                    {s.exercisePrompt && <p>{s.exercisePrompt}</p>}
                  </article>
                ))}
              </details>
            ))}
          </section>
        ) : tab === 'admin' && session?.isAdmin ? (
          <AdminPanel />
        ) : (
          <p>Selecione uma opção disponível para sua conta.</p>
        )}
      </div>
      <footer className="border-t p-6 text-center text-sm">
        <a href="/planos">Planos mensais</a> · <a href="/privacidade">Aviso de privacidade</a> ·{' '}
        <a href="/termos">Termos de uso</a>
        <p>
          {config.legalName || 'Talkê em preparação'} · <SupportContacts config={config} />
        </p>
      </footer>
      {booking && student && (
        <BookingModal
          teacher={booking}
          currentStudent={student}
          usePlan={Boolean(bookingSubscription)}
          onClose={() => setBooking(null)}
          onConfirmBooking={async (data) => {
            const { requestKey, ...payload } = data;
            await post(
              bookingSubscription
                ? '/api/subscriptions/' + bookingSubscription.id + '/bookings'
                : '/api/lessons',
              { studentId: student.id, ...payload },
              { 'Idempotency-Key': requestKey },
            );
            await refresh();
            setBooking(null);
            setTab('lessons');
            setMessage(
              bookingSubscription
                ? 'Aula reservada com seu plano.'
                : 'Reserva criada. Pague antes de expirar o prazo de 30 minutos.',
            );
          }}
        />
      )}
      {purchase && student && (
        <SubscriptionPurchase
          plan={purchase}
          studentId={student.id}
          studentName={student.name}
          email={firebaseUser?.email || ''}
          sandbox={config.subscriptionsSandbox}
          onClose={() => setPurchase(null)}
          onSaved={refresh}
        />
      )}
      {profileTeacher && (
        <TeacherProfileModal
          monthlyOnly={config.subscriptionsEnabled && !config.paymentsEnabled}
          teacher={profileTeacher}
          reviews={[]}
          onClose={() => setProfileTeacher(null)}
          onBookClick={(teacher) => {
            setProfileTeacher(null);
            if (student && (config.paymentsEnabled || bookingSubscription)) setBooking(teacher);
            else if (student) {
              setMessage('Selecione um plano com aulas disponíveis antes de reservar.');
              setTab('plans');
            } else setMessage('Entre e conclua o cadastro para reservar.');
          }}
        />
      )}
      {room && (
        <Suspense fallback={<p role="status">Abrindo sala…</p>}>
          <VirtualClassroomModal
            lesson={room}
            userRole={role === 'TEACHER' ? UserRole.Teacher : UserRole.Student}
            currentUserName={session?.profile?.name || ''}
            onClose={() => setRoom(null)}
            onFinishLesson={async () => {}}
          />
        </Suspense>
      )}
    </div>
  );
}
