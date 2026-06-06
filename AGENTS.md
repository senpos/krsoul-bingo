# KRSoul Bingo

## Quick start

```sh
npx wrangler pages deploy . --branch production
```

- **Static** — open `index.html` directly in a browser
- **Dev server** — `npx wrangler pages dev .` (required for Twitch login; OAuth redirect won't work on `file://`)

## Language

All user-facing text must be in **Ukrainian**. No Russian language allowed. Korean or English may be used where appropriate (e.g., K-pop artist names, technical terms, Twitch API responses), but the primary language is Ukrainian.

## Architecture

- **Static SPA** — Alpine.js v3.13.7 (dynamically injected by `js/main.js`). Cloudflare Pages.
- **No server, no proxy** — Twitch uses Implicit Grant OAuth (zero-scope read-only token).
- **State** — `js/store.js` exports `createApp()` → Alpine `x-data="app"`. Board data in localStorage key `krsoul-bingo-boards-v3`.
- **Entry** — `index.html` loads `<script type="module" src="js/main.js">`. Alpine CDN injected at runtime.

## JS modules

| File | Role |
|------|------|
| `store.js` | Alpine data factory: boards, cards, marks, editor, emote picker, export/import |
| `config.js` | Constants, `generateBoardId()`, gzip compress/decompress, Unicode-safe base64 |
| `state.js` | V2→V3 migration, `loadBoards`/`saveBoards`, global `state` object (emotes, auth) |
| `emotes.js` | `splitCard()`, `getEmoteEntry()`, emote fetching from Twitch/BTTV/7TV/FFZ |
| `auth.js` | Twitch Implicit Grant OAuth, token extraction from URL fragment |
| `game.js` | Bingo detection (`completedLineKeys`), SVG `drawBingoLines`, confetti, `applyParticleTheme` |

## Card format

Cards stored as strings with `|` separator: `"Kappa | hello world"`
- Icon (before `|`) can have multiple words — each checked against emote lookup
- Label (after `|`) is plain text
- Legacy cards without `|` are auto-migrated on first emote load via `migrateCards()` in the `onEmoteRefresh` callback

## Cell rendering

`cells` computed getter produces `{ iconParts[], emoteUrl, label, marked, ... }` per cell.
- `<img x-show="cell.emoteUrl">` for emote images
- `<span x-show="!cell.emoteUrl" x-text="...">` for emoji/text, falls back to `✦` sparkle

## Editor

- Textarea uses `x-model="cardsText"` for bidirectional sync
- Setter stores raw lines as-is (no trimEnd/transformations)
- Unlimited lines — grid uses first `cellCount` lines
- Line numbers show `1..cellCount` with `✕` for extra lines

## Emote loading

- `queueInitialEmoteRefresh()` in `init()` starts async load
- `onEmoteRefresh` callback bumps `emoteVersion` (triggers `cells` re-evaluation) and runs `migrateCards()` once
- `getEmoteEntry(code)` reads `state.emotes.lookup` Map (non-reactive, re-evaluation driven by `emoteVersion`)

## Export/Import

- `exportBoardUrl()` compresses board JSON with `CompressionStream('gzip')`, encodes as base64 URL param `?b=...`
- `decompress()` with `DecompressionStream` fallback to plain base64
- Security: 50KB base64 limit, 100KB decompressed limit, 200 card max, size clamped 2-10

## Persistence

- V2→V3 migration in `state.js:migrateV2ToV3()` (single board → Board 1)
- Emote cache: 6h TTL

## Gotchas

- Alpine `x-for` inside another `x-for` may not render — kept single-level template for `iconParts`
- Alpine injected dynamically: `main.js` registers `alpine:init` listener → injects Alpine CDN → `Alpine.data('app', createApp)` → DOM scanned
- `[x-cloak]` on root container prevents FOUC during dynamic Alpine load
