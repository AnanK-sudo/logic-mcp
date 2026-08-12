import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

export function createServer(): McpServer {
  return new McpServer({ name: 'logic-mcp', version: '0.1.0' });
}
