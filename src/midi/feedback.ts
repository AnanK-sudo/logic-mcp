export class McuState {
  private lcd: string[] = Array(112).fill(' ');
  private tc: string[] = Array(10).fill(' ');
  private leds = new Map<number, boolean>();
  meters: number[] = Array(8).fill(0);
  lastFeedbackAt: number | null = null;

  ingest(bytes: number[]): void {
    if (!bytes.length) return;
    this.lastFeedbackAt = Date.now();
    const status = bytes[0];
    if (status === 0xf0) return this.sysex(bytes);
    const type = status & 0xf0;
    if (type === 0xd0) {
      const ch = bytes[1] >> 4;
      const level = bytes[1] & 0x0f;
      if (ch < 8 && level <= 0x0c) this.meters[ch] = level;
    } else if (type === 0x90) {
      this.leds.set(bytes[1], bytes[2] > 0);
    } else if (type === 0xb0 && bytes[1] >= 0x40 && bytes[1] <= 0x49) {
      const v = bytes[2];
      let c = v & 0x3f;
      if (c < 0x20) c += 0x40;
      this.tc[0x49 - bytes[1]] = String.fromCharCode(c);
    }
  }

  private sysex(b: number[]): void {
    if (b[1] !== 0x00 || b[2] !== 0x00 || b[3] !== 0x66) return;
    if (b[5] !== 0x12) return;
    const pos = b[6];
    for (let i = 7; i < b.length - 1 && pos + i - 7 < 112; i++) {
      this.lcd[pos + i - 7] = String.fromCharCode(b[i]);
    }
  }

  lcdLine(line: 0 | 1): string { return this.lcd.slice(line * 56, line * 56 + 56).join(''); }
  lcdCell(line: 0 | 1, ch: number): string {
    return this.lcd.slice(line * 56 + ch * 7, line * 56 + ch * 7 + 7).join('').trim();
  }
  timecode(): string { return this.tc.join(''); }
  currentBar(): number | null {
    const m = this.timecode().match(/(\d+)/);
    return m ? parseInt(m[1]) : null;
  }
  led(note: number): boolean { return this.leds.get(note) === true; }
}
