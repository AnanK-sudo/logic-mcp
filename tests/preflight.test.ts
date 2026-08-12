import { describe, it, expect } from 'vitest';
import { preflight } from '../src/preflight/preflight.js';

describe('preflight', () => {
  it('ffmpeg check passes (ffmpeg-static bundled)', async () => {
    await expect(preflight(['ffmpeg'])).resolves.toBeUndefined();
  });
  it('reports fix instructions when logic is not among running processes', async () => {
    const { statusReport } = await import('../src/preflight/preflight.js');
    const r = await statusReport();
    expect(typeof r.logicRunning).toBe('boolean');
    if (!r.logicRunning) expect(r.fixes.join(' ')).toContain('Logic');
  });
});
