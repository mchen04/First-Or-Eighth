# First or Eighth

First or Eighth is a responsive game hub for the current friend-group games:

- Ding: live at <https://ding-game.vercel.app/> / source at <https://github.com/jormyy/ding>
- Valence: live at <https://valence1.vercel.app/> / source at <https://github.com/jormyy/valence>
- 25 Words or Less: live at <https://25-words-or-less.vercel.app/> / source at <https://github.com/matthewh8/25-words-or-less>
- Pancake: work in progress / source at <https://github.com/jormyy/pancake>

The visual direction is a neon dark game shelf with equal-weight cards, a mobile drawer, searchable/filterable listings, game detail views, creator credits, and a short about page.

## Credits

- Jeremy created Ding, Valence, and Pancake.
- Matthew created 25 Words or Less.
- Michael edited the current games and the hub presentation.

## Development

This is a dependency-light static site.

```sh
npm run dev
```

Then open <http://localhost:5173>.

Run the static checks with:

```sh
npm run check
```

## Design Notes

The current implementation removes the featured hero, stats route, and letter-icon thumbnails. Games stay in an equal alphabetical list, each playable card exposes Play and GitHub links, and the layout is maintained across mobile portrait, mobile landscape, tablet, and desktop.

Temporary review screenshots and browser artifacts belong outside the repo, for example under `/tmp/first-eighth-critical/`.
