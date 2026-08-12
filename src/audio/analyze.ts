import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { existsSync } from 'node:fs';
import ffmpegPath from 'ffmpeg-static';

const exec = promisify(execFile);

export interface BandEnergy { name: string; lowHz: number; highHz: number; rmsDb: number }
export interface AudioAnalysis {
  lufsIntegrated: number; lufsRange: number; truePeakDb: number;
  rmsDb: number; peakDb: number; durationSec: number; bands: BandEnergy[];
}

export const BANDS = [
  { name: 'lows', lowHz: 20, highHz: 120 },
  { name: 'low-mids', lowHz: 120, highHz: 500 },
  { name: 'mids', lowHz: 500, highHz: 2000 },
  { name: 'presence', lowHz: 2000, highHz: 5000 },
  { name: 'sibilance', lowHz: 5000, highHz: 9000 },
  { name: 'air', lowHz: 9000, highHz: 16000 },
] as const;

function num(m: RegExpMatchArray | null): number {
  if (!m) throw new Error('ffmpeg output missing expected field');
  const v = m[1];
  return v === '-inf' ? -120 : Math.round(parseFloat(v) * 10) / 10;
}

export function parseEbur128(s: string) {
  return {
    lufsIntegrated: num(s.match(/I:\s+(-?[\d.]+|-inf) LUFS/)),
    lufsRange: num(s.match(/LRA:\s+(-?[\d.]+|-inf) LU/)),
    truePeakDb: num(s.match(/Peak:\s+(-?[\d.]+|-inf) dBFS/)),
  };
}

export function parseAstats(s: string) {
  return {
    peakDb: num(s.match(/Peak level dB: (-?[\d.]+|-inf)/)),
    rmsDb: num(s.match(/RMS level dB: (-?[\d.]+|-inf)/)),
  };
}

export function parseDuration(s: string): number {
  const m = s.match(/Duration: (\d+):(\d+):(\d+\.?\d*)/);
  if (!m) throw new Error('ffmpeg output missing duration');
  return parseInt(m[1]) * 3600 + parseInt(m[2]) * 60 + parseFloat(m[3]);
}

async function ffmpegStderr(args: string[]): Promise<string> {
  try {
    const { stderr } = await exec(ffmpegPath as unknown as string, args, { maxBuffer: 32 * 1024 * 1024 });
    return stderr;
  } catch (e: unknown) {
    const err = e as { stderr?: string; message: string };
    if (err.stderr && /Summary|Overall|Duration/.test(err.stderr)) return err.stderr;
    throw new Error(`ffmpeg failed: ${err.message}`);
  }
}

export async function analyzeAudio(filePath: string): Promise<AudioAnalysis> {
  if (!existsSync(filePath)) throw new Error(`File not found: ${filePath}`);
  const main = await ffmpegStderr(['-hide_banner', '-i', filePath, '-af', 'astats=measure_perchannel=none,ebur128=peak=true', '-f', 'null', '-']);
  const bands: BandEnergy[] = [];
  for (const b of BANDS) {
    const s = await ffmpegStderr(['-hide_banner', '-i', filePath, '-af',
      `highpass=f=${b.lowHz}:poles=2,lowpass=f=${b.highHz}:poles=2,astats=measure_perchannel=none`, '-f', 'null', '-']);
    bands.push({ ...b, rmsDb: parseAstats(s).rmsDb });
  }
  return { ...parseEbur128(main), ...parseAstats(main), durationSec: parseDuration(main), bands };
}
