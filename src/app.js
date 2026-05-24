const creators = {
  michael: {
    name: "Michael",
    handle: "@michael",
    color: "#ff4d8d",
    bio: "Editor across the whole cabinet."
  },
  jeremy: {
    name: "Jeremy",
    handle: "@jeremy",
    color: "#43dfd1",
    bio: "Creator of Ding, Valence, and Pancake."
  },
  matthew: {
    name: "Matthew",
    handle: "@matthew",
    color: "#ffca3a",
    bio: "Creator of 25 Words or Less."
  }
};

const games = [
  {
    id: "ding",
    name: "Ding",
    status: "Live",
    url: "https://ding-game.vercel.app/",
    creator: "jeremy",
    editors: ["michael"],
    genre: "Reflex",
    rank: 1,
    accent: "#ff4d8d",
    secondary: "#43dfd1",
    tagline: "Tap in sync, miss clean, talk trash after.",
    description:
      "A quick-hit rhythm and reaction game built for the kind of group session where every round starts as a joke and ends with a rematch.",
    stats: { mode: "Browser", players: "Group", pace: "Fast", state: "Live" },
    screenshot: "assets/thumb-ding.svg"
  },
  {
    id: "valence",
    name: "Valence",
    status: "Live",
    url: "https://valence1.vercel.app/",
    creator: "jeremy",
    editors: ["michael"],
    genre: "Puzzle",
    rank: 2,
    accent: "#43dfd1",
    secondary: "#8b5cf6",
    tagline: "Make the right bonds before the board turns on you.",
    description:
      "A chemistry-flavored puzzle game with a clean board-game rhythm: read the state, commit to the bond, and hope the next move still works.",
    stats: { mode: "Browser", players: "Solo", pace: "Thinky", state: "Live" },
    screenshot: "assets/thumb-valence.svg"
  },
  {
    id: "twenty-five",
    name: "25 Words or Less",
    status: "Live",
    url: "https://25-words-or-less.vercel.app/",
    creator: "matthew",
    editors: ["michael"],
    genre: "Party",
    rank: 3,
    accent: "#ffca3a",
    secondary: "#ff4d8d",
    tagline: "Say enough, but not too much.",
    description:
      "A party-word game about restraint under pressure. The constraint is simple, which is exactly why the room gets loud.",
    stats: { mode: "Browser", players: "Teams", pace: "Chaotic", state: "Live" },
    screenshot: "assets/thumb-25.svg"
  },
  {
    id: "pancake",
    name: "Pancake",
    status: "Incoming",
    url: "",
    creator: "jeremy",
    editors: ["michael"],
    genre: "Arcade",
    rank: 4,
    accent: "#7cff6b",
    secondary: "#ff8a3d",
    tagline: "The next cabinet slot is warming up.",
    description:
      "Pancake is the incoming game in the group rotation. It gets a visible slot now so the hub feels complete when the link goes live.",
    stats: { mode: "Soon", players: "TBD", pace: "TBD", state: "Incoming" },
    screenshot: "assets/thumb-pancake.svg"
  }
];

const state = {
  route: readRoute(),
  query: "",
  genre: "All",
  sort: "rank",
  navOpen: false
};

const app = document.querySelector("#app");

window.addEventListener("hashchange", () => {
  state.route = readRoute();
  state.navOpen = false;
  render();
  window.scrollTo({ top: 0, behavior: "auto" });
});

document.addEventListener("click", (event) => {
  const navLink = event.target.closest("[data-nav-link]");
  if (navLink && state.navOpen) {
    state.navOpen = false;
    render();
  }

  const action = event.target.closest("[data-action]");
  if (!action) return;

  const type = action.dataset.action;
  if (type === "toggle-nav") state.navOpen = !state.navOpen;
  if (type === "close-nav") state.navOpen = false;
  if (type === "set-genre") state.genre = action.dataset.genre;
  if (type === "open-game") location.hash = `#/game/${action.dataset.game}`;
  if (type === "copy-link") {
    copyCurrentLink(action);
    return;
  }
  render();
});

document.addEventListener("input", (event) => {
  if (event.target.matches("[data-search]")) {
    state.query = event.target.value;
    render();
    const input = document.querySelector("[data-search]");
    input.focus();
    input.setSelectionRange(state.query.length, state.query.length);
    return;
  }

  if (event.target.matches("[data-sort]")) {
    state.sort = event.target.value;
    render();
  }
});

render();

