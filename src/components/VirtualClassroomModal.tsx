import React, { useEffect, useRef, useState } from 'react';
import type { DailyCall } from '@daily-co/daily-js';
import { isGoogleMeetUrl } from '../domain/meetingLinks';
import { api } from '../lib/apiClient';
import { Lesson, UserRole } from '../domain/types';
import { useDialog } from '../lib/useDialog';
interface Props {
  lesson: Lesson;
  userRole: UserRole;
  currentUserName: string;
  onClose: () => void;
  onFinishLesson: (id: string, notes: string) => Promise<void>;
}
export function VirtualClassroomModal({ lesson, onClose }: Props) {
  const dialog = useDialog(onClose);
  const host = useRef<HTMLDivElement>(null),
    [error, setError] = useState(''),
    [meet, setMeet] = useState<{ url: string; expiresAt: number } | null>(null);
  useEffect(() => {
    let cancelled = false;
    let call: DailyCall | undefined;
    (async () => {
      try {
        const result = await api<{
          provider?: string;
          roomUrl: string;
          token?: string;
          accessEndsAt?: number;
        }>('/api/lessons/' + lesson.id + '/room', { method: 'POST' });
        if (cancelled) return;
        if (result.provider === 'google_meet') {
          if (!isGoogleMeetUrl(result.roomUrl) || !Number.isFinite(result.accessEndsAt))
            throw new Error('Não foi possível validar o link desta aula. Procure o suporte.');
          setMeet({ url: result.roomUrl, expiresAt: result.accessEndsAt! });
          return;
        }
        const { default: DailyIframe } = await import('@daily-co/daily-js');
        if (cancelled || !host.current) return;
        call = DailyIframe.createFrame(host.current, {
          iframeStyle: { width: '100%', height: '100%', border: '0' },
          showLeaveButton: true,
        });
        call.on('left-meeting', onClose);
        await call.join({ url: result.roomUrl, token: result.token });
      } catch (error) {
        if (!cancelled) setError((error as Error).message);
      }
    })();
    return () => {
      cancelled = true;
      if (call) void call.destroy();
    };
  }, [lesson.id]);
  useEffect(() => {
    if (!meet) return;
    const timer = window.setTimeout(
      () => {
        setMeet(null);
        setError(
          'O período de entrada pela Talkê terminou. O professor deve encerrar a chamada no Meet.',
        );
      },
      Math.max(0, meet.expiresAt - Date.now()),
    );
    return () => window.clearTimeout(timer);
  }, [meet]);
  return (
    <div
      ref={dialog}
      role="dialog"
      aria-modal="true"
      aria-label="Sala de aula privada"
      tabIndex={-1}
      className="fixed inset-0 z-50 bg-slate-950 flex flex-col"
    >
      <div className="p-4 text-white flex justify-between">
        <span>
          Aula privada · {lesson.scheduledDate} {lesson.startTime} (Brasília)
        </span>
        <button onClick={onClose}>Fechar sala</button>
      </div>
      {error ? (
        <p role="alert" className="p-6 text-white">
          {error}
        </p>
      ) : meet ? (
        <section className="m-auto max-w-lg bg-white rounded-2xl p-6 space-y-4">
          <h1 className="text-2xl font-bold">Sua aula no Google Meet</h1>
          <p>
            A chamada abre em outra aba. Volte à Talkê ao terminar para acompanhar a aula e sua
            confirmação.
          </p>
          <a
            className="inline-block rounded-xl bg-blue-700 px-5 py-3 text-white"
            href={meet.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            Abrir aula no Google Meet
          </a>
          <p className="text-sm">
            O professor controla a entrada e o encerramento no Meet. Fechar esta janela não encerra
            a chamada externa.
          </p>
        </section>
      ) : (
        <div ref={host} className="flex-1" />
      )}
    </div>
  );
}
