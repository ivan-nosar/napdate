import { test } from 'node:test';
import assert from 'node:assert/strict';
import { latestVersion } from '../../dist/registry.js';

test('fetches encoded names and retries transient failures', async (t) => {
  const original = globalThis.fetch;
  t.after(() => { globalThis.fetch = original; });
  let calls = 0;
  globalThis.fetch = async (url) => {
    assert.equal(url, 'https://registry.npmjs.org/%40scope%2Fpkg/latest');
    calls++;
    if (calls === 1) throw new Error('network');
    if (calls === 2) return new Response('', { status: 429 });
    return Response.json({ version: '2.1.0' });
  };
  assert.equal(await latestVersion('@scope/pkg'), '2.1.0');
  assert.equal(calls, 3);
});

test('fails explicitly for permanent and exhausted errors', async (t) => {
  const original = globalThis.fetch;
  t.after(() => { globalThis.fetch = original; });
  for (const response of [new Response('', { status: 404 }), Response.json({ version: '^1.0.0' }), Response.json({})]) {
    let calls = 0;
    globalThis.fetch = async () => { calls++; return response; };
    await assert.rejects(latestVersion('bad'), /Unable to resolve bad/);
    assert.equal(calls, 1);
  }
  let calls = 0;
  globalThis.fetch = async () => { calls++; return new Response('', { status: 500 }); };
  await assert.rejects(latestVersion('bad'), /HTTP 500/);
  assert.equal(calls, 4);
  globalThis.fetch = async () => { throw 'offline'; };
  await assert.rejects(latestVersion('bad'), /offline/);
});
