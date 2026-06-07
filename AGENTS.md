# KRSoul Bingo — Agent Instructions

## Workflow
- Before committing: present the plan and **ask for confirmation as a plain reply** (don't offer numbered options).
- Don't commit after each fix. Verify with the developer first.
- When iterating on the same issue as the previous commit, **amend** instead of creating a new commit.

## Language
- Agent communication: **English**.
- UI text: **Ukrainian**. K-pop artist names and technical terms may stay in English or Korean. **No Russian, ever.**

## Deploy
```sh
npx wrangler pages deploy . --branch production
# Dev (required for Twitch OAuth):
npx wrangler pages dev .
```

## Stack
- Static SPA — Alpine.js v3.13.7 (injected at runtime by `js/main.js`), Cloudflare Pages.
- Twitch Implicit Grant OAuth (no server, no proxy, zero-scope token).
- State in localStorage key `krsoul-bingo-boards-v3`.

## Key files
| File | Role |
|------|------|
| `store.js` | Alpine `createApp()` — boards, cards, marks, editor, emote picker, export/import |
| `config.js` | Constants, ID generation, gzip compress/decompress, Unicode-safe base64 |
| `state.js` | V2→V3 migration, `loadBoards`/`saveBoards`, global `state` (emotes, auth) |
| `emotes.js` | `splitCard()`, emote lookup from Twitch/BTTV/7TV/FFZ |
| `auth.js` | Twitch OAuth, token from URL fragment |
| `game.js` | Bingo detection, SVG lines, confetti, particle themes |

## Card format
`"Kappa | hello world"` — icon before `|`, label after. Legacy cards (no `|`) are auto-migrated on first emote load.

## Gotchas
- Alpine injected dynamically: `main.js` registers `alpine:init` → injects CDN → registers `Alpine.data('app', createApp)`.
- `[x-cloak]` prevents FOUC.
- No nested `x-for` — keep templates single-level.
- Export: gzip → base64 `?b=` param. Limits: 50KB base64, 100KB decompressed, 200 cards max.