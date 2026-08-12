import { insertPlugin, listParams, setParams } from '../src/ax/plugins.js';

const track = process.argv[2] ?? 'Audio 1';
console.log('Inserting Compressor on', track);
await insertPlugin(track, 'Compressor');
const params = await listParams(track, 1);
console.log('Params:', params.map((p) => `${p.name}=${p.value}`).join(', '));
const threshold = params.find((p) => /threshold/i.test(p.name));
if (!threshold) throw new Error('No Threshold param found');
const after = await setParams(track, 1, { [threshold.name]: -18 });
console.log('Threshold now:', after.find((p) => p.name === threshold.name)?.value);
