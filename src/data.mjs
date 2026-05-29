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
  },
  justin: {
    name: "Justin",
    handle: "@justinwtan",
    githubUrl: "https://github.com/justinwtan",
    color: "#5b8cff",
    bio: "Autist #4."
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
    genre: "Arcade",
    year: "2026",
    accent: "#ff3d7f",
    screenshot: screenshotSet("assets/shot-ding"),
    tagline: "Rank every poker hand before the reveal punishes you.",
    description:
      "Ding is a multiplayer collaborative poker-ranking game. Players share a room, move through preflop, flop, turn, river, and reveal, and try to place every hand at the table in exact strength order. A perfect board wins; any inversion costs the table."
  },
  {
    id: "loldle",
    name: "LoLdle",
    status: "Live",
    url: "https://loldle-app.vercel.app/",
    sourceUrl: "https://github.com/mchen04/LoLdle",
    creator: "michael",
    editors: [],
    genre: "Arcade",
    year: "2026",
    accent: "#c8aa6e",
    screenshot: screenshotSet("assets/shot-loldle"),
    tagline: "Guess League champions across five endless clue modes.",
    description:
      "LoLdle is an endless League of Legends champion guessing game. It supports Classic attribute feedback, Quote, Ability, Emoji, and Splash rounds, with champion search, stats, settings, and replayable randomized puzzles."
  },
  {
    id: "twenty-five",
    name: "25 Words or Less",
    status: "Live",
    url: "https://25-words-or-less.vercel.app/",
    sourceUrl: "https://github.com/matthewh8/25-words-or-less",
    creator: "matthew",
    editors: ["michael"],
    genre: "Arcade",
    year: "2026",
    accent: "#9b5de5",
    screenshot: screenshotSet("assets/shot-25-words"),
    tagline: "Build teams, pick a mode, and clue under pressure.",
    description:
      "25 Words or Less is a local same-screen party game with team setup, multiple rule presets, challenge toggles, timers, and large word banks split across green, yellow, red, and money decks."
  },
  {
    id: "heardle",
    name: "Heardle",
    status: "Live",
    url: "https://heardle67.vercel.app",
    sourceUrl: "https://github.com/jormyy/heardle",
    creator: "jeremy",
    editors: [],
    genre: "Arcade",
    year: "2026",
    accent: "#1db954",
    screenshot: screenshotSet("assets/shot-heardle"),
    tagline: "Pick a theme. Guess the track. Six clips to get it right.",
    description:
      "Heardle is a music guessing game where players identify a song from progressively longer audio clips. Choose an artist, genre, or decade, then work through up to six attempts as the snippet grows from one second to sixteen. Backed by the Deezer catalog with popularity filtering and type-ahead search."
  },
  {
    id: "kings-cup",
    name: "King's Cup",
    status: "Live",
    url: "https://kings-cup-liard.vercel.app/",
    sourceUrl: "https://github.com/mchen04/Kings_Cup",
    creator: "michael",
    editors: ["justin"],
    genre: "Arcade",
    year: "2026",
    accent: "#e3b23c",
    screenshot: screenshotSet("assets/shot-kings-cup"),
    tagline: "Pass the phone. Draw a card. Honor the card.",
    description:
      "King's Cup is a pass-the-phone party card game. Add your players, then take turns drawing from a full deck where every rank carries a rule — Waterfall, Mate, Rhyme, Floor, and the rest — while an on-screen King's Cup meter fills with each King drawn. Whoever pulls the fourth King drinks the cup and ends the game. Built with React and TypeScript, mobile-first for one shared phone."
  },
  {
    id: "pour-decisions",
    name: "Pour Decisions",
    status: "Live",
    url: "https://drinking-games-eosin.vercel.app/",
    sourceUrl: "https://github.com/mchen04/Drinking_Games",
    creator: "michael",
    editors: [],
    genre: "Arcade",
    year: "2026",
    accent: "#d946ef",
    screenshot: screenshotSet("assets/shot-pour-decisions"),
    tagline: "Pick your poison from 36 neon party games.",
    description:
      "Pour Decisions is a neon-noir drinking games arcade with 36 animated games across eight categories — party prompts, card and dice games, spinners, endurance runs, verbal duels, skill challenges, and trivia. A shared player roster carries across every pass-and-play mode, sound effects are synthesised live with the Web Audio API, and the whole thing is mobile-first for passing one phone around the table. Every game works dry too — swap sips for any forfeit you like."
  },
  {
    id: "neon-royale",
    name: "Neon Royale",
    status: "Live",
    url: "https://casino-topaz-gamma.vercel.app/",
    sourceUrl: "https://github.com/mchen04/Casino",
    creator: "michael",
    editors: [],
    genre: "Arcade",
    year: "2026",
    accent: "#ef2d56",
    screenshot: screenshotSet("assets/shot-casino"),
    tagline: "33 play-money casino games on one neon floor.",
    description:
      "Neon Royale is a neon art-deco casino with 33-plus fully playable games across cards, table, slots, wheels, dice, modern crypto-style rounds, and lottery. One persistent play-money chip wallet carries across every game, Framer Motion drives 3D card deals, spinning roulette wheels, cascading Megaways reels, and rising Crash rockets, and sound is synthesised with the Web Audio API. Pure play money — no accounts, no payments, no real wagering."
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
