import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { run } from '../../dist/app.js';

test('updates selected sections only after all resolutions succeed', async (t) => {
  const dir = await mkdtemp(join(tmpdir(), 'napdate-app-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const path = join(dir, 'package.json');
  const original = JSON.stringify({ dependencies: { foo: '^1', shared: '1' }, devDependencies: { shared: '~1', bad: '1' }, optionalDependencies: { opt: '1' } });
  await writeFile(path, original);
  const fetch = globalThis.fetch;
  t.after(() => { globalThis.fetch = fetch; });
  const calls = [];
  globalThis.fetch = async (url) => {
    calls.push(url);
    if (url.includes('/bad/')) return new Response('', { status: 404 });
    return Response.json({ version: '2.0.0' });
  };
  await assert.rejects(run(['npm', path]), /bad/);
  assert.equal(await readFile(path, 'utf8'), original);
  const output = [];
  await run(['npm', path, '--dry-run', '--no-dev', '--no-optional'], (line) => output.push(line));
  assert.deepEqual(output, ['"foo": ^1 -> 2.0.0;', '"shared": 1 -> 2.0.0;']);
  assert.equal(await readFile(path, 'utf8'), original);
  calls.length = 0;
  await run(['npm', path, '--no-dev', '--no-optional']);
  assert.equal(calls.length, 2);
  assert.deepEqual(JSON.parse(await readFile(path, 'utf8')), {
    dependencies: { foo: '2.0.0', shared: '2.0.0' }, devDependencies: { shared: '~1', bad: '1' }, optionalDependencies: { opt: '1' },
  });
  await run(['npm', path, '--no-deps', '--no-dev', '--no-optional']);
  await run(['--help'], (line) => assert.match(line, /Usage/));
});
