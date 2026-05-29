# Implementation Notes

## Scope

The hub is implemented as a dependency-light static site at the repository root. Global tokens stay in `styles.css`; shell, shared primitives, library/card, detail, creator, and responsive rules are split into focused files under `css/`.

## Relevant Design Aspects Implemented

- Neon dark game shelf with compact, equal-weight game cards.
- Equal-weight game cards with no featured hero.
- Live games use screenshot captures; Pancake uses an in-CSS striped WIP placeholder with no title initials or letter icons.
- Pancake shown as work in progress with a WIP badge, disabled play action, and striped thumbnail treatment.
- Cards and detail pages expose Play links for live Vercel deployments and GitHub links for source.
- Live game descriptions are based on their GitHub READMEs/source, and thumbnails use fresh screenshots from the deployed sites with responsive WebP variants.
- Games are listed alphabetically by default.
- Builders are listed alphabetically and their handles link to GitHub profiles.
- The topbar online count is derived from live playable games instead of being hardcoded.
- Sticky top navigation with desktop links and a modal mobile drawer.
- Responsive search, genre chips, sort control, card grid, game detail views, and builder credits.
- Stats route removed per the final design instruction.
- Small phone portrait: 320 x 568
- iPhone portrait: 390 x 844
- Phone landscape: 844 x 390
- Large phone landscape: 932 x 430
- Desktop: 1440 x 900

Review screenshots and temporary browser artifacts are intentionally kept outside the repository, normally in `/tmp/first-eighth-critical/`.

## Game Data

Only the user's current games are included. Add more games by appending to the `games` array in `src/data.mjs`; the listing, filters, builder counts, related games, footer, and static checks all derive from that data.

- Live games use a screenshot triplet generated from a common base name: `assets/shot-name-card.webp`, `assets/shot-name-detail.webp`, and `assets/shot-name.png`.
- Run `npm run assets` after replacing a `1440 x 900` fallback PNG to regenerate the `640 x 400` card WebP and `1200 x 750` detail WebP.
- 25 Words or Less: live link, GitHub source, and `assets/shot-25-words*`, creator Matthew, editor Michael.
- Ding: poker-ranking game with live link, GitHub source, and `assets/shot-ding*`, creator Jeremy, editor Michael.
- LoLdle: League champion guessing game with live link, GitHub source, and `assets/shot-loldle*`, creator Michael.
- Valence: sports dashboard with live link, GitHub source, and `assets/shot-valence*`, creator Jeremy, editor Michael.
- Heardle: music guessing game with live link, GitHub source, and `assets/shot-heardle*`, creator Jeremy.
- King's Cup: pass-the-phone card game with live link, GitHub source, and `assets/shot-kings-cup*`, creator Michael, editor Justin.
- Pour Decisions: neon drinking-games arcade with live link, GitHub source, and `assets/shot-pour-decisions*`, creator Michael.
- Neon Royale: play-money casino with live link, GitHub source, and `assets/shot-casino*`, creator Michael.
- Pancake: WIP with GitHub source, creator Jeremy, editor Michael.

## Verification Targets

Use `npm run check` for static coverage and browser verification across:

- Desktop: 1440 x 900
- Small phone portrait: 320 x 568
- iPhone portrait: 390 x 844
- Phone landscape: 844 x 390
- Large phone landscape: 932 x 430
