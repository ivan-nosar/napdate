import { test } from 'node:test';
import assert from 'node:assert/strict';

test('entry point reports non-Error failures', async (t) => {
  const argv = process.argv;
  const log = console.log;
  const error = console.error;
  const exitCode = process.exitCode;
  t.after(() => {
    process.argv = argv;
    console.log = log;
    console.error = error;
    process.exitCode = exitCode;
  });
  let output;
  console.log = () => { throw 'output failed'; };
  console.error = (message) => { output = message; };
  process.argv = ['node', 'cli', '--help'];
  await import('../../dist/cli.js');
  assert.equal(output, 'output failed');
  assert.equal(process.exitCode, 1);
});
