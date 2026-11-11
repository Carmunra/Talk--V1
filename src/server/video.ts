import { createHash } from 'node:crypto';
import type { Store, Row } from './store';
import type { RuntimeConfig } from './config';
import { ApiError, requireCondition } from './security';
import { z } from 'zod';
import { isGoogleMeetUrl } from '../domain/meetingLinks';
export const roomName = (lessonId: string) =>
  'talke-' + createHash('sha256').update(lessonId).digest('hex').slice(0, 48);
export class VideoService {
  constructor(
    private readonly store: Store,
    private readonly config: RuntimeConfig,
    private readonly now: () => number = Date.now,
  ) {}
  async setMeetLink(uid: string, lessonId: string, raw: unknown) {
    requireCondition(
      this.config.videoProvider === 'google_meet',
      409,
      'Google Meet não está selecionado',
    );
    const input = z
      .object({
        url: z
          .string()
          .trim()
          .refine(isGoogleMeetUrl, 'Use o link direto https://meet.google.com/abc-defg-hij'),
        hostControlsConfirmed: z.literal(true),
      })
      .strict()
      .parse(raw);
    await this.store.transaction(async (tx) => {
      const lesson = await tx.get('lessons', lessonId);
      const profile = await tx.get('profiles', uid);
      const teacher = await tx.get('teachers', uid);
      const existing = await tx.get('lesson_video_links', lessonId);
      const hash = createHash('sha256').update(input.url).digest('hex');
      const claim = await tx.get('meet_link_claims', hash);
      requireCondition(
        lesson?.teacherId === uid &&
          profile?.accountType === 'TEACHER' &&
          profile.status === 'ACTIVE' &&
          profile.termsVersion === this.config.termsVersion &&
          teacher?.isVerified,
        403,
        'Somente o professor aprovado desta aula pode definir o link',
      );
      requireCondition(
        lesson.isPaid &&
          ['CONFIRMED', 'IN_PROGRESS'].includes(lesson.status) &&
          this.now() <= lesson.scheduledAt + (lesson.durationMinutes + 15) * 60_000,
        409,
        'Aula não disponível para configurar a chamada',
      );
      requireCondition(
        !claim || existing?.url === input.url,
        409,
        'Este link já foi usado. Crie uma reunião exclusiva para esta aula',
      );
      // A hash-only tombstone prevents reuse without retaining the URL or participant identities.
      tx.set('meet_link_claims', { id: hash });
      tx.set('lesson_video_links', {
        id: lessonId,
        url: input.url,
        status: 'READY',
        expiresAt: lesson.scheduledAt + (lesson.durationMinutes + 15) * 60_000,
        updatedAt: new Date(this.now()).toISOString(),
      });
    });
    return { configured: true };
  }
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
    if (this.config.videoProvider === 'google_meet') {
      const link = await this.store.get('lesson_video_links', lesson.id);
      requireCondition(
        link?.status === 'READY' && isGoogleMeetUrl(link.url) && link.expiresAt >= this.now(),
        409,
        'O professor ainda precisa preparar o link desta aula',
      );
      return { provider: 'google_meet' as const, roomUrl: link.url, accessEndsAt: end };
    }
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
      provider: 'daily' as const,
      roomUrl: 'https://' + this.config.dailyDomain + '.daily.co/' + name,
      token: token.token,
    };
  }
  async close(lessonId: string) {
    await this.store.transaction(async (tx) => {
      const link = await tx.get('lesson_video_links', lessonId);
      if (link) tx.remove('lesson_video_links', lessonId);
    });
    // Meet access is removed in Talkê. Ending the external call remains the host's duty.
    if (this.config.videoProvider === 'google_meet') {
      await this.store.transaction(async (tx) => tx.remove('room_closures', lessonId));
      return;
    }
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
    await this.store.transaction(async (tx) => {
      tx.remove('room_closures', id);
      tx.remove('room_closures', lessonId);
    });
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
    const links = await this.store.find('lesson_video_links', 'status', 'READY');
    for (const link of links)
      if (link.expiresAt < this.now())
        await this.store.transaction(async (tx) => {
          const fresh = await tx.get('lesson_video_links', link.id);
          if (fresh && fresh.expiresAt < this.now()) tx.remove('lesson_video_links', link.id);
        });
    const pending = await this.store.find('room_closures', 'status', 'PENDING');
    for (const row of pending) await this.close(row.lessonId);
  }
}
