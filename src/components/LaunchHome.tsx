import React, { useEffect, useState } from 'react';
const date = (value: string) => value?.split('-').reverse().join('/');
export function LaunchHome({
  session,
  config,
  lessons,
  subscriptions,
  checkouts,
  subjectId,
  earnings,
  onNavigate,
  onEnter,
}: any) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, []);
  const profile = session?.profile,
    role = profile?.accountType;
  const mine = lessons.filter((l: any) => role === 'TEACHER' || l.studentId === subjectId);
  const upcoming = mine
    .filter(
      (l: any) =>
        l.isPaid &&
        ['CONFIRMED', 'IN_PROGRESS'].includes(l.status) &&
        l.scheduledAt + l.durationMinutes * 60_000 > now,
    )
    .sort((a: any, b: any) => a.scheduledAt - b.scheduledAt);
  const next = upcoming[0];
  const cycles = subscriptions.flatMap((s: any) => s.cycles).filter((c: any) => c.remaining > 0);
  const credits = cycles.reduce((n: number, c: any) => n + c.remaining, 0);
  const firstExpiry = [...cycles].sort((a: any, b: any) =>
    a.expiresOn.localeCompare(b.expiresOn),
  )[0];
  const pendingConfirmation = mine.filter(
    (l: any) =>
      l.fundingSource === 'ASAAS_SUBSCRIPTION' && l.status === 'COMPLETED' && !l.payerConfirmedAt,
  );
  return (
    <section className="space-y-6" aria-label="Resumo da sua conta">
      <header>
        <p className="text-sm text-blue-700">Sua Talkê</p>
        <h1 className="text-3xl font-bold">Olá, {profile?.name?.split(' ')[0] || 'bem-vindo'}!</h1>
        <p className="mt-2">
          {role === 'TEACHER'
            ? 'Sua agenda, aulas e repasses em um só lugar.'
            : role === 'GUARDIAN'
              ? 'Acompanhe as aulas do dependente selecionado.'
              : 'Seu próximo passo para aprender inglês.'}
        </p>
      </header>
      {session?.isAdmin && (
        <section className="card space-y-3">
          <h2 className="font-bold text-xl">Atendimento e operação</h2>
          <p>
            Acompanhe relatos de segurança, aprovações e operações financeiras na fila de
            prioridades.
          </p>
          <button onClick={() => onNavigate('admin')}>Administrar plataforma</button>
        </section>
      )}
      {role === 'GUARDIAN' && subjectId === profile?.id && (
        <div className="card space-y-3">
          <h2 className="font-bold">Selecione quem vai estudar</h2>
          <p>Escolha um dependente acima ou acompanhe seu cadastro na área Família.</p>
          <button onClick={() => onNavigate('family')}>Gerenciar família</button>
        </div>
      )}
      <div className="grid gap-4 md:grid-cols-3">
        <article className="card space-y-3 md:col-span-2">
          <h2 className="font-bold text-xl">Próxima aula</h2>
          {next ? (
            <>
              <p className="text-2xl font-bold text-blue-900">
                {date(next.scheduledDate)} às {next.startTime}
              </p>
              <p>
                {role === 'TEACHER' ? next.studentName : next.teacherName} · 50 minutos · horário de
                Brasília
              </p>
              {now >= next.scheduledAt - 10 * 60_000 ? (
                <button onClick={() => onEnter(next)}>Entrar na aula</button>
              ) : (
                <p>A entrada abre 10 minutos antes do início.</p>
              )}
              <button onClick={() => onNavigate('lessons')}>Ver minhas aulas</button>
            </>
          ) : (
            <>
              <p>Você ainda não tem uma próxima aula confirmada.</p>
              <button
                onClick={() =>
                  onNavigate(
                    role === 'TEACHER'
                      ? 'teacher-profile'
                      : credits || config.paymentsEnabled
                        ? 'teachers'
                        : 'plans',
                  )
                }
              >
                {role === 'TEACHER'
                  ? 'Ajustar disponibilidade'
                  : credits || config.paymentsEnabled
                    ? 'Agendar uma aula'
                    : subscriptions.some((s: any) => s.status !== 'CANCELLED')
                      ? 'Ver meu plano'
                      : 'Conhecer os planos'}
              </button>
            </>
          )}
        </article>
        <article className="card space-y-3">
          <h2 className="font-bold">
            {role === 'TEACHER' ? 'Realizações para confirmar' : 'Seu saldo de aulas'}
          </h2>
          <p className="text-4xl font-bold text-blue-900">
            {role === 'TEACHER' ? pendingConfirmation.length : credits}
          </p>
          <p>
            {role === 'TEACHER'
              ? 'Aulas aguardando confirmação do aluno ou responsável.'
              : 'Aulas disponíveis do aluno selecionado.'}
          </p>
          {firstExpiry && role !== 'TEACHER' && (
            <p>Primeira validade: antes de {date(firstExpiry.expiresOn)}.</p>
          )}
          <button onClick={() => onNavigate(role === 'TEACHER' ? 'payments' : 'plans')}>
            {role === 'TEACHER' ? 'Acompanhar repasses' : 'Ver plano e validades'}
          </button>
        </article>
      </div>
      {checkouts.length > 0 && (
        <div className="card space-y-2">
          <h2 className="font-bold">Sua contratação está em andamento</h2>
          <p>Acompanhe ou retome o pagamento do seu plano.</p>
          <button onClick={() => onNavigate('plans')}>Acompanhar contratação</button>
        </div>
      )}
      {pendingConfirmation.length > 0 && role !== 'TEACHER' && (
        <div className="card space-y-2">
          <h2 className="font-bold">Como foi sua aula?</h2>
          <p>
            Confirme a realização ou relate um problema em Minhas aulas. A confirmação permite
            seguir com o repasse ao professor.
          </p>
          <button onClick={() => onNavigate('lessons')}>Conferir aulas concluídas</button>
        </div>
      )}
      {role === 'TEACHER' && (
        <div className="card space-y-2">
          <h2 className="font-bold">R$ 40 por aula concluída e confirmada</h2>
          <p>
            {earnings?.recipientVerified
              ? 'Seu cadastro de recebimento está verificado.'
              : 'O suporte acompanha a verificação do seu cadastro para receber.'}{' '}
            Veja a situação de cada repasse na área Repasses.
          </p>
        </div>
      )}
    </section>
  );
}

