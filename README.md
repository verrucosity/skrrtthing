# skrrt goal thingy

A little desktop app that tracks a recurring Twitch community goal. Bits,
subs and Streamlabs donations all feed one running counter, split into two
goals: a weekly one and a Saturday one.

**Weekly goal** climbs in steps of 57 (57, 114, 171, 228...) and resets every
Sunday at 8pm Pacific.

**Saturday goal** only shows up during a window from Saturday 8pm to Sunday
7:59pm Pacific. It takes your weekly progress, subtracts whatever weekly
goals you've already finished, divides by 3, and shows that out of 19 (which
climbs to 38, 57, 76 and so on the same way).

Built with Tauri 2, React, TypeScript, Tailwind and Zustand. Everything runs
and saves locally: no server, no account, no telemetry.

## Features

- **Live counters** for both the weekly and Saturday goals, with stars for
  every weekly goal you've completed and a progress bar for the current one
- **Twitch EventSub** over websocket, catching cheers and every bits
  power up (Gigantify, Celebration, message effects), subs, resubs and gift
  subs
- **Streamlabs donations** through their socket API
- Every bit and cent counts the moment it comes in. A 100 bit cheer shows
  up as +0.17 right away instead of waiting to add up to a full point
- **OBS text output**, two separate files (one for weekly, one for
  Saturday) that an OBS Text source can read, so you pick the font and
  styling right there in OBS
- **Event log** with a timestamp and point value for every contribution,
  and you can clear it whenever
- **Statistics** page for lifetime bits, subs, donations, goals completed
  and a table of past weeks
- A first launch setup wizard that walks through Twitch, Streamlabs and the
  OBS files, no need to dig through Settings by hand
- A Test Events panel so you can fire off fake contributions and watch
  everything update before you're live
- Checks GitHub for new versions automatically, and you can trigger a
  manual check any time from Settings
- Auto reconnect with backoff, keepalive checks and duplicate event
  protection built in

### Point values

| Contribution        | Points |
| -------------------- | ------ |
| 600 Bits              | +1     |
| Tier 1 / Prime sub   | +1     |
| Gifted Tier 1 sub    | +1     |
| Tier 2 sub            | +2     |
| Tier 3 sub            | +6     |
| $6 donation           | +1     |

Bits and donations scale directly, so 300 bits is worth exactly +0.5, no
banking or waiting involved. Gifted Tier 2 or Tier 3 subs are worth their
tier value multiplied by however many were gifted.

## Installation

Grab the installer from the releases page, or build it yourself from source
(see below). The first time you open the app, a setup wizard walks you
through pasting in your tokens and picking OBS file paths, so you don't need
to go hunting through Settings.

### Getting the tokens

**Twitch** needs a user access token for the broadcaster with the scopes
`bits:read` and `channel:read:subscriptions`. Either register an app in the
[Twitch developer console](https://dev.twitch.tv/console/apps) and run an
OAuth flow, or just use a token generator like
[twitchtokengenerator.com](https://twitchtokengenerator.com) and check those
two scopes. Your channel and client ID get detected from the token itself,
so the token is really the only thing you need to paste in.

**Streamlabs** is optional, only needed if you want donations to count. Grab
the Socket API Token from your Streamlabs Dashboard, under Settings, then
API Settings, then API Tokens.

Tokens are stored as plain JSON in the app's data folder on your own
machine (see Configuration below). Don't commit that folder or share it
around.

## Showing the goal in OBS

skrrt doesn't render an overlay itself, it just writes the goal text to a
file and OBS handles the styling:

1. In skrrt, go to Settings and turn on OBS text output for whichever goal
   you want (weekly, Saturday, or both), then pick a file path.
2. In OBS, add a Text (GDI+) source, turn on "Read from file", point it at
   that file, and pick your font, size and color right there.

The file updates the instant a contribution lands, plus a refresh every few
seconds just as a backup. The format is customizable with placeholders like
`{current}`, `{target}`, `{stars}` and `{remaining}`, for example
`WEEKLY !GOAL {current} / {target} {stars}`.

## Development

You'll need [Node.js](https://nodejs.org) 20 or newer, [Rust](https://rustup.rs)
stable, and the [Tauri platform setup](https://tauri.app/start/prerequisites/)
for your OS (on Windows that means WebView2 and the Visual Studio Build
Tools).

```sh
npm install
npm run tauri dev
```

Running `npm run dev` on its own serves the UI in a plain browser with
localStorage standing in for the real storage backend. Handy for working on
the UI without needing a full Rust build, though the OBS file writing and
some native bits won't work outside the real app.

## Building

```sh
npm run tauri build
```

Installers land in `src-tauri/target/release/bundle/`.

The repo ships with a plain flat square as the app icon by default. To use
your own, drop a 1024x1024 `app-icon.png` in the repo root and run
`npm run icon`. It regenerates every platform format under
`src-tauri/icons/`.

## Configuration

Everything configurable lives right in the Settings page, there's no config
file you need to edit by hand. Settings and data get written to the
platform's app data directory:

| OS      | Location                                             |
| ------- | ----------------------------------------------------- |
| Windows | `%APPDATA%\app.skrrt-goal-thingy.desktop\`             |
| macOS   | `~/Library/Application Support/app.skrrt-goal-thingy.desktop/` |
| Linux   | `~/.local/share/app.skrrt-goal-thingy.desktop/`        |

`settings.json` holds your credentials and preferences, `data.json` holds
the counter, statistics, weekly history and event log. Deleting `data.json`
starts everything over from zero. Uninstalling the app through Windows only
removes the program files, it leaves this folder alone so your progress
comes back if you reinstall. Delete the folder yourself if you want a truly
clean slate.

## Folder structure

```
src/
  components/     reusable UI pieces (cards, buttons, inputs) and page sections
  hooks/          app startup, the ticking clock, the update checker
  lib/            pure logic: goal math, week boundaries, storage, formatting
  pages/          Dashboard, Event Log, Statistics, Settings, the setup wizard
  services/       Twitch EventSub and Streamlabs socket clients, no UI code in here
  stores/         Zustand stores for goal data, settings, connections
src-tauri/        the Tauri shell: window config, store and opener plugins, icons
scripts/          the icon generator
```

The services layer doesn't know anything about React or the stores, it just
takes callbacks. The stores own state and persistence. Components only ever
read from stores and call their actions.

## Troubleshooting

**"Token is invalid or has expired"** means Twitch user tokens expire after
a while. Just generate a fresh one with the same scopes and paste it back
in.

**"Token is missing scopes"** means the token works, it just wasn't created
with `bits:read` and `channel:read:subscriptions`. You need both.

**Twitch shows connected but nothing's counting** usually means the token
doesn't belong to the broadcaster. EventSub only delivers events for the
channel that owns the token, so double check it's not a mod or bot account.

**Streamlabs won't connect** probably means you grabbed the wrong token.
You need the socket token specifically, not the regular API token. It's a
separate field in Streamlabs' API settings.

**A counter looks off after a clock change** can happen because weekly
rollover uses your local clock. If the system time was way off and then got
corrected, the current week's stats window might roll early. The lifetime
counter itself is never affected.

**Missed events while the app was closed** happens because EventSub only
pushes events while something's listening. Contributions only count while
skrrt is actually running, so keep it open during your stream.

**Check for Updates says it couldn't reach GitHub** almost always means an
actual connectivity issue at that moment. Try again in a bit.

## License

[MIT](LICENSE)
