# GoalDock

A small desktop app that tracks a recurring Twitch community goal. Bits, subs
and Streamlabs donations feed one counter; every 19 points completes a goal,
the target bumps by 19, and a star is added — forever.

```
0 / 19   →   21 / 38 *   →   44 / 57 **   →   60 / 76 ***
```

Built with Tauri 2, React, TypeScript, Tailwind and Zustand. Everything is
stored locally — no server, no account, no telemetry.

## Features

- **Live counter** — big `CURRENT / TARGET` display with stars for each
  completed goal and a progress bar for the current group of 19
- **Twitch EventSub** over websocket: cheers and every bits power-up
  (Gigantify, Celebration, message effects), subs, resubs and gift subs
- **Streamlabs donations** via the socket API
- **Weekly window** — resets every Saturday at midnight (local time). The
  counter itself never resets; each week is archived to a history table
- **OBS text output** — writes the goal line to a plain `.txt` file that an
  OBS Text source reads, so the overlay uses whatever font you pick in OBS
- **Event log** — every contribution with timestamp and point value, clearable
- **Statistics** — lifetime bits, subs, donations, goals completed, past weeks
- Auto-reconnect with backoff, keepalive watchdogs, duplicate-event protection

### Point values

| Contribution        | Points |
| ------------------- | ------ |
| 600 Bits            | +1     |
| Tier 1 / Prime sub  | +1     |
| Gifted Tier 1 sub   | +1     |
| Tier 2 sub          | +2     |
| Tier 3 sub          | +6     |
| $6 donation         | +1     |

Bits and donations *bank*: two 300-bit cheers add up to +1 instead of being
lost, and the remainder is shown in the event log. Gifted Tier 2/3 subs are
worth their tier value per gift.

## Installation

Grab a release build, or build from source (below). On first launch open
**Settings**, paste your tokens, hit **Connect** — that's it.

### Getting the tokens

**Twitch** — a user access token for the broadcaster with the scopes
`bits:read` and `channel:read:subscriptions`. Either register an app in the
[Twitch developer console](https://dev.twitch.tv/console/apps) and run an
OAuth flow, or use a token generator such as
[twitchtokengenerator.com](https://twitchtokengenerator.com) and tick those
two scopes. Channel and client ID are detected from the token, so the token
is the only thing you paste.

**Streamlabs** (optional, for donations) — the *Socket API Token* from
Streamlabs Dashboard → Settings → API Settings → API Tokens.

Tokens are stored in plain JSON in the app's data folder on your own machine
(see [Configuration](#configuration)). Don't commit or share that folder.

## Showing the goal in OBS

GoalDock doesn't render an overlay itself — it writes the goal text to a file
and OBS does the styling:

1. In GoalDock: Settings → **OBS Text Output** → enable it and pick a file
   path (e.g. `C:\Users\you\Documents\goaldock.txt`).
2. In OBS: add a **Text (GDI+)** source, tick **Read from file**, select that
   file, and choose your font, size and color there.

The file updates the instant a contribution lands, plus a refresh every few
seconds. The format is customizable with `{current}`, `{target}`, `{stars}`
and `{remaining}` placeholders — e.g. `WEEKLY !GOAL {current} / {target} {stars}`.

## Development

Prerequisites: [Node.js](https://nodejs.org) 20+, [Rust](https://rustup.rs)
(stable), and the [Tauri platform setup](https://tauri.app/start/prerequisites/)
for your OS (on Windows: WebView2 + Visual Studio Build Tools).

```sh
npm install
npm run tauri dev
```

`npm run dev` alone serves the UI in a plain browser with localStorage-backed
persistence — handy for UI work without a Rust build.

## Building

```sh
npm run tauri build
```

Installers land in `src-tauri/target/release/bundle/`.

The repo ships with a plain flat square as the app icon. To use your own,
drop a 1024x1024 `app-icon.png` in the repo root and run `npm run icon` —
it regenerates every platform format in `src-tauri/icons/`.

## Configuration

Everything configurable lives in the Settings page; there is no config file
to edit by hand. Settings and data are written to the platform app-data
directory:

| OS      | Location                                              |
| ------- | ------------------------------------------------------ |
| Windows | `%APPDATA%\app.goaldock.desktop\`                       |
| macOS   | `~/Library/Application Support/app.goaldock.desktop/`   |
| Linux   | `~/.local/share/app.goaldock.desktop/`                  |

`settings.json` holds credentials and preferences, `data.json` holds the
counter, statistics, weekly history and event log. Deleting `data.json`
starts the progression over.

## Folder structure

```
src/
  components/     reusable UI (cards, buttons, inputs) + page sections
  hooks/          app bootstrap, ticking clock
  lib/            pure logic: goal math, week boundaries, storage, formatting
  pages/          Dashboard, Event Log, Statistics, Settings
  services/       Twitch EventSub + Streamlabs socket clients (no UI deps)
  stores/         Zustand stores: goal data, settings, connections
src-tauri/        Tauri shell — window config, store/opener plugins, icons
scripts/          icon generator
```

The services layer knows nothing about React or the stores; it takes
callbacks. The stores own state and persistence. Components only read stores
and call actions.

## Troubleshooting

**"Token is invalid or has expired"** — Twitch user tokens expire. Generate a
fresh one with the same scopes and paste it again.

**"Token is missing scopes"** — the token works but wasn't created with
`bits:read` and `channel:read:subscriptions`. Both are required.

**Twitch shows connected but nothing counts** — EventSub only delivers events
for the channel that owns the token. Make sure the token belongs to the
broadcaster (not a mod or bot account).

**Streamlabs won't connect** — you need the *socket* token, not the regular
API token. It's a separate field in Streamlabs' API settings.

**Counter looks wrong after clock changes** — weekly rollover uses your
local clock. If the system time was far off and got corrected, the current
week's stats window may have rolled early; the counter itself is unaffected.

**Missed events while the app was closed** — EventSub is push-only, so
contributions only count while GoalDock is running. Keep it open during
streams.

## License

[MIT](LICENSE)
