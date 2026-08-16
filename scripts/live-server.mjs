// Long-lived MCU port owner for live checkpoint 1.
// CoreMIDI virtual endpoints die with their owning process, so Logic must
// re-bind (toggle the Mackie Control ports or restart Logic) WHILE this runs.
// Control it by writing PLAY / STOP / STATUS / EXIT to /tmp/logic-mcp-cmd.txt.
import { readFileSync, writeFileSync } from 'node:fs';
const { mcu, press, NOTE, sleep } = await import('../dist/midi/mcu.js');
const { McuPorts } = await import('../dist/midi/ports.js');

const CMD = '/tmp/logic-mcp-cmd.txt';
const hex = (b) => b.map((x) => x.toString(16).padStart(2, '0')).join(' ');
const ts = () => new Date().toISOString().slice(11, 19);

const ports = new McuPorts();
let msgCount = 0;
let lcdWrites = 0;
ports.onMessage((bytes) => {
  msgCount++;
  if (bytes[0] === 0xf0 && bytes[3] === 0x66) {
    const dev = bytes[4], cmd = bytes[5];
    if (cmd === 0x00) {
      console.log(`[${ts()}] DEVICE QUERY dev 0x${dev.toString(16)}, sending host connection query reply`);
      ports.send([0xf0, 0x00, 0x00, 0x66, dev, 0x01, 0x4c, 0x4d, 0x43, 0x50, 0x30, 0x30, 0x31, 0x01, 0x02, 0x03, 0x04, 0xf7]);
      return;
    }
    if (cmd === 0x12) {
      lcdWrites++;
      if (lcdWrites === 1) console.log(`[${ts()}] FIRST LCD WRITE, surface ACTIVE`);
      mcu.state.ingest(bytes);
      return;
    }
    console.log(`[${ts()}] sysex dev 0x${dev.toString(16)} cmd 0x${cmd.toString(16)}: ${hex(bytes).slice(0, 80)}`);
    return;
  }
  mcu.state.ingest(bytes);
});
ports.open();
console.log(`[${ts()}] port owner up, pid ${process.pid}. Waiting for commands and Logic traffic.`);
writeFileSync(CMD, '');

const deadline = Date.now() + 90 * 60 * 1000;
while (Date.now() < deadline) {
  await sleep(300);
  let cmd = '';
  try { cmd = readFileSync(CMD, 'utf8').trim(); } catch {}
  if (!cmd) continue;
  writeFileSync(CMD, '');
  console.log(`[${ts()}] CMD: ${cmd}`);
  if (cmd === 'EXIT') break;
  else if (cmd === 'PLAY') { ports.send([0x90, NOTE.PLAY, 0x7f]); ports.send([0x90, NOTE.PLAY, 0x00]); }
  else if (cmd === 'STOP') { ports.send([0x90, NOTE.STOP, 0x7f]); ports.send([0x90, NOTE.STOP, 0x00]); }
  else if (cmd === 'STATUS') {
    console.log(`[${ts()}] msgs=${msgCount} lcdWrites=${lcdWrites}`);
    console.log(`[${ts()}] line0=${JSON.stringify(mcu.state.lcdLine(0))}`);
    console.log(`[${ts()}] line1=${JSON.stringify(mcu.state.lcdLine(1))}`);
    console.log(`[${ts()}] timecode=${JSON.stringify(mcu.state.timecode())} bar=${mcu.state.currentBar()} playLED=${mcu.state.led(NOTE.PLAY)}`);
  }
}
console.log(`[${ts()}] port owner exiting`);
process.exit(0);
