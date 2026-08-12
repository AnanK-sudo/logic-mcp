import { spawn } from 'node:child_process';

const p = spawn('node', ['dist/index.js'], { stdio: ['pipe', 'pipe', 'inherit'] });
const timer = setTimeout(() => { console.error('NO RESPONSE'); process.exit(1); }, 5000);
p.stdout.on('data', (d) => {
  const line = d.toString();
  if (line.includes('"result"')) {
    clearTimeout(timer);
    console.log('BOOT OK:', line.trim().slice(0, 120));
    p.kill();
    process.exit(0);
  }
});
p.stdin.write(JSON.stringify({
  jsonrpc: '2.0', id: 1, method: 'initialize',
  params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'probe', version: '0' } },
}) + '\n');
