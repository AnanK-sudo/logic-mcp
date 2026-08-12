import { mcu, press, NOTE, sleep } from '../src/midi/mcu.js';

console.log('Opening virtual port "Logic MCP". Configure Logic now if not done:');
console.log('Logic Pro X > Control Surfaces > Setup > New > Install > Mackie Designs Mackie Control > Add');
console.log('Set Output Port AND Input Port to "Logic MCP". Then press Enter here.');
mcu.ensureOpen();
process.stdin.once('data', async () => {
  console.log('ping:', await mcu.ping(3000));
  console.log('PLAY'); mcu.send(press(NOTE.PLAY)); await sleep(2500);
  console.log('LCD line 1:', JSON.stringify(mcu.state.lcdLine(0)));
  console.log('timecode:', JSON.stringify(mcu.state.timecode()));
  console.log('play LED:', mcu.state.led(NOTE.PLAY));
  console.log('STOP'); mcu.send(press(NOTE.STOP)); await sleep(300);
  process.exit(0);
});
