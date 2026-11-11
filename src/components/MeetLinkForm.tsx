import React, { useState } from 'react';
import { post } from '../lib/apiClient';

export function MeetLinkForm({
  lessonId,
  onSaved,
}: {
  lessonId: string;
  onSaved: () => Promise<void>;
}) {
  const [message, setMessage] = useState(''),
    [busy, setBusy] = useState(false);
  return (
    <details className="rounded-xl border p-4">
      <summary className="cursor-pointer font-semibold">Preparar Google Meet desta aula</summary>
      <p className="text-sm my-3">
        Crie uma reunião nova para esta aula. Controle a entrada dos participantes e encerre a
        chamada para todos ao terminar. Links já compartilhados não são revogados pela Talkê.
      </p>
      <a href="https://meet.google.com/" target="_blank" rel="noopener noreferrer">
        Abrir Google Meet para criar a reunião
      </a>
      <form
        className="space-y-3 mt-3"
        onSubmit={async (e) => {
          e.preventDefault();
          const form = e.currentTarget,
            data = new FormData(form);
          setBusy(true);
          setMessage('');
          try {
            await post('/api/lessons/' + lessonId + '/video-link', {
              url: data.get('url'),
              hostControlsConfirmed: data.get('controls') === 'on',
            });
            setMessage(
              'Link salvo. A entrada é liberada na Talkê a partir de 10 minutos antes da aula.',
            );
            form.reset();
            await onSaved();
          } catch (error) {
            setMessage((error as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <label>
          Link exclusivo desta aula
          <input
            name="url"
            type="url"
            required
            placeholder="https://meet.google.com/abc-defg-hij"
          />
        </label>
        <label className="flex gap-2">
          <input name="controls" type="checkbox" required />
          Confirmo que este link é exclusivo e que vou admitir somente os participantes da aula e
          encerrar a chamada para todos.
        </label>
        <button disabled={busy}>{busy ? 'Salvando…' : 'Salvar link da aula'}</button>
        {message && <p role="status">{message}</p>}
      </form>
    </details>
  );
}
