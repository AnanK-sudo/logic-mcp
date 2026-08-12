import { describe, it, expect } from 'vitest';
import { parseEbur128, parseAstats, parseDuration } from '../src/audio/analyze.js';

const EBUR = `[Parsed_ebur128_0 @ 0x1] Summary:

  Integrated loudness:
    I:         -16.2 LUFS
    Threshold: -26.6 LUFS

  Loudness range:
    LRA:        3.1 LU
    Threshold: -36.6 LUFS
    LRA low:   -18.0 LUFS
    LRA high:  -14.9 LUFS

  True peak:
    Peak:       -1.4 dBFS`;

const ASTATS = `[Parsed_astats_0 @ 0x2] Overall
[Parsed_astats_0 @ 0x2] Peak level dB: -1.213456
[Parsed_astats_0 @ 0x2] RMS level dB: -18.334512`;

describe('ffmpeg parsers', () => {
  it('parses ebur128 summary', () => {
    expect(parseEbur128(EBUR)).toEqual({ lufsIntegrated: -16.2, lufsRange: 3.1, truePeakDb: -1.4 });
  });
  it('parses astats overall', () => {
    expect(parseAstats(ASTATS)).toEqual({ peakDb: -1.2, rmsDb: -18.3 });
  });
  it('parses duration', () => {
    expect(parseDuration('  Duration: 00:03:24.12, start')).toBeCloseTo(204.12);
  });
  it('handles -inf RMS as -120', () => {
    expect(parseAstats('x] Peak level dB: -inf\nx] RMS level dB: -inf')).toEqual({ peakDb: -120, rmsDb: -120 });
  });
});
