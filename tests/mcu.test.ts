import { describe, it, expect } from 'vitest';
import { NOTE, press, fader, vpot } from '../src/midi/mcu.js';

describe('MCU encoding', () => {
  it('encodes button press+release', () => {
    expect(press(NOTE.PLAY)).toEqual([[0x90, 0x5e, 0x7f], [0x90, 0x5e, 0x00]]);
  });
  it('encodes fader move with touch wrap, 14-bit split', () => {
    expect(fader(0, 8192)).toEqual([
      [0x90, 0x68, 0x7f],
      [0xe0, 0x00, 0x40],
      [0x90, 0x68, 0x00],
    ]);
  });
  it('clamps fader range', () => {
    expect(fader(1, 99999)[1]).toEqual([0xe1, 0x7f, 0x7f]);
  });
  it('encodes vpot direction and magnitude', () => {
    expect(vpot(2, 3)).toEqual([[0xb0, 0x12, 0x03]]);
    expect(vpot(2, -1)).toEqual([[0xb0, 0x12, 0x41]]);
  });
});
