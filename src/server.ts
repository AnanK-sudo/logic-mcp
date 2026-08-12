import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerMasteringTools } from './tools/mastering.js';
import { registerSessionTools } from './tools/session.js';
import { registerRecordingTools } from './tools/recording.js';
import { registerMixingTools } from './tools/mixing.js';

export function createServer(): McpServer {
  const server = new McpServer({ name: 'logic-mcp', version: '0.1.0' });
  registerMasteringTools(server);
  registerSessionTools(server);
  registerRecordingTools(server);
  registerMixingTools(server);
  return server;
}
