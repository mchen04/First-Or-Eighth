# Implementation Notes

## Scope

The repo started empty except for Git metadata, so the hub was implemented as a static site at the repository root.

## Relevant Design Aspects Implemented

- Neon dark leaderboard aesthetic from variation #1.
- Sticky top navigation with desktop links and a mobile drawer.
- Responsive hero, searchable game library, genre chips, and sort control.
- Game detail route for every title.
- Creator and editor credit treatment.
- Stats and about pages.
- Tap targets sized for phones and landscape layouts.
- Viewport-fit route layouts with no document scrolling across tested desktop, portrait phone, and landscape phone sizes.
- Live PNG thumbnails captured from the deployed Ding, Valence, and 25 Words or Less pages.

## Game Data

Only the user's current games are included. Prototype filler titles were intentionally omitted.

- Ding: live link, creator Jeremy, editor Michael.
- Valence: live link, creator Jeremy, editor Michael.
- 25 Words or Less: live link, creator Matthew, editor Michael.
- Pancake: incoming, creator Jeremy, editor Michael.

## Thumbnail Sources

- `assets/thumb-ding.png`: captured from <https://ding-game.vercel.app/>
- `assets/thumb-valence.png`: captured from <https://valence1.vercel.app/>
- `assets/thumb-25.png`: captured from <https://25-words-or-less.vercel.app/>
- `assets/thumb-pancake.svg`: incoming placeholder; replace once Pancake has a deployed URL.

## Verification Targets

Use `npm run check` for static coverage and `agent-browser` for rendered checks across:

- Desktop: 1440 x 900
- Small phone portrait: 320 x 568
- iPhone portrait: 390 x 844
- Phone landscape: 844 x 390
- Large phone landscape: 932 x 430
