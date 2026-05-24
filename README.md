# First or Eighth

First or Eighth is a responsive game hub for the current friend-group games:

- Ding: live at <https://ding-game.vercel.app/>
- Valence: live at <https://valence1.vercel.app/>
- 25 Words or Less: live at <https://25-words-or-less.vercel.app/>
- Pancake: incoming

The visual direction follows the selected Claude Design prototype, `First or Eighth - Live.html`: a neon dark leaderboard/library with a mobile drawer, searchable cards, game detail views, creator credits, stats, and a short about page.

The interface is intentionally viewport-fit: each route is designed to fit inside the current desktop or phone viewport without document scrolling. On very small and landscape screens, secondary copy is clamped and the layouts compress into denser cards so the whole screen remains visible.

Live game thumbnails are PNG screenshots captured from the deployed game pages. Pancake still uses an incoming-game graphic because no deployed Pancake URL is available yet.

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

The bundle said the selected direction was design #1: neon dark / leaderboard, made responsive for mobile.
