import React, { useEffect, useRef, useState } from 'react';
import DailyIframe from '@daily-co/daily-js';
import { api } from '../lib/apiClient';
import { Lesson, UserRole } from '../domain/types';
interface Props {
  lesson: Lesson;
  userRole: UserRole;
  currentUserName: string;
  onClose: () => void;
  onFinishLesson: (id: string, notes: string) => Promise<void>;
}
export function VirtualClassroomModal({ lesson, onClose }: Props) {
  const host = useRef<HTMLDivElement>(null),
    [error, setError] = useState('');
  useEffect(() => {
    let cancelled = false;
    let call: ReturnType<typeof DailyIframe.createFrame> | undefined;
    (async () => {
      try {
        const result = await api<{ roomUrl: string; token: string }>(
          '/api/lessons/' + lesson.id + '/room',
          { method: 'POST' },
        );
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
  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col">
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
      ) : (
        <div ref={host} className="flex-1" />
      )}
    </div>
  );
}
