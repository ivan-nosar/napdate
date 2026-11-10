import { test } from 'node:test';
import assert from 'node:assert/strict';
import { helpText, parseArguments } from '../../dist/arguments.js';

test('parses help, defaults, case-insensitive type and all options', () => {
  assert.deepEqual(parseArguments(['-h']), { help: 'generic' });
  assert.deepEqual(parseArguments(['--help']), { help: 'generic' });
  assert.deepEqual(parseArguments(['npm', '--help']), { help: 'npm' });
  assert.deepEqual(parseArguments(['NPM']), { options: {
    location: '.', dryRun: false, concurrent: 8,
    sections: ['dependencies', 'devDependencies', 'optionalDependencies'],
  } });
  assert.deepEqual(parseArguments(['npm', './project', '-d', '-c', '100', '--no-deps', '--no-dev', '--no-optional']), {
    options: { location: './project', dryRun: true, concurrent: 100, sections: [] },
  });
  assert.equal(parseArguments(['npm', '--dry-run', '--concurrent', '1']).options.concurrent, 1);
  assert.match(helpText('generic'), /Usage:/);
  assert.match(helpText('npm'), /--no-optional/);
});

test('rejects invalid arguments', () => {
  for (const args of [[], ['yarn'], ['--help', 'npm'], ['npm', '--bad'], ['npm', 'one', 'two']]) {
    assert.throws(() => parseArguments(args));
  }
  for (const value of [undefined, '0', '101', '-1', '1.5', '2x', '']) {
    assert.throws(() => parseArguments(['npm', '-c', ...(value === undefined ? [] : [value])]), /Concurrency/);
  }
});
