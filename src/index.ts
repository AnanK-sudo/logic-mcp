import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createServer } from './server.js';
import { setMcuCheck } from './preflight/preflight.js';
import { mcu } from './midi/mcu.js';

setMcuCheck(() => mcu.check());

const server = createServer();
await server.connect(new StdioServerTransport());
