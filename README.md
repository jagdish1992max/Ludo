# Ludo — 2 to 4 players

A complete Ludo board game that runs in the browser. One HTML file, one stylesheet,
one script — no build step, no dependencies, no server. Works offline.

![Board preview](https://img.shields.io/badge/players-2%20to%204-e5484d) ![No dependencies](https://img.shields.io/badge/dependencies-none-2fa84f)

## Play

Open `index.html` in any browser — that's it.

```bash
# or serve it locally
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Put it on GitHub Pages

```bash
git init
git add .
git commit -m "Ludo game"
git branch -M main
git remote add origin https://github.com/<your-username>/ludo.git
git push -u origin main
```

Then on GitHub: **Settings → Pages → Source: Deploy from a branch → main / (root) → Save.**
Your game is live at `https://<your-username>.github.io/ludo/` in a minute or two.

## Rules implemented

- Roll a **6** to bring a token out of the yard.
- A **6** gives another roll; capturing also gives another roll.
- Three 6s in a row and the turn is skipped.
- Landing on an opponent token sends it back to its yard.
- **8 safe squares** — the 4 coloured start squares and the 4 starred squares. No captures there.
- You need the **exact** number to enter the centre (home).
- First player to bring all four tokens home wins.

## Files

| File | What it does |
| --- | --- |
| `index.html` | Page structure: board, dice, player list, modals |
| `style.css` | All styling and the responsive layout |
| `game.js` | Board drawing, rules engine, turn handling, animations |

## How the board is built

The board is an SVG on a 15×15 grid of 40-unit squares.

- `TRACK` — the 52 squares of the outer ring, in travel order, as `[row, col]`.
- `STARTS` — where each colour enters the ring (`0, 13, 26, 39`).
- `HOME_PATH` — the 5 coloured squares each colour walks before the centre.
- `SAFE` — ring indexes of the 8 safe squares.

A token's position is a single number: `-1` in the yard, `0…50` on the ring,
`51…55` in the home lane, `56` home. Moving is just `pos += dice`, which keeps the
rules code short and easy to change.

## Things you could add

- Computer players (a bot that picks the best legal move)
- Online multiplayer with room codes (needs a small backend, e.g. socket.io)
- Sound effects and a scoreboard across rounds
- A "blocking" rule, where two tokens of one colour block the path

## License

MIT — do whatever you like with it.
