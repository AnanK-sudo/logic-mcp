import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { existsSync } from 'node:fs';
import ffmpegPath from 'ffmpeg-static';
import { runJxa, JxaError, AX_FIX } from '../ax/run-jxa.js';
import { JXA_PRELUDE } from '../ax/prelude.js';
import { LOGIC_PROCESS } from '../constants.js';

const exec = promisify(execFile);

export type Need = 'logic' | 'ax' | 'project' | 'ffmpeg' | 'mcu';

export interface StatusReport {
  logicRunning: boolean; axGranted: boolean; projectOpen: boolean; projectName: string | null;
  ffmpegOk: boolean; mcuConnected: boolean; mcuFeedback: boolean; fixes: string[];
}

let mcuCheck: () => Promise<{ connected: boolean; feedback: boolean }> =
  async () => ({ connected: false, feedback: false });
export function setMcuCheck(fn: typeof mcuCheck) { mcuCheck = fn; }

async function logicRunning(): Promise<boolean> {
  try { await exec('pgrep', ['-x', LOGIC_PROCESS]); return true; } catch { return false; }
}

async function axProbe(): Promise<{ granted: boolean; projectName: string | null }> {
  try {
    const name = await runJxa<string | null>(`${JXA_PRELUDE}
      if (!lp.exists()) return null;
      const wins = lp.windows();
      return wins.length ? lp.windows[0].name() : '';
    `);
    return { granted: true, projectName: name || null };
  } catch (e) {
    if (e instanceof JxaError && e.kind === 'ax-permission') return { granted: false, projectName: null };
    return { granted: true, projectName: null };
  }
}

export async function statusReport(): Promise<StatusReport> {
  const running = await logicRunning();
  const ax = running ? await axProbe() : { granted: false, projectName: null };
  const mcu = await mcuCheck();
  const ffmpegOk = typeof ffmpegPath === 'string' && existsSync(ffmpegPath);
  const fixes: string[] = [];
  if (!running) fixes.push('Open Logic Pro X and load a project.');
  if (running && !ax.granted) fixes.push(AX_FIX);
  if (running && ax.granted && !ax.projectName) fixes.push('Open a Logic project (File > Open).');
  if (!mcu.connected) fixes.push('MIDI port not open yet; call any transport tool once, then re-check.');
  else if (!mcu.feedback) fixes.push('Logic is not talking to the control surface. In Logic: Logic Pro X > Control Surfaces > Setup > New > Install > Mackie Designs Mackie Control > Add, then set both Output Port and Input Port to "Logic MCP".');
  if (!ffmpegOk) fixes.push('ffmpeg-static missing; run npm install in logic-mcp.');
  return {
    logicRunning: running, axGranted: ax.granted, projectOpen: !!ax.projectName,
    projectName: ax.projectName, ffmpegOk, mcuConnected: mcu.connected, mcuFeedback: mcu.feedback, fixes,
  };
}

export async function preflight(needs: Need[]): Promise<void> {
  const r = await statusReport();
  const failWith = (msg: string, fixes: string[]) => {
    const err = new Error(msg) as Error & { fixes: string[] };
    err.fixes = fixes;
    throw err;
  };
  for (const need of needs) {
    if (need === 'logic' && !r.logicRunning) failWith('Logic Pro X is not running.', r.fixes);
    if (need === 'ax' && !r.axGranted) failWith('Accessibility permission missing.', r.fixes);
    if (need === 'project' && !r.projectOpen) failWith('No Logic project open.', r.fixes);
    if (need === 'ffmpeg' && !r.ffmpegOk) failWith('ffmpeg unavailable.', r.fixes);
    if (need === 'mcu' && !r.mcuFeedback) failWith('Control surface link not verified.', r.fixes);
  }
}
