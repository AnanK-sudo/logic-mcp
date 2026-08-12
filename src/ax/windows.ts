import { runJxa } from './run-jxa.js';
import { JXA_PRELUDE, activateLogic } from './prelude.js';
import { keystroke } from '../keys/keystrokes.js';
import { sleep } from '../midi/mcu.js';

export const MIXER_TITLE = 'Mixer';

export async function ensureMixerOpen(): Promise<void> {
  await activateLogic();
  const open = await runJxa<boolean>(`${JXA_PRELUDE}
const wins = names(lp.windows);
return wins.some((n) => n && n.indexOf('${MIXER_TITLE}') !== -1);`);
  if (!open) {
    await keystroke('2', ['command']);
    await sleep(700);
  }
}

export function findChannelStripSource(trackName: string): string {
  const esc = trackName.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  return `
let mixer = null;
for (let i = 0; i < lp.windows.length; i++) {
  if (lp.windows[i].name().indexOf('${MIXER_TITLE}') !== -1) { mixer = lp.windows[i]; break; }
}
must(mixer, 'Mixer window not open');
const groups = mixer.entireContents().filter((el) => {
  try { return el.role() === 'AXGroup' && String(el.description()).indexOf('${esc}') !== -1; } catch (e) { return false; }
});
must(groups.length, 'Channel strip not found for track: ${esc}');
const strip = groups[0];`;
}
