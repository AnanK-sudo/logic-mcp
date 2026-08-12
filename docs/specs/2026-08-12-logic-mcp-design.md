# logic-mcp Design

Date: 2026-08-12
Status: Approved

## What it is

An MCP server that makes Claude a recording producer inside Logic Pro on macOS:
session setup, vocal take recording, mixing vocals against an instrumental,
mastering, bounce, and self-verification by analyzing the bounced audio.

Target environment: Logic Pro X 10.7.9, macOS 26.x, Apple Silicon.
User records vocals over instrumentals. Stock Logic plugins only for
parameter-level control.

## Why this architecture

Logic Pro has no scripting API. Three unofficial control paths exist and each
is best at different things, so the server uses all three:

1. Mackie Control Universal (MCU) emulation over a virtual CoreMIDI port.
   Logic treats the server as a hardware control surface. Reliable for
   transport, faders, pan, mute/solo/record-arm, track select. Bidirectional:
   Logic sends back track names, meter levels, playhead position.
2. Key commands via synthetic keystrokes. Covers every action Logic binds to
   a shortcut: bounce, new track, cycle, count-in, take navigation, save, undo.
3. Accessibility (AX) scripting via JXA (osascript). Covers what the other two
   cannot: inserting/removing/bypassing plugins, reading and setting plugin
   parameters through the plugin window Controls view, driving the bounce
   dialog, reading mixer state.

Claude cannot hear audio, so producing (not just remote controlling) requires
a measurement loop: bounce a section to a file, analyze it (LUFS, true peak,
dynamic range, per-band spectral energy), adjust plugin parameters from the
numbers, re-bounce to verify. User feedback supplies the taste; analysis
supplies the meters.

## Stack

- TypeScript, strict mode
- @modelcontextprotocol/sdk, stdio transport
- @julusian/midi for virtual CoreMIDI input/output ports
- osascript (JXA) child processes for AX scripting and keystrokes
- ffmpeg-static for audio analysis (ebur128, astats, spectral filters)
- vitest for unit tests
- npm, Node 20+

Repo: Projects/Personal/logic-mcp. Registered user-scope
(claude mcp add --scope user) so it is available in every session.

## Layers

```
tools/      MCP tool definitions, composed from the layers below
midi/       MCU protocol: encode commands, decode feedback, port lifecycle
keys/       key command dispatcher + mapping of Logic default US shortcuts
ax/         JXA script templates + runner (plugins, mixer, dialogs, menus)
audio/      bounce file analysis via ffmpeg
preflight/  environment checks shared by all tools
```

Each layer is independently testable: midi/ and keys/ and ax/ produce
inspectable payloads (MIDI bytes, JXA source) without Logic present.

## Tool surface

### Session
| Tool | Notes |
|---|---|
| logic_status | Doctor: Logic running, project open, AX permission, MCU handshake, ffmpeg. Reports fixes. |
| open_project | Open a .logicx by path, or frontmost project info |
| project_info | Tempo, key, sample rate, track count, project path |
| list_tracks | Names, types, numbers, arm/mute/solo state (AX read of track headers) |
| create_audio_track | Audio track, name, input, optional record-enable |
| rename_track | |
| select_track | |
| set_input_monitoring | On/off for selected track |
| set_metronome | On/off |
| set_count_in | Bars |
| set_tempo | BPM |
| save_project | |

### Recording
| Tool | Notes |
|---|---|
| play / stop | MCU transport |
| record | Start recording immediately |
| go_to_bar | Position playhead |
| set_cycle | Cycle on/off with bar range |
| arm_track | Record-enable via MCU |
| record_take | Composite: arm, position, count-in, record, stop at range end |
| punch_range | Autopunch with bar range |
| next_take / prev_take | Take folder navigation |
| flatten_takes | Flatten current comp |
| undo | |

Comp swiping is manual (mouse gesture, out of scope).

