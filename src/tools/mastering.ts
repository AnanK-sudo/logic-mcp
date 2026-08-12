import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { analyzeAudio } from '../audio/analyze.js';
import { ok, guard } from './util.js';

export function registerMasteringTools(server: McpServer) {
  server.registerTool('analyze_audio', {
    description: 'Analyze an audio file: LUFS loudness, true peak, RMS, duration, and spectral energy per band (lows, low-mids, mids, presence, sibilance, air). Use after bouncing to judge a mix or master numerically.',
    inputSchema: { filePath: z.string().describe('Absolute path to wav/aiff/mp3') },
  }, async ({ filePath }) => guard(async () => ok(await analyzeAudio(filePath))));
}
