import { describe, it, expect } from 'vitest';
import { keystrokeSource, keyCodeSource } from '../src/keys/keystrokes.js';

describe('keystroke source generation', () => {
  it('builds modifier list', () => {
    const src = keystrokeSource('s', ['command']);
    expect(src).toContain(`keystroke('s'`);
    expect(src).toContain(`'command down'`);
  });
  it('builds key code call', () => {
    expect(keyCodeSource(36, [])).toContain('keyCode(36');
  });
  it('escapes single quotes in typed text', () => {
    expect(keystrokeSource("d'oh", [])).toContain("d\\'oh");
  });
});
