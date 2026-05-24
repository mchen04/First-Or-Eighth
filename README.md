# First or Eighth

First or Eighth is a responsive game hub for the current friend-group games:

- Ding: live at <https://ding-game.vercel.app/> / source at <https://github.com/jormyy/ding>
- Valence: live at <https://valence1.vercel.app/> / source at <https://github.com/jormyy/valence>
- 25 Words or Less: live at <https://25-words-or-less.vercel.app/> / source at <https://github.com/matthewh8/25-words-or-less>
- Pancake: work in progress / source at <https://github.com/jormyy/pancake>

The visual direction follows the final Claude Design handoff for `First or Eighth - Live.html`: a neon dark game shelf with equal-weight cards, a mobile drawer, searchable/filterable listings, game detail views, creator credits, and a short about page.

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

## Design Source

The implementation was based on the fetched Claude Design handoff bundle:

- `first-or-eighth/README.md`
- `first-or-eighth/chats/chat1.md`
- `first-or-eighth/project/First or Eighth - Live.html`
- `first-or-eighth/project/shared/games.jsx`
- `first-or-eighth/project/prototype/app.jsx`
- `first-or-eighth/project/prototype/styles.css`

The final chat instruction selected design #1, then revised it to remove the featured hero, remove stats, remove letter-icon thumbnails, keep the games in an equal alphabetical list, expose Play and GitHub links, and keep the layout solid across mobile portrait, mobile landscape, tablet, and desktop.
