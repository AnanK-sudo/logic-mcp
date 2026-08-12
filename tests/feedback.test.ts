import { describe, it, expect } from 'vitest';
import { McuState } from '../src/midi/feedback.js';

function lcdSysex(pos: number, text: string): number[] {
  return [0xf0, 0x00, 0x00, 0x66, 0x14, 0x12, pos, ...[...text].map(c => c.charCodeAt(0)), 0xf7];
}

describe('McuState', () => {
  it('decodes LCD sysex into lines and cells', () => {
    const s = new McuState();
    s.ingest(lcdSysex(0, 'Vocal 1'));
    s.ingest(lcdSysex(7, 'Beat   '));
    expect(s.lcdCell(0, 0)).toBe('Vocal 1');
    expect(s.lcdCell(0, 1)).toBe('Beat');
  });
  it('decodes second line at offset 56', () => {
    const s = new McuState();
    s.ingest(lcdSysex(56, ' -6.3dB'));
    expect(s.lcdCell(1, 0)).toBe('-6.3dB');
  });
  it('decodes meters from channel pressure', () => {
    const s = new McuState();
    s.ingest([0xd0, (2 << 4) | 9]);
    expect(s.meters[2]).toBe(9);
  });
  it('tracks LED state from note feedback', () => {
    const s = new McuState();
    s.ingest([0x90, 0x5e, 0x7f]);
    expect(s.led(0x5e)).toBe(true);
    s.ingest([0x90, 0x5e, 0x00]);
    expect(s.led(0x5e)).toBe(false);
  });
  it('decodes timecode digit CCs (0x49 = leftmost) and parses bar', () => {
    const s = new McuState();
    const text = ' 12  1 1 1';
    [...text].forEach((c, i) => s.ingest([0xb0, 0x49 - i, c.charCodeAt(0)]));
    expect(s.timecode()).toBe(text);
    expect(s.currentBar()).toBe(12);
  });
  it('records lastFeedbackAt', () => {
    const s = new McuState();
    expect(s.lastFeedbackAt).toBeNull();
    s.ingest([0xd0, 0x01]);
    expect(s.lastFeedbackAt).not.toBeNull();
  });
});
