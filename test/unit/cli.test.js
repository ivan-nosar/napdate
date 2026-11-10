import { test } from 'node:test';
import assert from 'node:assert/strict';

test('entry point reports errors once', async (t) => {
  const argv = process.argv;
  const exitCode = process.exitCode;
  const error = console.error;
  t.after(() => {
    process.argv = argv;
    process.exitCode = exitCode;
    console.error = error;
  });
  const messages = [];
  console.error = (message) => messages.push(message);
  process.argv = ['node', 'cli', 'unsupported'];
  await import('../../dist/cli.js');
  assert.deepEqual(messages, ['Expected project type: npm']);
  assert.equal(process.exitCode, 1);
});
