import { McuPorts } from './ports.js';
import { McuState } from './feedback.js';

export const NOTE = {
  REC_BASE: 0x00, SOLO_BASE: 0x08, MUTE_BASE: 0x10, SELECT_BASE: 0x18,
  ASSIGN_TRACK: 0x28, ASSIGN_SEND: 0x29, ASSIGN_PAN: 0x2a, ASSIGN_PLUGIN: 0x2b, ASSIGN_EQ: 0x2c,
  BANK_LEFT: 0x2e, BANK_RIGHT: 0x2f, CHANNEL_LEFT: 0x30, CHANNEL_RIGHT: 0x31,
  FLIP: 0x32, NAME_VALUE: 0x34, SMPTE_BEATS: 0x35,
  AUTO_READ: 0x4a, AUTO_WRITE: 0x4b, AUTO_TOUCH: 0x4d, AUTO_LATCH: 0x4e,
  MARKER: 0x54, NUDGE: 0x55, CYCLE: 0x56, DROP: 0x57, REPLACE: 0x58, CLICK: 0x59, SOLO_GLOBAL: 0x5a,
  REWIND: 0x5b, FORWARD: 0x5c, STOP: 0x5d, PLAY: 0x5e, RECORD: 0x5f,
  FADER_TOUCH_BASE: 0x68,
} as const;

export function press(note: number): number[][] {
  return [[0x90, note, 0x7f], [0x90, note, 0x00]];
}

export function fader(ch: number, value14: number): number[][] {
  const v = Math.max(0, Math.min(16383, Math.round(value14)));
  return [
    [0x90, NOTE.FADER_TOUCH_BASE + ch, 0x7f],
    [0xe0 + ch, v & 0x7f, v >> 7],
    [0x90, NOTE.FADER_TOUCH_BASE + ch, 0x00],
  ];
}

export function vpot(ch: number, ticks: number): number[][] {
  const n = Math.min(15, Math.abs(Math.trunc(ticks))) || 1;
  return [[0xb0, 0x10 + ch, (ticks < 0 ? 0x40 : 0x00) | n]];
}

export class Mcu {
  readonly state = new McuState();
  private ports = new McuPorts();
  private wired = false;

  ensureOpen(): void {
    this.ports.open();
    if (!this.wired) {
      this.ports.onMessage((b) => this.ingest(b));
      this.wired = true;
    }
  }
  protected ingest(bytes: number[]): void { this.state.ingest(bytes); }
  isOpen(): boolean { return this.ports.isOpen(); }
  send(msgs: number[][]): void {
    this.ensureOpen();
    for (const m of msgs) this.ports.send(m);
  }

  async ping(timeoutMs = 1500): Promise<boolean> {
    this.ensureOpen();
    const before = this.state.lastFeedbackAt;
    this.send(press(NOTE.NAME_VALUE));
    await sleep(120);
    this.send(press(NOTE.NAME_VALUE));
    const t0 = Date.now();
    while (Date.now() - t0 < timeoutMs) {
      if (this.state.lastFeedbackAt !== before && this.state.lastFeedbackAt !== null) return true;
      await sleep(50);
    }
    return false;
  }

  async check(): Promise<{ connected: boolean; feedback: boolean }> {
    try {
      this.ensureOpen();
      const recent = this.state.lastFeedbackAt && Date.now() - this.state.lastFeedbackAt < 10000;
      return { connected: true, feedback: recent ? true : await this.ping() };
    } catch {
      return { connected: false, feedback: false };
    }
  }
}

export const mcu = new Mcu();
export const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
