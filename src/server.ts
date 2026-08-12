import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerMasteringTools } from './tools/mastering.js';

export function createServer(): McpServer {
  const server = new McpServer({ name: 'logic-mcp', version: '0.1.0' });
  registerMasteringTools(server);
  return server;
}
