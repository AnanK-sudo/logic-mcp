import { existsSync, statSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { runJxa } from './run-jxa.js';
import { JXA_PRELUDE } from './prelude.js';
import { clickMenu } from './menus.js';
import { keystroke, keyCode, typeText } from '../keys/keystrokes.js';
import { sleep } from '../midi/mcu.js';

export const BOUNCE_MENU_PATH = ['File', 'Bounce', 'Project or Section…'];

export function bounceDestination(destDir: string, fileName: string) {
  const name = fileName.replace(/\.(wav|aiff|mp3)$/i, '');
  return { dir: destDir, name, full: join(destDir, `${name}.wav`) };
}

async function waitFor(cond: () => Promise<boolean>, timeoutMs: number, what: string): Promise<void> {
  const t0 = Date.now();
  while (Date.now() - t0 < timeoutMs) {
    if (await cond()) return;
    await sleep(400);
  }
  throw new Error(`Timed out waiting for ${what}`);
}

async function bounceDialogReady(): Promise<boolean> {
  return runJxa<boolean>(`${JXA_PRELUDE}
const els = lp.windows[0].entireContents();
for (const el of els) {
  try { if (el.role() === 'AXButton' && (el.name() === 'Bounce' || el.name() === 'OK')) return true; } catch (e) {}
}
return false;`);
}

async function configureDialogPcmWave(): Promise<void> {
  await runJxa(`${JXA_PRELUDE}
const els = lp.windows[0].entireContents();
for (const el of els) {
  try {
    if (el.role() === 'AXCheckBox' && el.name() === 'PCM' && Number(el.value()) !== 1) el.actions['AXPress'].perform();
    if (el.role() === 'AXCheckBox' && (el.name() === 'MP3' || el.name() === 'M4A: AAC') && Number(el.value()) === 1) el.actions['AXPress'].perform();
  } catch (e) {}
}
for (const el of els) {
  try {
    if (el.role() === 'AXPopUpButton' && /AIFF|Wave|CAF/i.test(String(el.value())) && String(el.value()) !== 'Wave') {
      el.actions['AXPress'].perform(); delay(0.3);
      lp.menus[0].menuItems['Wave'].click(); delay(0.3);
    }
  } catch (e) {}
}
return true;`, null, 20000);
}

async function clickDialogButton(name: string): Promise<boolean> {
  return runJxa<boolean>(`${JXA_PRELUDE}
const els = lp.windows[0].entireContents();
for (const el of els) {
  try { if (el.role() === 'AXButton' && el.name() === '${name}') { el.actions['AXPress'].perform(); return true; } } catch (e) {}
}
return false;`);
}

export async function bounce(opts: { destDir: string; fileName: string; timeoutSec?: number }): Promise<string> {
  const dest = bounceDestination(opts.destDir, opts.fileName);
  mkdirSync(dest.dir, { recursive: true });
  await clickMenu(BOUNCE_MENU_PATH);
  await waitFor(bounceDialogReady, 8000, 'bounce dialog');
  await configureDialogPcmWave();
  if (!(await clickDialogButton('Bounce'))) await clickDialogButton('OK');
  await sleep(1200);
  await keystroke('g', ['command', 'shift']);
  await sleep(600);
  await typeText(dest.dir);
  await keyCode(36);
  await sleep(600);
  await runJxa(`${JXA_PRELUDE}
const els = lp.windows[0].entireContents();
for (const el of els) {
  try { if (el.role() === 'AXTextField') { el.value = '${dest.name.replace(/'/g, "\\'")}'; return true; } } catch (e) {}
}
throw new Error('Save panel name field not found');`, null, 15000);
  await sleep(300);
  if (!(await clickDialogButton('Bounce'))) {
    if (!(await clickDialogButton('Save'))) await keyCode(36);
  }
  const timeoutMs = (opts.timeoutSec ?? 300) * 1000;
  await waitFor(async () => {
    if (!existsSync(dest.full)) return false;
    const size1 = statSync(dest.full).size;
    await sleep(1500);
    return existsSync(dest.full) && statSync(dest.full).size === size1 && size1 > 0;
  }, timeoutMs, `bounced file at ${dest.full}`);
  return dest.full;
}
