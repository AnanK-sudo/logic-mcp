import { runJxa } from './run-jxa.js';
import { JXA_PRELUDE, activateLogic } from './prelude.js';

export async function dumpAx(scope: 'window' | 'menus', windowNameContains = '', maxDepth = 6): Promise<unknown> {
  await activateLogic();
  return runJxa(`${JXA_PRELUDE}
function node(el, depth) {
  const out = {};
  function attr(k, name) { try { const v = el[name](); if (v !== null && v !== '') out[k] = String(v).slice(0, 80); } catch (e) {} }
  attr('role', 'role'); attr('name', 'name'); attr('desc', 'description'); attr('value', 'value');
  if (depth < args.maxDepth) {
    try {
      const kids = el.uiElements();
      if (kids.length) out.children = kids.map((k) => node(k, depth + 1));
    } catch (e) {}
  }
  return out;
}
if (args.scope === 'menus') return names(lp.menuBars[0].menuBarItems);
const wins = lp.windows();
let win = null;
for (let i = 0; i < wins.length; i++) {
  if (lp.windows[i].name().indexOf(args.filter) !== -1) { win = lp.windows[i]; break; }
}
must(win, 'No window matching: ' + args.filter + '. Windows: ' + names(lp.windows).join(' | '));
return node(win, 0);
`, { scope, filter: windowNameContains, maxDepth }, 60000);
}
