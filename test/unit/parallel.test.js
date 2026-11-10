import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parallelMap } from '../../dist/parallel.js';

test('limits concurrency, retains order and waits for all work on failure', async () => {
  let active = 0;
  let maximum = 0;
  const completed = [];
  const task = async (item) => {
    active++;
    maximum = Math.max(maximum, active);
    await new Promise((resolve) => setTimeout(resolve, 5));
    active--;
    completed.push(item);
    if (item === 2) throw new Error('failed');
    return item * 2;
  };
  await assert.rejects(parallelMap([1, 2, 3, 4], 2, task), /failed/);
  assert.equal(maximum, 2);
  assert.equal(completed.length, 4);
  assert.deepEqual(await parallelMap([3, 2, 1], 2, async (n) => n * 2), [6, 4, 2]);
  assert.deepEqual(await parallelMap([], 8, task), []);
});
