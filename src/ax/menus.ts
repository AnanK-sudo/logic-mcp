import { runJxa } from './run-jxa.js';
import { JXA_PRELUDE, activateLogic } from './prelude.js';

const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/'/g, "\\'");

export function menuSource(path: string[]): string {
  const [top, ...rest] = path;
  let src = `${JXA_PRELUDE}
let item = lp.menuBars[0].menuBarItems['${esc(top)}'];
must(item.exists(), 'Menu not found: ${esc(top)}');
let menu = item.menus[0];`;
  rest.forEach((name, i) => {
    const last = i === rest.length - 1;
    src += `
item = menu.menuItems['${esc(name)}'];
must(item.exists(), 'Menu item not found: ${esc(path.slice(0, i + 2).join(' > '))}. Available: ' + names(menu.menuItems).join(', '));`;
    if (!last) src += `
menu = item.menus[0];`;
  });
  src += `
item.click();
return true;`;
  return src;
}

export async function clickMenu(path: string[]): Promise<void> {
  await activateLogic();
  await runJxa(menuSource(path));
}

export async function listMenu(path: string[]): Promise<string[]> {
  await activateLogic();
  let src = `${JXA_PRELUDE}
let menu = lp.menuBars[0].menuBarItems['${esc(path[0])}'].menus[0];`;
  for (const name of path.slice(1)) {
    src += `
menu = menu.menuItems['${esc(name)}'].menus[0];`;
  }
  src += `
return names(menu.menuItems);`;
  return runJxa<string[]>(src);
}
