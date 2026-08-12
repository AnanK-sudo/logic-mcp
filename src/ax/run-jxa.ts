import { execFile } from 'node:child_process';

export const AX_FIX = 'Grant Accessibility permission: System Settings > Privacy and Security > Accessibility > enable the app hosting this server (your terminal), then retry.';

export class JxaError extends Error {
  constructor(readonly kind: 'ax-permission' | 'no-process' | 'timeout' | 'script', message: string, readonly fixes: string[] = []) {
    super(message);
  }
}

export function runJxa<T = unknown>(body: string, args: unknown = null, timeoutMs = 15000): Promise<T> {
  const src = `ObjC.import('stdlib');
function run(argv) {
  const args = JSON.parse(argv[0]);
  const out = (function(args) { ${body}\n })(args);
  return JSON.stringify(out === undefined ? null : out);
}`;
  return new Promise((resolve, reject) => {
    execFile('osascript', ['-l', 'JavaScript', '-e', src, JSON.stringify(args)],
      { timeout: timeoutMs, maxBuffer: 16 * 1024 * 1024 }, (err, stdout, stderr) => {
        if (err) {
          if (err.killed || /timed out/i.test(err.message)) {
            return reject(new JxaError('timeout', `JXA timed out after ${timeoutMs}ms`));
          }
          const s = String(stderr);
          if (/assistive access|-25211|-1719/.test(s)) {
            return reject(new JxaError('ax-permission', 'Accessibility permission missing.', [AX_FIX]));
          }
          if (/Can't get process|Application isn't running|-600/.test(s)) {
            return reject(new JxaError('no-process', 'Logic Pro X is not running.', ['Open Logic Pro X and load a project.']));
          }
          return reject(new JxaError('script', s.trim() || err.message));
        }
        const text = String(stdout).trim();
        resolve(text ? JSON.parse(text) : (null as T));
      });
  });
}
