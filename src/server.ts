import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerMasteringTools } from './tools/mastering.js';
import { registerSessionTools } from './tools/session.js';

export function createServer(): McpServer {
  const server = new McpServer({ name: 'logic-mcp', version: '0.1.0' });
  registerMasteringTools(server);
  registerSessionTools(server);
  return server;
}
