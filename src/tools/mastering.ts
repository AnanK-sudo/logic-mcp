import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { analyzeAudio } from '../audio/analyze.js';
import { bounce } from '../ax/bounce.js';
import { ok, guard } from './util.js';
import { preflight } from '../preflight/preflight.js';

export function registerMasteringTools(server: McpServer) {
  server.registerTool('analyze_audio', {
    description: 'Analyze an audio file: LUFS loudness, true peak, RMS, duration, and spectral energy per band (lows, low-mids, mids, presence, sibilance, air). Use after bouncing to judge a mix or master numerically.',
    inputSchema: { filePath: z.string().describe('Absolute path to wav/aiff/mp3') },
  }, async ({ filePath }) => guard(async () => ok(await analyzeAudio(filePath))));

  server.registerTool('bounce', {
    description: 'Bounce the project (or cycle range if cycle is on) to a wav file. Offline bounce via the Logic bounce dialog. Returns the file path; follow with analyze_audio.',
    inputSchema: {
      destDir: z.string().describe('Directory for the bounce'),
      fileName: z.string().describe('File name without extension'),
      timeoutSec: z.number().int().optional(),
    },
  }, async ({ destDir, fileName, timeoutSec }) => guard(async () => {
    await preflight(['logic', 'ax', 'project']);
    const path = await bounce({ destDir, fileName, timeoutSec });
    return ok({ path });
  }));
}
