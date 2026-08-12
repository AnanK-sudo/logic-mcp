import midi from '@julusian/midi';
import { PORT_NAME } from '../constants.js';

export class McuPorts {
  private input: InstanceType<typeof midi.Input> | null = null;
  private output: InstanceType<typeof midi.Output> | null = null;
  private handlers: ((bytes: number[]) => void)[] = [];

  open(): void {
    if (this.output) return;
    this.input = new midi.Input();
    this.input.ignoreTypes(false, true, true);
    this.input.on('message', (_delta, msg) => {
      for (const h of this.handlers) h([...msg]);
    });
    this.input.openVirtualPort(PORT_NAME);
    this.output = new midi.Output();
    this.output.openVirtualPort(PORT_NAME);
  }
  close(): void {
    this.input?.closePort(); this.output?.closePort();
    this.input = null; this.output = null;
  }
  isOpen(): boolean { return this.output !== null; }
  send(bytes: number[]): void {
    if (!this.output) throw new Error('MIDI port not open');
    this.output.sendMessage(bytes);
  }
  onMessage(cb: (bytes: number[]) => void): void { this.handlers.push(cb); }
}
