import { runJxa } from '../ax/run-jxa.js';
import { activateLogic } from '../ax/prelude.js';

export type Mod = 'command' | 'option' | 'control' | 'shift';

const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
const modList = (mods: Mod[]) => `[${mods.map((m) => `'${m} down'`).join(', ')}]`;

export function keystrokeSource(key: string, mods: Mod[]): string {
  return `Application('System Events').keystroke('${esc(key)}', { using: ${modList(mods)} }); return true;`;
}

export function keyCodeSource(code: number, mods: Mod[]): string {
  return `Application('System Events').keyCode(${code}, { using: ${modList(mods)} }); return true;`;
}

export async function keystroke(key: string, mods: Mod[] = []): Promise<void> {
  await activateLogic();
  await runJxa(keystrokeSource(key, mods));
}

export async function keyCode(code: number, mods: Mod[] = []): Promise<void> {
  await activateLogic();
  await runJxa(keyCodeSource(code, mods));
}

export async function typeText(text: string): Promise<void> {
  await activateLogic();
  await runJxa(keystrokeSource(text, []));
}
