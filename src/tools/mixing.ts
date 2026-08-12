import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { insertPlugin, listParams, setParams, PLUGIN_CATEGORIES } from '../ax/plugins.js';
import { preflight } from '../preflight/preflight.js';
import { ok, guard } from './util.js';

export function registerMixingTools(server: McpServer) {
  server.registerTool('insert_plugin', {
    description: `Insert a stock Logic plugin into the next free Audio FX slot of a track. Known plugins: ${Object.keys(PLUGIN_CATEGORIES).join(', ')}. Pass category for others.`,
    inputSchema: {
      track: z.string().describe('Track name as shown in Logic'),
      plugin: z.string(),
      category: z.string().optional().describe('Insert menu category, e.g. Dynamics'),
    },
  }, async ({ track, plugin, category }) => guard(async () => {
    await preflight(['logic', 'ax', 'project']);
    await insertPlugin(track, plugin, category);
    return ok({ inserted: plugin, track });
  }));

  server.registerTool('list_plugin_params', {
    description: 'List all parameters of a plugin (name, value, range) by track and insert slot number (1-based). Opens the plugin window in Controls view.',
    inputSchema: { track: z.string(), slot: z.number().int().min(1) },
  }, async ({ track, slot }) => guard(async () => {
    await preflight(['logic', 'ax', 'project']);
    return ok(await listParams(track, slot));
  }));

  server.registerTool('set_plugin_params', {
    description: 'Set plugin parameters by exact name (use list_plugin_params first). Values: numbers for sliders, true/false for toggles, string for menus. Returns all params after the change so you can verify.',
    inputSchema: {
      track: z.string(), slot: z.number().int().min(1),
      values: z.record(z.string(), z.union([z.number(), z.string(), z.boolean()])),
    },
  }, async ({ track, slot, values }) => guard(async () => {
    await preflight(['logic', 'ax', 'project']);
    return ok(await setParams(track, slot, values));
  }));
}
