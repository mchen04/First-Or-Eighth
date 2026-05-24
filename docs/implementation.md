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

## Game Data

Only the user's current games are included. Prototype filler titles were intentionally omitted.

- Ding: live link, creator Jeremy, editor Michael.
- Valence: live link, creator Jeremy, editor Michael.
- 25 Words or Less: live link, creator Matthew, editor Michael.
- Pancake: incoming, creator Jeremy, editor Michael.

## Verification Targets

Use `npm run check` for static coverage and `agent-browser` for rendered checks across:

- Desktop: 1440 x 900
- Small phone portrait: 320 x 568
- iPhone portrait: 390 x 844
- Phone landscape: 844 x 390
- Large phone landscape: 932 x 430
