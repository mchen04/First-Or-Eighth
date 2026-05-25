export const creators = {
  michael: {
    name: "Michael",
    handle: "@mchen04",
    githubUrl: "https://github.com/mchen04",
    color: "#ff3d7f",
    bio: "Autist #3."
  },
  jeremy: {
    name: "Jeremy",
    handle: "@jormyy",
    githubUrl: "https://github.com/jormyy",
    color: "#54d2d2",
    bio: "Autist #1."
  },
  matthew: {
    name: "Matthew",
    handle: "@matthewh8",
    githubUrl: "https://github.com/matthewh8",
    color: "#ffb627",
    bio: "Autist #2."
  }
};

export const games = [
  {
    id: "valence",
    name: "Valence",
    status: "Live",
    url: "https://valence1.vercel.app/",
    sourceUrl: "https://github.com/jormyy/valence",
    creator: "jeremy",
    editors: ["michael"],
    genre: "Sports",
    year: "2026",
    accent: "#54d2d2",
    screenshot: screenshotSet("assets/shot-valence"),
    tagline: "Live scores, streams, and game flow in one board.",
    description:
      "Valence is a live sports dashboard for basketball, baseball, and tennis. It pulls current games, groups them by sport and league, tracks live/upcoming/final states, and opens a watch panel with stream options and game context."
  },
  {
    id: "ding",
    name: "Ding",
    status: "Live",
    url: "https://ding-game.vercel.app/",
    sourceUrl: "https://github.com/jormyy/ding",
    creator: "jeremy",
    editors: ["michael"],
    genre: "Poker",
    year: "2026",
    accent: "#ff3d7f",
    screenshot: screenshotSet("assets/shot-ding"),
    tagline: "Rank every poker hand before the reveal punishes you.",
    description:
      "Ding is a multiplayer collaborative poker-ranking game. Players share a room, move through preflop, flop, turn, river, and reveal, and try to place every hand at the table in exact strength order. A perfect board wins; any inversion costs the table."
  },
  {
    id: "twenty-five",
    name: "25 Words or Less",
    status: "Live",
    url: "https://25-words-or-less.vercel.app/",
    sourceUrl: "https://github.com/matthewh8/25-words-or-less",
    creator: "matthew",
    editors: ["michael"],
    genre: "Party",
    year: "2026",
    accent: "#9b5de5",
    screenshot: screenshotSet("assets/shot-25-words"),
    tagline: "Build teams, pick a mode, and clue under pressure.",
    description:
      "25 Words or Less is a local same-screen party game with team setup, multiple rule presets, challenge toggles, timers, and large word banks split across green, yellow, red, and money decks."
  },
  {
    id: "pancake",
    name: "Pancake",
    status: "WIP",
    url: "",
    sourceUrl: "https://github.com/jormyy/pancake",
    creator: "jeremy",
    editors: ["michael"],
    genre: "Arcade",
    year: "2026",
    accent: "#ffb627",
    tagline: "Stack 'em while they're hot.",
    description:
      "Pancake is still being built. It gets a visible slot now so the hub already works when the game is ready to join the rotation."
  }
];

function screenshotSet(base) {
  return {
    card: `${base}-card.webp`,
    detail: `${base}-detail.webp`,
    fallback: `${base}.png`
  };
}
