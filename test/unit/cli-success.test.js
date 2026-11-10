import { test } from 'node:test';
import assert from 'node:assert/strict';

test('entry point prints help', async (t) => {
  const argv = process.argv;
  const log = console.log;
  t.after(() => { process.argv = argv; console.log = log; });
  let output;
  console.log = (message) => { output = message; };
  process.argv = ['node', 'cli', '--help'];
  await import('../../dist/cli.js');
  assert.match(output, /Usage:/);
});
