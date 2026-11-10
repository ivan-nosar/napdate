import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { promisify } from 'node:util';

const execute = promisify(execFile);
const cli = resolve('dist/cli.js');
const mock = resolve('test/fixtures/mock-registry.js');
const invoke = (cwd, ...args) => execute(process.execPath, ['--import', mock, cli, ...args], { cwd });

test('built CLI updates a synthetic project and supports dry-run and errors', async (t) => {
  const dir = await mkdtemp(join(tmpdir(), 'napdate-e2e-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const path = join(dir, 'package.json');
  const initial = '{\n  "name": "example",\n  "dependencies": {"foo": "^1"},\n  "devDependencies": {"bar": "~2"},\n  "optionalDependencies": {"opt": "1"}\n}\n';
  await writeFile(path, initial);
  const dry = await invoke(dir, 'NPM', '--dry-run', '--no-dev', '--no-optional');
  assert.equal(dry.stdout, '"foo": ^1 -> 3.2.1;\n');
  assert.equal(dry.stderr, '');
  assert.equal(await readFile(path, 'utf8'), initial);
  const update = await invoke(dir, 'npm', path, '-c', '2', '--no-optional');
  assert.equal(update.stdout, '');
  assert.equal(update.stderr, '');
  assert.deepEqual(JSON.parse(await readFile(path, 'utf8')), {
    name: 'example', dependencies: { foo: '3.2.1' }, devDependencies: { bar: '4.0.0' }, optionalDependencies: { opt: '1' },
  });
  const help = await invoke(dir, '--help');
  assert.match(help.stdout, /Usage:/);
  const error = await invoke(dir, 'npm', '--concurrent', '0').catch((err) => err);
  assert.equal(error.code, 1);
  assert.equal(error.stdout, '');
  assert.equal(error.stderr.trim().split('\n').length, 1);
  await writeFile(path, '{"dependencies":{"foo":"1","missing":"1"}}');
  const failure = await invoke(dir, 'npm').catch((err) => err);
  assert.equal(failure.code, 1);
  assert.match(failure.stderr, /Unable to resolve missing/);
  assert.equal(await readFile(path, 'utf8'), '{"dependencies":{"foo":"1","missing":"1"}}');
});
