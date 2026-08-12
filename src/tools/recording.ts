import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { mcu, press, NOTE, sleep } from '../midi/mcu.js';
import { preflight } from '../preflight/preflight.js';
import { keystroke, keyCode, typeText } from '../keys/keystrokes.js';
import { ok, guard } from './util.js';

export function registerRecordingTools(server: McpServer) {
  server.registerTool('play', {
    description: 'Start playback in Logic Pro.',
    inputSchema: {},
  }, async () => guard(async () => {
    await preflight(['logic', 'mcu']);
    mcu.send(press(NOTE.PLAY));
    await sleep(150);
    return ok({ playing: mcu.state.led(NOTE.PLAY) });
  }));

  server.registerTool('stop', {
    description: 'Stop playback or recording in Logic Pro.',
    inputSchema: {},
  }, async () => guard(async () => {
    await preflight(['logic', 'mcu']);
    mcu.send(press(NOTE.STOP));
    await sleep(150);
    return ok({ playing: mcu.state.led(NOTE.PLAY) });
  }));

  server.registerTool('record', {
    description: 'Start recording immediately at the playhead. Stop with the stop tool.',
    inputSchema: {},
  }, async () => guard(async () => {
    await preflight(['logic', 'mcu']);
    mcu.send(press(NOTE.RECORD));
    await sleep(200);
    return ok({ recording: mcu.state.led(NOTE.RECORD) });
  }));

  server.registerTool('toggle_cycle', {
    description: 'Toggle cycle (loop) mode on or off.',
    inputSchema: {},
  }, async () => guard(async () => {
    await preflight(['logic', 'mcu']);
    mcu.send(press(NOTE.CYCLE));
    await sleep(150);
    return ok({ cycle: mcu.state.led(NOTE.CYCLE) });
  }));

  server.registerTool('go_to_bar', {
    description: 'Move the playhead to a bar number.',
    inputSchema: { bar: z.number().int().min(1) },
  }, async ({ bar }) => guard(async () => {
    await preflight(['logic', 'ax', 'project']);
    await keystroke('/');
    await sleep(300);
    await typeText(String(bar));
    await keyCode(36);
    await sleep(200);
    return ok({ requestedBar: bar, timecode: mcu.isOpen() ? mcu.state.timecode().trim() : null });
  }));
}
