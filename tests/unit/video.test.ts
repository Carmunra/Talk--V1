import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fixture } from '../support/fixture';
import { VideoService, roomName } from '../../src/server/video';
test('video service creates only private expiring rooms and scoped nonrecording tokens', async () => {
  const f = await fixture();
  f.config.dailyKey = 'daily-secret';
  f.config.dailyDomain = 'test';
  const service = new VideoService(f.store, f.config),
    original = globalThis.fetch,
    calls: any[] = [];
  globalThis.fetch = async (url, options) => {
    calls.push({
      url: String(url),
      options,
      body: options?.body ? JSON.parse(String(options.body)) : null,
    });
    if (!options?.method || options.method === 'GET') return new Response('{}', { status: 404 });
    if (String(url).endsWith('/rooms'))
      return new Response(JSON.stringify({ privacy: 'private', name: roomName('lesson') }));
    return new Response(JSON.stringify({ token: 'individual-token' }));
  };
  try {
    const result = await service.room(
      { id: 'lesson', teacherId: 'teacher' },
      'student',
      1000,
      2000,
    );
    assert.equal(result.token, 'individual-token');
    assert.ok(result.roomUrl.startsWith('https://test.daily.co/'));
    assert.equal(calls[1].body.privacy, 'private');
    assert.equal(calls[1].body.properties.enable_recording, 'off');
    assert.equal(calls[2].body.properties.is_owner, false);
    assert.equal(calls[2].body.properties.room_name, roomName('lesson'));
    assert.equal(calls[2].body.properties.user_id, 'student');
    assert.equal(calls[2].body.properties.exp, 2);
    assert.equal(calls[2].body.properties.eject_at_token_exp, true);
  } finally {
    globalThis.fetch = original;
  }
});
test('video service refuses a public existing room and never invents a fallback URL', async () => {
  const f = await fixture();
  f.config.dailyKey = 'key';
  f.config.dailyDomain = 'test';
  const original = globalThis.fetch;
  globalThis.fetch = async () =>
    new Response(JSON.stringify({ name: roomName('lesson'), privacy: 'public' }));
  try {
    await assert.rejects(() =>
      new VideoService(f.store, f.config).room(
        { id: 'lesson', teacherId: 'teacher' },
        'student',
        1000,
        2000,
      ),
    );
  } finally {
    globalThis.fetch = original;
  }
});
test('failed room closure remains queued and is retried until the provider confirms removal', async () => {
  const f = await fixture();
  f.config.dailyKey = 'key';
  const service = new VideoService(f.store, f.config),
    original = globalThis.fetch;
  globalThis.fetch = async () => new Response('{}', { status: 503 });
  try {
    await assert.rejects(() => service.close('lesson'));
    assert.equal((await f.store.find('room_closures', 'status', 'PENDING')).length, 1);
    globalThis.fetch = async (_url, options) => {
      assert.equal(options?.method, 'DELETE');
      return new Response('{}', { status: 404 });
    };
    await service.retryClosures();
    assert.equal((await f.store.find('room_closures', 'status', 'PENDING')).length, 0);
  } finally {
    globalThis.fetch = original;
  }
});
