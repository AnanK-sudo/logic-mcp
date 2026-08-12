import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { statusReport, preflight } from '../preflight/preflight.js';
import { clickMenu, listMenu } from '../ax/menus.js';
import { dumpAx } from '../ax/dump.js';
import { ok, guard } from './util.js';

export function registerSessionTools(server: McpServer) {
  server.registerTool('logic_status', {
    description: 'Doctor for the Logic Pro connection. Checks Logic running, Accessibility permission, open project, MIDI control surface link, ffmpeg. Returns fixes for anything unmet. Run this first in a session and whenever another tool fails.',
    inputSchema: {},
  }, async () => guard(async () => ok(await statusReport())));

  server.registerTool('save_project', {
    description: 'Save the current Logic project.',
    inputSchema: {},
  }, async () => guard(async () => {
    await preflight(['logic', 'ax', 'project']);
    await clickMenu(['File', 'Save']);
    return ok({ saved: true });
  }));

  server.registerTool('undo', {
    description: 'Undo the last action in Logic.',
    inputSchema: {},
  }, async () => guard(async () => {
    await preflight(['logic', 'ax', 'project']);
    const items = await listMenu(['Edit']);
    await clickMenu(['Edit', items.find(n => n && n.startsWith('Undo')) ?? 'Undo']);
    return ok({ undone: true });
  }));

  server.registerTool('ax_dump', {
    description: 'Internal debug: dump the accessibility tree of a Logic window (or menu bar names). Use only to diagnose selector drift when other tools report elements not found.',
    inputSchema: {
      scope: z.enum(['window', 'menus']),
      windowNameContains: z.string().optional(),
      maxDepth: z.number().int().min(1).max(10).optional(),
    },
  }, async ({ scope, windowNameContains, maxDepth }) => guard(async () => {
    await preflight(['logic', 'ax']);
    return ok(await dumpAx(scope, windowNameContains ?? '', maxDepth ?? 6));
  }));
}
