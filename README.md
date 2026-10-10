# logic-mcp

An MCP server that lets an AI agent act as a recording producer inside Logic Pro on macOS: set up the session, record vocal takes, mix and master with stock plugins, bounce, and check the result by measuring the bounced audio.

**Status:** work in progress, paused 2026-08-17. Phase 1 is built and unit tested. Live checkpoint 2 is blocked, see [Where it is stuck](#where-it-is-stuck).

## Why it is built this way

Logic Pro has no scripting API, so the server combines three unofficial control paths:

1. **Mackie Control emulation** over a virtual MIDI port called "Logic MCP". Logic treats the server as a hardware control surface for transport, faders, pan, mute, solo and record-arm, and sends back track names, meters and the playhead position.
2. **Key commands** sent as synthetic keystrokes, for everything Logic binds to a shortcut: bounce, cycle, save, undo.
3. **Accessibility scripting** through JXA, for what the other two cannot reach: inserting plugins and reading or setting their parameters.

An agent cannot hear, so producing needs a measurement loop: bounce a section, analyze it with ffmpeg (loudness, true peak, dynamic range, energy per frequency band), adjust parameters from the numbers, then bounce again to verify. The artist supplies the taste; the analysis supplies the meters.

## Tools

| Area | Tools |
|---|---|
| Session | `logic_status`, `save_project`, `undo`, `ax_dump` |
| Recording | `play`, `stop`, `record`, `toggle_cycle`, `go_to_bar` |
| Mixing | `insert_plugin`, `list_plugin_params`, `set_plugin_params` |
| Mastering | `bounce`, `analyze_audio` (bands: lows, mids, presence, sibilance, air) |

## Where it is stuck

Checkpoint 2 inserts a plugin from the mixer. Pressing an insert slot does open Logic's real plugin picker on screen, but the popup never shows up in the accessibility tree, and the press makes Logic lose its place as the frontmost app. Three different approaches each failed with a new symptom, so this is an architecture problem, not a quick fix. The next idea to test is a real mouse-down and mouse-up pair instead of a single click.

## How I built it

Spec first ([docs/specs](docs/specs)), then a 17-task plan ([docs/plans](docs/plans)), then AI coding agents (Claude Code) built it task by task, with a review after each. Every layer produces output you can inspect without Logic running (MIDI bytes, JXA source), so unit tests cover it. The live checkpoints run against a real Logic session.

## Run it

Needs macOS, Logic Pro X 10.7.9, Node 20+, and Accessibility permission for the app that launches the server.

```sh
npm install
npm run build
npm test
claude mcp add logic-pro --scope user -- node "$PWD/dist/index.js"
```

In Logic, set up a Mackie Control surface on the "Logic MCP" MIDI port.

## License

MIT, see [LICENSE](LICENSE).
