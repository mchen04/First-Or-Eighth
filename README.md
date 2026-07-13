# First or Eighth

First or Eighth is a responsive game hub for the current friend-group games:

- Ding: live at <https://ding-game.vercel.app/> / source at <https://github.com/jormyy/ding>
- Better 82-0 Multiplayer: live at <https://82-0-orpin.vercel.app/> / source at <https://github.com/mchen04/82-0>
- Hark: live at <https://audiobook-pwa-plum.vercel.app/> / source at <https://github.com/mchen04/audiobook_pwa> / companion converter at <https://github.com/mchen04/Epub_Listener>
- CodeNames: work in progress at <https://codenames-rho-smoky.vercel.app/> / source at <https://github.com/mchen04/CodeNames>
- Felt: live at <https://pokernow.vercel.app/> / source at <https://github.com/mchen04/pokernow>
- LoLdle: live at <https://loldle-app.vercel.app/> / source at <https://github.com/mchen04/LoLdle>
- SplitWisest: live at <https://splitwisest-kappa.vercel.app/> / source at <https://github.com/mchen04/SplitWisest>
- Valence: live at <https://valence1.vercel.app/> / source at <https://github.com/jormyy/valence>
- 25 Words or Less: live at <https://25-words-or-less.vercel.app/> / source at <https://github.com/matthewh8/25-words-or-less>
- Heardle: live at <https://heardle67.vercel.app> / source at <https://github.com/jormyy/heardle>
- King's Cup: live at <https://kings-cup-liard.vercel.app/> / source at <https://github.com/mchen04/Kings_Cup>
- Pour Decisions: live at <https://drinking-games-eosin.vercel.app/> / source at <https://github.com/mchen04/Drinking_Games>
- Neon Royale: live at <https://casino-topaz-gamma.vercel.app/> / source at <https://github.com/mchen04/Casino>
- Pancake: work in progress / source at <https://github.com/jormyy/pancake>

The visual direction is a neon dark game shelf with equal-weight cards, a mobile
drawer, searchable/filterable listings, a compact game detail overlay, and
builder credits.

## Data — the single canonical source

Everything the hub shows comes from two hand-editable YAML files:

- [`data/creators.yaml`](data/creators.yaml) — the builders.
- [`data/games.yaml`](data/games.yaml) — the games.

There is no build step and no generated copy of the data. The browser fetches
the YAML at runtime, and the Node checks read the very same files, so what ships
and what is verified can never drift. Both go through one small dependency-free
parser in [`src/lib/yaml.mjs`](src/lib/yaml.mjs) and one normalize/validate
layer in [`src/lib/data.mjs`](src/lib/data.mjs).

### Add a builder

Copy a block in `data/creators.yaml`, give it a new id, and fill in `name`,
`handle`, `github`, `color`, and `bio`. Reference the id from any game's
`creator` or `editors`.

### Add a game

1. Add an entry to `data/games.yaml` (copy an existing block — the fields are
   documented at the top of the file).
2. Drop a `1440x900` capture at `assets/<id>.png`, where `<id>` matches the
   game's `id`.
3. Run `npm run assets` to generate the `640x400` card and `1200x750` detail
   WebP variants.

That's it — the listing, search, filters, sort, builder counts, footer, online
count, and the static checks all derive from that one entry. A work-in-progress
game with no capture sets `screenshot: false` and uses the striped placeholder.

## Development

This is a dependency-light static site.

```sh
npm run dev
```

Then open <http://localhost:5173>.

Run the static checks (data validation, file/stylesheet contracts, and image
dimension checks) with:

```sh
npm run check
```

## Credits

- Jeremy created Ding, Valence, Heardle, and Pancake.
- Matthew created 25 Words or Less.
- Michael created Better 82-0 Multiplayer, Hark, CodeNames, Felt, LoLdle, King's Cup, Pour Decisions, SplitWisest, and Neon Royale, and edited the other current games and the hub presentation.
- Justin edited King's Cup.

## Design Notes

Games stay in an equal alphabetical list, each playable card exposes Play and
GitHub links, and opening a card raises a deep-linkable detail overlay
(`#/game/<id>`) tuned so the capture, title, tagline, tags, builders, and action
bar stay in view without scrolling across mobile portrait, mobile landscape,
tablet, and desktop. Temporary review screenshots and browser artifacts belong
outside the repo, for example under `/tmp/first-eighth-critical/`.
