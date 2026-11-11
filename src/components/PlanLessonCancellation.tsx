import React, { useEffect, useState } from 'react';
import {
  canCancelPlanLesson,
  PLAN_LESSON_CANCELLATION_HOURS,
  PLAN_LESSON_CANCELLATION_MS,
} from '../domain/lessonPolicy';

export function PlanLessonCancellation({
  lesson,
  busy,
  onCancel,
  onRebook,
}: {
  lesson: { status: string; scheduledAt: number; cancellationCreditReturned?: boolean };
  busy: boolean;
  onCancel: () => void;
  onRebook: () => void;
}) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, []);
  if (lesson.status === 'CANCELLED' && lesson.cancellationCreditReturned)
    return (
      <div className="space-y-2">
        <p>O crédito desta aula foi devolvido ao plano, mantendo a validade vigente.</p>
        <button onClick={onRebook}>Agendar outro horário</button>
      </div>
    );
  if (lesson.status !== 'CONFIRMED') return null;
  const eligible = canCancelPlanLesson(lesson.scheduledAt, now);
  const deadline = Number.isFinite(lesson.scheduledAt)
    ? new Intl.DateTimeFormat('pt-BR', {
        timeZone: 'America/Sao_Paulo',
        dateStyle: 'short',
        timeStyle: 'short',
      }).format(lesson.scheduledAt - PLAN_LESSON_CANCELLATION_MS)
    : null;
  return (
    <details className="rounded-xl border p-3 space-y-3">
      <summary className="cursor-pointer font-semibold">Cancelar ou remarcar esta aula</summary>
      <p>
        Com pelo menos {PLAN_LESSON_CANCELLATION_HOURS} horas de antecedência, o crédito volta ao
        plano com a mesma validade. {deadline && <>Prazo: {deadline} (Brasília).</>}
      </p>
      <p>
        Para remarcar, cancele esta reserva e escolha outro horário no catálogo. A nova reserva
        depende da disponibilidade do professor e da validade do crédito. Isso não cancela a
        renovação nem reembolsa a mensalidade.
      </p>
      {eligible ? (
        <button disabled={busy} onClick={onCancel}>
          Confirmar cancelamento e devolver crédito
        </button>
      ) : (
        <p>
          O prazo de cancelamento automático terminou. Use Relatar problema abaixo ou procure o
          suporte. Pedidos tardios e faltas são analisados caso a caso, sem devolução de crédito nem
          repasse automático ao professor.
        </p>
      )}
    </details>
  );
}
