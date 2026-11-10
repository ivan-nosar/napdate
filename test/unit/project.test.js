import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Project } from '../../dist/project.js';

test('validates paths and manifests and preserves unrelated fields', async (t) => {
  const dir = await mkdtemp(join(tmpdir(), 'napdate-unit-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const path = join(dir, 'package.json');
  await assert.rejects(Project.load(dir), /Invalid project/);
  await assert.rejects(Project.load(join(dir, 'missing')), /Invalid project/);
  await writeFile(join(dir, 'other.json'), '{}');
  await assert.rejects(Project.load(join(dir, 'other.json')), /package.json file/);
  for (const content of [Buffer.from([0xff]), '{', '[]', '{}', '{"dependencies":[]}', '{"dependencies":{"x":1}}', '{"dependencies":{},"devDependencies":null}', '{"dependencies":{},"optionalDependencies":[]}']) {
    await writeFile(path, content);
    await assert.rejects(Project.load(path), /Invalid project/);
  }
  await writeFile(path, '{\r\n\t"name": "example",\r\n\t"dependencies": {"foo": "^1"},\r\n\t"devDependencies": {"bar": "~2"}\r\n}\r\n');
  const project = await Project.load(dir);
  assert.deepEqual(project.entries(['dependencies', 'optionalDependencies']), [{ name: 'foo', version: '^1' }]);
  await project.update(['dependencies', 'devDependencies', 'optionalDependencies'], new Map([['foo', '3.0.0']]));
  const result = await readFile(path, 'utf8');
  assert.ok(result.includes('\r\n\t"name"'));
  assert.ok(result.endsWith('\r\n'));
  assert.deepEqual(JSON.parse(result), { name: 'example', dependencies: { foo: '3.0.0' }, devDependencies: { bar: '~2' } });
});