function readRoute() {
  const hash = location.hash.replace(/^#\/?/, "");
  if (!hash) return { name: "home" };
  const [name, id] = hash.split("/");
  if (name === "game" && games.some((game) => game.id === id)) return { name: "game", id };
  if (["creators", "stats", "about"].includes(name)) return { name };
  return { name: "home" };
}

function render() {
  app.innerHTML = `
    ${topbar()}
    ${mainView()}
    ${footer()}
  `;
}

function topbar() {
  const routeName = state.route.name;
  const links = [
    ["home", "Library", "#/"],
    ["creators", "Creators", "#/creators"],
    ["stats", "Stats", "#/stats"],
    ["about", "About", "#/about"]
  ];

  return `
    <header class="topbar">
      <a class="brand" href="#/" aria-label="First or Eighth home">
        <span class="brand-mark" aria-hidden="true"></span>
        <span>FIRST_OR_EIGHTH</span>
      </a>
      <nav class="desktop-nav" aria-label="Primary">
        ${links.map(([id, label, href]) => navLink(id, label, href, routeName)).join("")}
      </nav>
      <div class="topbar-right">
        <span class="live-pill"><span></span>3 online</span>
        <button class="icon-button" data-action="toggle-nav" aria-label="Open menu" aria-expanded="${state.navOpen}">
          <span></span><span></span><span></span>
        </button>
      </div>
    </header>
    <div class="mobile-scrim ${state.navOpen ? "is-open" : ""}" data-action="close-nav"></div>
    <aside
      class="mobile-drawer ${state.navOpen ? "is-open" : ""}"
      aria-label="Mobile navigation"
      aria-hidden="${state.navOpen ? "false" : "true"}"
      ${state.navOpen ? "" : "inert"}
    >
      <button class="drawer-close" data-action="close-nav" aria-label="Close menu">x</button>
      ${links.map(([id, label, href]) => navLink(id, label, href, routeName)).join("")}
      <div class="drawer-foot">
        <span class="status-dot"></span>
        Michael edits all current titles
      </div>
    </aside>
  `;
}

function navLink(id, label, href, routeName) {
  const active = (id === "home" && routeName === "home") || id === routeName;
  return `<a class="${active ? "is-active" : ""}" href="${href}" data-nav-link>${label}</a>`;
}

function mainView() {
  if (state.route.name === "game") return gameDetail(games.find((game) => game.id === state.route.id));
  if (state.route.name === "creators") return creatorsPage();
  if (state.route.name === "stats") return statsPage();
  if (state.route.name === "about") return aboutPage();
  return libraryPage();
}

function libraryPage() {
  const featured = games[0];
  const filtered = filteredGames();
  const showFeatured = !state.query && state.genre === "All";
  const list = showFeatured ? filtered.filter((game) => game.id !== featured.id) : filtered;
  const genres = ["All", ...new Set(games.map((game) => game.genre))];

  return `
    <main class="page">
      ${showFeatured ? hero(featured) : ""}
      <section class="controls" aria-label="Game filters">
        <label class="search-box">
          <span>Search</span>
          <input data-search type="search" value="${escapeAttr(state.query)}" placeholder="Search games, genres, creators" />
        </label>
        <label class="sort-box">
          <span>Sort</span>
          <select data-sort>
            ${option("rank", "Ranked")}
            ${option("live", "Live first")}
            ${option("az", "A to Z")}
            ${option("creator", "Creator")}
          </select>
        </label>
      </section>
      <section class="section-head">
        <p>${showFeatured ? "All games" : "Results"} / ${filtered.length} ${filtered.length === 1 ? "title" : "titles"}</p>
        <div class="chip-row" aria-label="Genre filters">
          ${genres.map((genre) => `
            <button class="chip ${state.genre === genre ? "is-active" : ""}" data-action="set-genre" data-genre="${genre}">
              ${genre}
            </button>
          `).join("")}
        </div>
      </section>
      ${list.length ? `<section class="game-grid">${list.map(gameCard).join("")}</section>` : emptyState()}
    </main>
  `;
}

function hero(game) {
  return `
    <section class="hero">
      <div class="hero-copy">
        <p class="eyebrow">Now playing / featured</p>
        <h1>First or Eighth.</h1>
        <p class="hero-desc">
          A shared lobby for the games we actually play: fast to open, easy to route, and loud enough to feel like a LAN night.
        </p>
        <div class="hero-meta">
          <span>4 games</span>
          <span>3 builders</span>
          <span>No filler</span>
        </div>
        <div class="hero-actions">
          ${playButton(game, "Play Ding")}
          <button class="button button-secondary" data-action="open-game" data-game="${game.id}">Read card</button>
        </div>
      </div>
      <button class="hero-art" data-action="open-game" data-game="${game.id}" aria-label="Open Ding details">
        <span class="hero-badge">#1 this week</span>
        ${thumb(game, true)}
      </button>
    </section>
  `;
}

function filteredGames() {
  const query = state.query.trim().toLowerCase();
  let list = games.filter((game) => {
    const creator = creators[game.creator].name;
    const editorNames = game.editors.map((id) => creators[id].name).join(" ");
    const haystack = `${game.name} ${game.genre} ${game.tagline} ${game.description} ${creator} ${editorNames}`.toLowerCase();
    return (state.genre === "All" || game.genre === state.genre) && (!query || haystack.includes(query));
  });

  if (state.sort === "rank") list = list.sort((a, b) => a.rank - b.rank);
  if (state.sort === "live") list = list.sort((a, b) => Number(b.status === "Live") - Number(a.status === "Live") || a.rank - b.rank);
  if (state.sort === "az") list = list.sort((a, b) => a.name.localeCompare(b.name));
  if (state.sort === "creator") list = list.sort((a, b) => creators[a.creator].name.localeCompare(creators[b.creator].name));
  return list;
}

function option(value, label) {
  return `<option value="${value}" ${state.sort === value ? "selected" : ""}>${label}</option>`;
}

function gameCard(game) {
  return `
    <article class="game-card">
      <button class="card-open" data-action="open-game" data-game="${game.id}" aria-label="Open ${escapeAttr(game.name)} details">
        ${thumb(game)}
        <span class="rank">#${game.rank}</span>
      </button>
      <div class="card-body">
        <div class="card-title-row">
          <h2>${game.name}</h2>
          <span class="status ${game.status.toLowerCase()}">${game.status}</span>
        </div>
        <p>${game.tagline}</p>
        <div class="card-credits">
          ${personPill(game.creator, "Creator")}
          ${game.editors.map((id) => personPill(id, "Editor")).join("")}
        </div>
        <div class="card-actions">
          ${playButton(game, game.status === "Live" ? "Play" : "Soon")}
          <button class="small-link" data-action="open-game" data-game="${game.id}">Details</button>
        </div>
      </div>
    </article>
  `;
}

function gameDetail(game) {
  const related = games.filter((candidate) => candidate.id !== game.id);
  return `
    <main class="page detail-page">
      <a class="back-link" href="#/">Back to library</a>
      <section class="detail-hero">
        <div class="detail-media">${thumb(game, true)}</div>
        <div class="detail-copy">
          <p class="eyebrow">${game.genre} / ${game.status}</p>
          <h1>${game.name}.</h1>
          <p class="detail-tagline">${game.tagline}</p>
          <p>${game.description}</p>
          <div class="detail-actions">
            ${playButton(game, game.status === "Live" ? `Play ${game.name}` : "Incoming")}
            <button class="button button-secondary" data-action="copy-link">Copy page link</button>
          </div>
        </div>
      </section>
      <section class="stat-grid">
        ${Object.entries(game.stats).map(([key, value]) => `
          <div class="stat-card">
            <span>${key}</span>
            <strong>${value}</strong>
          </div>
        `).join("")}
      </section>
      <section class="credits-panel">
        <div>
          <p class="eyebrow">Credits</p>
          <h2>Built by friends, edited into one cabinet.</h2>
        </div>
        <div class="credit-list">
          ${creditCard(game.creator, "Creator")}
          ${game.editors.map((id) => creditCard(id, "Editor")).join("")}
        </div>
      </section>
      <section class="related">
        <div class="section-head compact"><p>Keep playing</p></div>
        <div class="game-grid mini">${related.map(gameCard).join("")}</div>
      </section>
    </main>
  `;
}

function creatorsPage() {
  return `
    <main class="page">
      <section class="page-intro">
        <p class="eyebrow">The builders</p>
        <h1>Three friends, one rotating game shelf.</h1>
      </section>
      <section class="creator-grid">
        ${Object.entries(creators).map(([id, creator]) => {
          const created = games.filter((game) => game.creator === id);
          const edited = games.filter((game) => game.editors.includes(id));
          return `
            <article class="creator-card">
              <div class="creator-head">
                <span class="avatar" style="--avatar:${creator.color}">${creator.name[0]}</span>
                <div>
                  <h2>${creator.name}</h2>
                  <p>${creator.handle}</p>
                </div>
              </div>
              <p>${creator.bio}</p>
              <div class="creator-stats">
                <span><strong>${created.length}</strong> created</span>
                <span><strong>${edited.length}</strong> edited</span>
              </div>
              <div class="creator-games">
                ${[...created, ...edited.filter((game) => !created.includes(game))].map((game) => `
                  <button data-action="open-game" data-game="${game.id}">
                    <span>${game.name}</span>
                    <small>${game.creator === id ? "Creator" : "Editor"}</small>
                  </button>
                `).join("")}
              </div>
            </article>
          `;
        }).join("")}
      </section>
    </main>
  `;
}

function statsPage() {
  const live = games.filter((game) => game.status === "Live").length;
  const incoming = games.length - live;
  return `
    <main class="page">
      <section class="page-intro">
        <p class="eyebrow">Lobby stats</p>
        <h1>Small catalog, fast routes.</h1>
      </section>
      <section class="stat-grid wide">
        <div class="stat-card"><span>Games</span><strong>${games.length}</strong></div>
        <div class="stat-card"><span>Live</span><strong>${live}</strong></div>
        <div class="stat-card"><span>Incoming</span><strong>${incoming}</strong></div>
        <div class="stat-card"><span>Editors</span><strong>1</strong></div>
      </section>
      <section class="leaderboard">
        ${games.map((game) => `
          <button class="leader-row" data-action="open-game" data-game="${game.id}">
            <span>${String(game.rank).padStart(2, "0")}</span>
            <strong>${game.name}</strong>
            <em>${creators[game.creator].name}</em>
            <small>${game.status}</small>
          </button>
        `).join("")}
      </section>
    </main>
  `;
}

function aboutPage() {
  return `
    <main class="page about-page">
      <section class="page-intro">
        <p class="eyebrow">About</p>
        <h1>First or Eighth is the friend-group game shelf.</h1>
      </section>
      <div class="about-copy">
        <p>
          The name is a light TFT joke: first place or eighth place, glory or instant queue. The site keeps that energy without becoming a TFT fansite.
        </p>
        <p>
          Ding, Valence, and Pancake are Jeremy games. 25 Words or Less is Matthew's. Michael edited the current set so they sit together as one lobby.
        </p>
      </div>
    </main>
  `;
}

function thumb(game, big = false) {
  return `
    <div class="thumb ${big ? "big" : ""}" style="--accent:${game.accent}; --secondary:${game.secondary}">
      <img src="${game.screenshot}" alt="" loading="lazy" />
      <div class="thumb-overlay">
        <span>${game.genre}</span>
        <strong>${game.name.split(" ").map((word) => word[0]).join("").slice(0, 3)}</strong>
      </div>
    </div>
  `;
}

function playButton(game, label) {
  if (!game.url) return `<button class="button is-disabled" disabled>${label}</button>`;
  return `<a class="button" href="${game.url}" target="_blank" rel="noreferrer">${label}</a>`;
}

function personPill(id, role) {
  const person = creators[id];
  return `
    <span class="person-pill">
      <span style="--dot:${person.color}"></span>
      ${person.name} <small>${role}</small>
    </span>
  `;
}

function creditCard(id, role) {
  const person = creators[id];
  return `
    <article class="credit-card">
      <span class="avatar" style="--avatar:${person.color}">${person.name[0]}</span>
      <div>
        <h3>${person.name}</h3>
        <p>${role} / ${person.handle}</p>
      </div>
    </article>
  `;
}

function emptyState() {
  return `
    <section class="empty-state">
      <h2>No matching games.</h2>
      <p>Clear the search or switch genres.</p>
    </section>
  `;
}

async function copyCurrentLink(button) {
  const text = location.href;
  try {
    await navigator.clipboard.writeText(text);
    button.textContent = "Copied";
    window.setTimeout(() => {
      button.textContent = "Copy page link";
    }, 1200);
  } catch {
    button.textContent = "Copy failed";
  }
}

function footer() {
  return `
    <footer class="footer">
      <span>First or Eighth</span>
      <span>No ads / no tracking / no coins</span>
      <span>California, 2026</span>
    </footer>
  `;
}

function escapeAttr(value) {
  return String(value).replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;");
}