### Mixing
| Tool | Notes |
|---|---|
| set_volume | dB value per track, MCU fader |
| set_pan | |
| set_mute / set_solo | |
| set_send | Bus send level; creates send if missing (AX) |
| insert_plugin | Stock plugin by name into a slot on a track or bus |
| remove_plugin / bypass_plugin | |
| list_plugin_params | Param names, ranges, current values (AX Controls view) |
| get_plugin_params / set_plugin_params | Batch get/set by name |
| load_plugin_preset | Factory or user preset by name |
| load_channel_strip | User channel strip settings (existing ones in ~/Music/Audio Music Apps/Channel Strip Settings) |
| setup_vocal_chain | Composite: gain, Channel EQ, Compressor, DeEsser on vocal track; reverb + delay buses with sends |

### Mastering
| Tool | Notes |
|---|---|
| setup_master_chain | Stereo Out: Channel EQ, glue Compressor, Limiter, Loudness Meter |
| bounce | Range, format (wav/aiff/mp3), destination path; key command + AX dialog |
| analyze_audio | LUFS integrated/short-term, true peak, LRA, per-band energy (lows, low-mids, presence, sibilance, air) on any audio file |
| master_and_verify | Composite: bounce, analyze, compare to target LUFS/peak, report deltas |

### Feedback
| Tool | Notes |
|---|---|
| read_meters | Snapshot of MCU meter stream per track |
| screenshot | Window capture of Logic (arrangement or plugin window) for visual inspection |

## Producer loop

Typical mastering interaction:

1. setup_master_chain
2. bounce chorus section
3. analyze_audio: reads -16.2 LUFS, vocal presence band weak vs reference curve
4. set_plugin_params: push 2.5 dB at 3 kHz on master EQ, raise limiter gain
5. re-bounce, re-analyze, confirm target hit
6. report to user with numbers, user listens and gives taste feedback

## Error handling

preflight/ runs before every tool: Logic running, project open (where needed),
AX permission granted, MCU port connected and handshaken, ffmpeg present.
Failures return actionable messages naming the exact fix, for example
"Grant Accessibility permission to your terminal: System Settings, Privacy and
Security, Accessibility". No silent retries. AX operations time out rather
than hang, and report which UI element was not found (signals a Logic version
drift).

Validation at the system boundary only: tool inputs validated by schema
(zod via MCP SDK), internal layers trust their callers.

## One-time setup

1. npm install, npm run build, claude mcp add --scope user
2. Grant Accessibility to the terminal that hosts the server
3. Logic: Control Surfaces Setup, add Mackie Control, assign to the
   "Logic MCP" virtual port (guided by logic_status output)

## Testing

- Unit: MCU encode/decode round-trips, JXA source generation, key command
  mapping, analysis output parsing. No Logic needed. vitest.
- Live: logic_status doctor plus a scripted smoke sequence run manually
  against a scratch project.
- Phase 1 is a thin vertical slice proven live before the full surface:
  play/stop, one fader move, insert Compressor, set threshold, bounce,
  analyze. This validates all three control paths on the actual
  Logic 10.7.9 + macOS 26 combination first.

## Out of scope, v1

- Third-party plugin parameters (insert/bypass/preset only if requested later)
- Flex Pitch note editing
- Comp swiping
- Automation curve rides (v2 candidate: MCU fader writes in Latch mode
  during playback)
- Spatial Audio / Dolby Atmos

## Risks

| Risk | Mitigation |
|---|---|
| AX element tree differs on Logic 10.7.9 + macOS 26 | Thin slice first; ax/ isolates all selectors in one place |
| Logic key command set customized by user | Read/export active key commands during setup; keys/ maps by command name, not hardcoded keystroke |
| MCU bank switching for >8 tracks | midi/ handles banking transparently by track number |
| Bounce dialog variations (formats, normalize state) | AX driver asserts dialog state instead of blind clicks |