export function FirstLessonJourney({
  session,
  verifiedEmail,
  role,
  hasPlan,
  hasLesson,
  pendingCheckout,
  config,
  onNavigate,
}: any) {
  const teacher = role === 'TEACHER';
  const steps = [
    { label: 'E-mail confirmado', done: verifiedEmail },
    { label: 'Cadastro e verificação', done: session?.profile?.status === 'ACTIVE' },
    teacher
      ? { label: 'Perfil profissional aprovado', done: session?.teacher?.isVerified }
      : {
          label: config.subscriptionsEnabled ? 'Plano contratado' : 'Escolha do professor',
          done: config.subscriptionsEnabled ? hasPlan : hasLesson,
        },
    {
      label: teacher ? 'Disponibilidade cadastrada' : 'Primeira aula agendada',
      done: teacher ? session?.teacher?.availability?.some((s: any) => s.isAvailable) : hasLesson,
    },
  ];
  if (steps.every((s) => s.done)) return null;
  return (
    <section className="card mb-6 space-y-3" aria-label="Seus próximos passos">
      <h2 className="font-bold text-lg">
        {teacher ? 'Prepare seu perfil para ensinar' : 'Vamos preparar sua primeira aula'}
      </h2>
      <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((step, i) => (
          <li key={step.label} className="rounded-xl bg-slate-50 p-3">
            <span className="font-semibold">
              {i + 1}. {step.label}
            </span>
            <p className="text-sm">
              {step.done
                ? 'Concluído'
                : i === 2 && pendingCheckout
                  ? 'Pagamento em acompanhamento'
                  : 'A concluir'}
            </p>
          </li>
        ))}
      </ol>
      <p className="text-sm">
        {session?.profile && session.profile.status !== 'ACTIVE'
          ? 'Sua verificação está em acompanhamento. O atendimento pode esclarecer a pendência e o próximo passo.'
          : 'Conclua as etapas para reservar e participar das aulas.'}
      </p>
      {session?.profile?.status === 'ACTIVE' && (
        <button
          onClick={() =>
            onNavigate(
              teacher
                ? 'teacher-profile'
                : config.subscriptionsEnabled && !hasPlan
                  ? 'plans'
                  : 'teachers',
            )
          }
        >
          {teacher
            ? 'Completar meu perfil'
            : config.subscriptionsEnabled && !hasPlan
              ? 'Escolher ou acompanhar meu plano'
              : 'Escolher professor e horário'}
        </button>
      )}
    </section>
  );
}
