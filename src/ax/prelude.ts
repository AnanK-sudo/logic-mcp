import { runJxa } from './run-jxa.js';
import { LOGIC_PROCESS } from '../constants.js';

export const JXA_PRELUDE = `
const se = Application('System Events');
const lp = se.processes['${LOGIC_PROCESS}'];
function must(cond, msg) { if (!cond) throw new Error(msg); }
function names(coll) { const out = []; for (let i = 0; i < coll.length; i++) { try { out.push(coll[i].name()); } catch (e) { out.push(null); } } return out; }
`;

export async function activateLogic(): Promise<void> {
  await runJxa(`Application('${LOGIC_PROCESS}').activate(); delay(0.25); return true;`);
}
