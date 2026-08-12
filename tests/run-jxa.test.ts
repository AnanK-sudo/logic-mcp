import { describe, it, expect } from 'vitest';
import { runJxa, JxaError } from '../src/ax/run-jxa.js';
import { JXA_PRELUDE } from '../src/ax/prelude.js';

describe('runJxa', () => {
  it('round-trips JSON args and result', async () => {
    const r = await runJxa<number>('return args.a + args.b;', { a: 2, b: 3 });
    expect(r).toBe(5);
  });
  it('returns null for undefined', async () => {
    expect(await runJxa('const x = 1;')).toBeNull();
  });
  it('classifies script errors', async () => {
    await expect(runJxa('throw new Error("boom");')).rejects.toMatchObject({ kind: 'script' });
  });
  it('classifies timeouts', async () => {
    await expect(runJxa('delay(3); return 1;', null, 500)).rejects.toMatchObject({ kind: 'timeout' });
  });
  it('classifies no-process sentinel', async () => {
    await expect(runJxa("throw new Error('NO_PROCESS: X is not running');")).rejects.toMatchObject({ kind: 'no-process' });
  });
});
