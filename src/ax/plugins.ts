import { runJxa } from './run-jxa.js';
import { JXA_PRELUDE, activateLogic } from './prelude.js';
import { ensureMixerOpen, findChannelStripSource } from './windows.js';
import { sleep } from '../midi/mcu.js';

export const PLUGIN_CATEGORIES: Record<string, string> = {
  'Channel EQ': 'EQ', 'Linear Phase EQ': 'EQ', 'Match EQ': 'EQ',
  'Compressor': 'Dynamics', 'DeEsser 2': 'Dynamics', 'Limiter': 'Dynamics',
  'Adaptive Limiter': 'Dynamics', 'Multipressor': 'Dynamics', 'Noise Gate': 'Dynamics',
  'ChromaVerb': 'Reverb', 'Space Designer': 'Reverb', 'SilverVerb': 'Reverb',
  'Stereo Delay': 'Delay', 'Tape Delay': 'Delay', 'Echo': 'Delay',
  'Gain': 'Utility', 'Test Oscillator': 'Utility',
  'Pitch Correction': 'Pitch', 'Vocal Transformer': 'Pitch',
};

export interface PluginParam {
  name: string; value: number | string | boolean;
  min?: number; max?: number; kind: 'slider' | 'toggle' | 'menu';
}

const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/'/g, "\\'");

export function insertPluginSource(track: string, plugin: string, category: string): string {
  return `${JXA_PRELUDE}
${findChannelStripSource(track)}
const slots = strip.entireContents().filter((el) => {
  try { return String(el.description()).indexOf('Audio Effect') !== -1; } catch (e) { return false; }
});
must(slots.length, 'No Audio Effect insert slot found on strip. Descriptions seen: ' +
  strip.entireContents().slice(0, 40).map((el) => { try { return el.description(); } catch (e) { return ''; } }).join(' | '));
let target = null;
for (const s of slots) { try { if (!s.value() || s.value() === '') { target = s; break; } } catch (e) {} }
must(target, 'No empty insert slot on strip: all ' + slots.length + ' slots occupied. Remove a plugin before inserting a new one.');
target.actions['AXShowMenu'].perform();
delay(0.5);
const menu = lp.menus[0];
must(menu.exists(), 'Insert menu did not open');
const cat = menu.menuItems['${esc(category)}'];
must(cat.exists(), 'Category not in insert menu: ${esc(category)}. Items: ' + names(menu.menuItems).join(', '));
const plug = cat.menus[0].menuItems['${esc(plugin)}'];
must(plug.exists(), 'Plugin not found: ${esc(plugin)}. Items: ' + names(cat.menus[0].menuItems).join(', '));
const fmt = plug.menus[0].menuItems['Stereo'];
if (fmt.exists()) { fmt.click(); } else { plug.click(); }
return true;`;
}

export async function insertPlugin(track: string, plugin: string, category?: string): Promise<void> {
  const cat = category ?? PLUGIN_CATEGORIES[plugin];
  if (!cat) throw new Error(`Unknown plugin category for "${plugin}". Pass category explicitly. Known: ${Object.keys(PLUGIN_CATEGORIES).join(', ')}`);
  await ensureMixerOpen();
  await runJxa(insertPluginSource(track, plugin, cat), null, 30000);
  await sleep(1200);
}

export async function openPluginWindow(track: string, slot: number): Promise<void> {
  await ensureMixerOpen();
  await runJxa(`${JXA_PRELUDE}
${findChannelStripSource(track)}
const slots = strip.entireContents().filter((el) => {
  try { return String(el.description()).indexOf('Audio Effect') !== -1 && el.value(); } catch (e) { return false; }
});
must(slots.length >= ${slot}, 'Track has fewer than ${slot} populated insert slots');
slots[${slot - 1}].actions['AXOpen'] ? slots[${slot - 1}].actions['AXOpen'].perform() : slots[${slot - 1}].actions['AXPress'].perform();
return true;`, null, 20000);
  await sleep(900);
}

export async function ensureControlsView(): Promise<void> {
  await activateLogic();
  await runJxa(`${JXA_PRELUDE}
const win = lp.windows[0];
const pops = win.entireContents().filter((el) => { try { return el.role() === 'AXPopUpButton'; } catch (e) { return false; } });
for (const p of pops) {
  const v = String(p.value());
  if (v === 'Editor' || v === 'Controls') {
    if (v !== 'Controls') {
      p.actions['AXPress'].perform();
      delay(0.4);
      lp.menus[0].menuItems['Controls'].click();
    }
    return true;
  }
}
throw new Error('View popup not found on frontmost window: ' + win.name());`, null, 20000);
  await sleep(600);
}

const PARAMS_SOURCE = `${JXA_PRELUDE}
const win = lp.windows[0];
const out = [];
const els = win.entireContents();
for (const el of els) {
  let role; try { role = el.role(); } catch (e) { continue; }
  let name = ''; try { name = String(el.name() || el.description() || ''); } catch (e) {}
  if (!name) continue;
  try {
    if (role === 'AXSlider') {
      const p = { name: name, kind: 'slider', value: Number(el.value()) };
      try { p.min = Number(el.attributes['AXMinValue'].value()); p.max = Number(el.attributes['AXMaxValue'].value()); } catch (e) {}
      out.push(p);
    } else if (role === 'AXCheckBox') {
      out.push({ name: name, kind: 'toggle', value: Number(el.value()) === 1 });
    } else if (role === 'AXPopUpButton') {
      out.push({ name: name, kind: 'menu', value: String(el.value()) });
    }
  } catch (e) {}
}
return out;`;

export async function listParams(track: string, slot: number): Promise<PluginParam[]> {
  await openPluginWindow(track, slot);
  await ensureControlsView();
  return runJxa<PluginParam[]>(PARAMS_SOURCE, null, 30000);
}

export async function setParams(track: string, slot: number, values: Record<string, number | string | boolean>): Promise<PluginParam[]> {
  await openPluginWindow(track, slot);
  await ensureControlsView();
  await runJxa(`${JXA_PRELUDE}
const win = lp.windows[0];
const wanted = args;
const els = win.entireContents();
const missing = Object.keys(wanted);
for (const el of els) {
  let role; try { role = el.role(); } catch (e) { continue; }
  let name = ''; try { name = String(el.name() || el.description() || ''); } catch (e) {}
  if (!(name in wanted)) continue;
  const v = wanted[name];
  if (role === 'AXSlider') {
    el.value = Number(v);
  } else if (role === 'AXCheckBox') {
    const cur = Number(el.value()) === 1;
    if (cur !== !!v) el.actions['AXPress'].perform();
  } else if (role === 'AXPopUpButton') {
    el.actions['AXPress'].perform();
    delay(0.3);
    const mi = lp.menus[0].menuItems[String(v)];
    must(mi.exists(), 'Menu value not found: ' + v);
    mi.click();
  } else { continue; }
  missing.splice(missing.indexOf(name), 1);
}
must(missing.length === 0, 'Params not found: ' + missing.join(', '));
return true;`, values, 30000);
  return runJxa<PluginParam[]>(PARAMS_SOURCE, null, 30000);
}

export async function closePluginWindow(): Promise<void> {
  await runJxa(`${JXA_PRELUDE}
const win = lp.windows[0];
const btn = win.buttons.whose({ subrole: 'AXCloseButton' })[0];
if (btn && btn.exists()) btn.click();
return true;`);
}
