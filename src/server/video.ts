import { createHash } from 'node:crypto';
import type { Store, Row } from './store';
import type { RuntimeConfig } from './config';
import { ApiError, requireCondition } from './security';
export const roomName = (lessonId: string) =>
  'talke-' + createHash('sha256').update(lessonId).digest('hex').slice(0, 48);
export class VideoService {
  constructor(
    private readonly store: Store,
    private readonly config: RuntimeConfig,
  ) {}
  private async request(path: string, body?: unknown, method?: string) {
    const response = await fetch('https://api.daily.co/v1/' + path, {
      method: method || (body ? 'POST' : 'GET'),
      headers: {
        Authorization: 'Bearer ' + this.config.dailyKey,
        'Content-Type': 'application/json',
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
      signal: AbortSignal.timeout(8000),
    });
    return response;
  }
  async room(lesson: Row, uid: string, start: number, end: number) {
    requireCondition(
      this.config.dailyKey && /^[a-zA-Z0-9-]+$/.test(this.config.dailyDomain),
      503,
      'Sala de vídeo não configurada',
    );
    const name = roomName(lesson.id);
    let response = await this.request('rooms/' + name);
    if (response.status === 404) {
      response = await this.request('rooms', {
        name,
        privacy: 'private',
        properties: {
          nbf: Math.floor(start / 1000),
          exp: Math.floor(end / 1000),
          eject_at_room_exp: true,
          max_participants: 3,
          enable_recording: 'off',
          enable_prejoin_ui: true,
        },
      });
      if (response.status === 409) response = await this.request('rooms/' + name);
    }
    requireCondition(response.ok, 502, 'Sala de vídeo indisponível');
    const room = await response.json();
    requireCondition(
      room.privacy === 'private' && room.name === name,
      502,
      'Configuração da sala inválida',
    );
    const result = await this.request('meeting-tokens', {
      properties: {
        room_name: name,
        user_id: uid,
        is_owner: uid === lesson.teacherId,
        nbf: Math.floor(start / 1000),
        exp: Math.floor(end / 1000),
        eject_at_token_exp: true,
        enable_recording: 'off',
        enable_recording_ui: false,
      },
    });
    requireCondition(result.ok, 502, 'Token da sala indisponível');
    const token = await result.json();
    requireCondition(typeof token.token === 'string', 502, 'Token da sala inválido');
    return {
      roomUrl: 'https://' + this.config.dailyDomain + '.daily.co/' + name,
      token: token.token,
    };
  }
  async close(lessonId: string) {
    if (!this.config.dailyKey) return;
    const id = roomName(lessonId);
    await this.store.transaction(async (tx) =>
      tx.set('room_closures', {
        id,
        lessonId,
        status: 'PENDING',
        createdAt: new Date().toISOString(),
      }),
    );
    const response = await this.request('rooms/' + id, undefined, 'DELETE');
    if (!response.ok && response.status !== 404)
      throw new ApiError(
        502,
        'Acesso bloqueado; encerramento da sala exige acompanhamento do suporte',
      );
    await this.store.transaction(async (tx) => tx.remove('room_closures', id));
  }
  async closeSubject(uid: string) {
    const [student, teacher, payer] = await Promise.all(
      ['studentId', 'teacherId', 'payerId'].map((field) => this.store.find('lessons', field, uid)),
    );
    const active = [
      ...new Map(
        [...student, ...teacher, ...payer]
          .filter((l) => ['REQUESTED', 'CONFIRMED', 'IN_PROGRESS', 'CANCELLED'].includes(l.status))
          .map((l) => [l.id, l]),
      ).values(),
    ];
    const results = await Promise.allSettled(active.map((l) => this.close(l.id)));
    if (results.some((r) => r.status === 'rejected'))
      throw new ApiError(502, 'Acesso bloqueado; algumas salas exigem acompanhamento do suporte');
  }
  async retryClosures() {
    const pending = await this.store.find('room_closures', 'status', 'PENDING');
    for (const row of pending) await this.close(row.lessonId);
  }
}
