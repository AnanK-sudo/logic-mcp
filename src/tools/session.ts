import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { statusReport } from '../preflight/preflight.js';
import { ok, guard } from './util.js';

export function registerSessionTools(server: McpServer) {
  server.registerTool('logic_status', {
    description: 'Doctor for the Logic Pro connection. Checks Logic running, Accessibility permission, open project, MIDI control surface link, ffmpeg. Returns fixes for anything unmet. Run this first in a session and whenever another tool fails.',
    inputSchema: {},
  }, async () => guard(async () => ok(await statusReport())));
}
