# Implementation Notes

## Scope

The hub is implemented as a dependency-light static site at the repository root.

## Relevant Design Aspects Implemented

- Neon dark game shelf from the selected Claude Design direction.
- Equal-weight game cards with no featured hero.
- Pattern-based thumbnail placeholders with no title initials or letter icons.
- Pancake shown as work in progress with a WIP badge, disabled play action, and striped thumbnail treatment.
- Cards and detail pages expose Play links for live Vercel deployments and GitHub links for source.
- Live game descriptions are based on their GitHub READMEs/source, and thumbnails use fresh screenshots from the deployed sites.
- Games are listed alphabetically by default.
- Sticky top navigation with desktop links and a mobile drawer.
- Responsive search, genre chips, sort control, card grid, game detail views, builder credits, and about page.
- Stats route removed per the final design instruction.
- Breakpoints for tiny phones, normal phones, phone landscape, tablets, and desktop.

## Game Data

Only the user's current games are included. Add more games by appending to the `games` array in `src/app.js`; the listing, filters, builder counts, related games, and footer all derive from that data.

- Ding: poker-ranking game with live link, GitHub source, and `assets/shot-ding.png`, creator Jeremy, editor Michael.
- Valence: sports dashboard with live link, GitHub source, and `assets/shot-valence.png`, creator Jeremy, editor Michael.
- 25 Words or Less: live link, GitHub source, and `assets/shot-25-words.png`, creator Matthew, editor Michael.
- Pancake: WIP with GitHub source, creator Jeremy, editor Michael.

## Verification Targets

Use `npm run check` for static coverage and browser verification across:

- Desktop: 1440 x 900
- Small phone portrait: 320 x 568
- iPhone portrait: 390 x 844
- Phone landscape: 844 x 390
- Large phone landscape: 932 x 430
