import { bounce } from '../src/ax/bounce.js';
import { analyzeAudio } from '../src/audio/analyze.js';

const path = await bounce({ destDir: '/tmp/logic-mcp-smoke', fileName: `bounce-${Date.now()}` });
console.log('Bounced:', path);
console.log(JSON.stringify(await analyzeAudio(path), null, 1));
