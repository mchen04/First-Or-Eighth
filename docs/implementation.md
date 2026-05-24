# Implementation Notes

## Scope

The repo started empty except for Git metadata, so the hub was implemented as a static site at the repository root.

## Relevant Design Aspects Implemented

- Neon dark arcade-library aesthetic from variation #1.
- Sticky top navigation with desktop links and a mobile drawer.
- Responsive hero, searchable game library, genre chips, and sort control.
- Game detail route for every title.
- Creator and editor credit treatment.
- About page; the separate stats page and stat panels were removed because they duplicated low-value catalog information.
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
- `assets/thumb-pancake-wip.svg`: incoming WIP placeholder; replace once Pancake has a deployed URL.

## Verification Targets

Use `npm run check` for static coverage and `agent-browser` for rendered checks across:

- Desktop: 1440 x 900 and 1024 x 768
- Phone portrait: 320 x 568, 360 x 640, 390 x 844, and 430 x 932
- Phone landscape: 568 x 320, 667 x 375, 740 x 390, 844 x 390, and 932 x 430
