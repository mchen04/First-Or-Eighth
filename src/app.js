const creators = {
  michael: {
    name: "Michael",
    handle: "@michael",
    color: "#ff3d7f",
    bio: "Keeps the hub edited, current, and easy to route through."
  },
  jeremy: {
    name: "Jeremy",
    handle: "@jeremy",
    color: "#54d2d2",
    bio: "Builds fast, weird game ideas for the group rotation."
  },
  matthew: {
    name: "Matthew",
    handle: "@matthew",
    color: "#ffb627",
    bio: "Builds and tunes party-game ideas for the friend group."
  }
};

const games = [
  {
    id: "valence",
    name: "Valence",
    status: "Live",
    url: "https://valence1.vercel.app/",
    sourceUrl: "https://github.com/jormyy/valence",
    creator: "jeremy",
    editors: ["michael"],
    genre: "Puzzle",
    year: "2024",
    accent: "#54d2d2",
    tagline: "Bond fast or break.",
    description:
      "A chemistry-flavored puzzle game with a clean board-game rhythm: read the board, commit to the bond, and keep the next move alive."
  },
  {
    id: "ding",
    name: "Ding",
    status: "Live",
    url: "https://ding-game.vercel.app/",
    sourceUrl: "https://github.com/jormyy/ding",
    creator: "jeremy",
    editors: ["michael"],
    genre: "Reflex",
    year: "2024",
    accent: "#ff3d7f",
    tagline: "Tap fast, miss clean, run it back.",
    description:
      "A quick-hit reaction game built for fast rounds, loud misses, and instant rematches."
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
    year: "2024",
    accent: "#9b5de5",
    tagline: "Say enough, but not too much.",
    description:
      "A party-word game about restraint under pressure. The constraint is simple, which is exactly why the room gets loud."
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

const state = {
  route: readRoute(),
  query: "",
  genre: "All",
  sort: "az",
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
    restoreSearchFocus();
    return;
  }

  if (event.target.matches("[data-sort]")) {
    state.sort = event.target.value;
    render();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape" || !state.navOpen) return;
  state.navOpen = false;
  render();
});

render();

function readRoute() {
  const hash = location.hash.replace(/^#\/?/, "");
  if (!hash) return { name: "home" };
  const [name, id] = hash.split("/");
  if (name === "game" && games.some((game) => game.id === id)) return { name: "game", id };
  if (["creators", "about"].includes(name)) return { name };
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
  const links = [
    ["home", "Games", "#/"],
    ["creators", "Builders", "#/creators"],
    ["about", "About", "#/about"]
  ];

  return `
    <header class="topbar">
      <a class="brand" href="#/" aria-label="First or Eighth home" data-nav-link>
        <span class="brand-mark" aria-hidden="true"></span>
        <span>FIRST_OR_EIGHTH</span>
      </a>
      <nav class="desktop-nav" aria-label="Primary">
        ${links.map(([id, label, href]) => navLink(id, label, href)).join("")}
      </nav>
      <div class="topbar-right">
        <span class="online-pill"><span></span>${Object.keys(creators).length} online</span>
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
      ${links.map(([id, label, href]) => navLink(id, label, href)).join("")}
      <div class="drawer-foot">
        <span class="status-dot"></span>
        ${games.length} ${games.length === 1 ? "game" : "games"} in rotation
      </div>
    </aside>
  `;
}

function navLink(id, label, href) {
  const active = (id === "home" && state.route.name === "home") || id === state.route.name;
  return `<a class="${active ? "is-active" : ""}" href="${href}" data-nav-link>${label}</a>`;
}

function mainView() {
  if (state.route.name === "game") return gameDetail(games.find((game) => game.id === state.route.id));
  if (state.route.name === "creators") return creatorsPage();
  if (state.route.name === "about") return aboutPage();
  return libraryPage();
}

function libraryPage() {
  const filtered = filteredGames();
  const genres = ["All", ...new Set(games.map((game) => game.genre))];
  const wipCount = games.filter((game) => game.status === "WIP").length;

  return `
    <main class="page">
      <section class="library-head">
        <div>
          <h1>Games.</h1>
          <p>Everything we've built, plus what's still in the oven.</p>
        </div>
        <span>${games.length} ${games.length === 1 ? "game" : "games"} / ${wipCount} WIP</span>
      </section>

      <section class="controls" aria-label="Game filters">
        <label class="search-box">
          <span>Search</span>
          <input data-search type="search" value="${escapeAttr(state.query)}" placeholder="Search games" />
        </label>
        <label class="sort-box">
          <span>Sort</span>
          <select data-sort>
            ${option("az", "A to Z")}
            ${option("newest", "Newest")}
            ${option("creator", "Builder")}
            ${option("status", "Live first")}
          </select>
        </label>
      </section>

      ${genres.length > 2 ? `
        <section class="chip-row" aria-label="Genre filters">
          ${genres.map((genre) => `
            <button class="chip ${state.genre === genre ? "is-active" : ""}" data-action="set-genre" data-genre="${escapeAttr(genre)}">
              ${escapeHtml(genre)}
            </button>
          `).join("")}
        </section>
      ` : ""}

      ${filtered.length ? `<section class="game-grid">${filtered.map(gameCard).join("")}</section>` : emptyState()}
    </main>
  `;
}

function filteredGames() {
  const query = state.query.trim().toLowerCase();
  let list = games.filter((game) => {
    const creator = creators[game.creator].name;
    const editorNames = game.editors.map((id) => creators[id].name).join(" ");
    const haystack = `${game.name} ${game.genre} ${game.tagline} ${game.description} ${creator} ${editorNames} ${game.status} ${game.url} ${game.sourceUrl}`.toLowerCase();
    return (state.genre === "All" || game.genre === state.genre) && (!query || haystack.includes(query));
  });

  if (state.sort === "newest") list = [...list].sort((a, b) => b.year.localeCompare(a.year) || byGameName(a, b));
  if (state.sort === "az") list = [...list].sort(byGameName);
  if (state.sort === "creator") list = [...list].sort((a, b) => creators[a.creator].name.localeCompare(creators[b.creator].name) || a.name.localeCompare(b.name));
  if (state.sort === "status") list = [...list].sort((a, b) => Number(b.status === "Live") - Number(a.status === "Live") || byGameName(a, b));
  return list;
}

function byGameName(a, b) {
  return a.name.localeCompare(b.name, undefined, { numeric: true });
}

function option(value, label) {
  return `<option value="${value}" ${state.sort === value ? "selected" : ""}>Sort: ${label}</option>`;
}

function gameCard(game) {
  return `
    <article class="game-card" style="--accent:${game.accent}">
      ${game.status === "WIP" ? wipBadge() : ""}
      <button class="card-open" data-action="open-game" data-game="${game.id}" aria-label="Open ${escapeAttr(game.name)} details">
        ${thumb(game)}
      </button>
      <div class="card-body">
        <div class="card-title-row">
          <h2>${escapeHtml(game.name)}</h2>
          <span class="year-pill">${game.year}</span>
        </div>
        <p class="card-tagline">${escapeHtml(game.tagline)}</p>
        <div class="card-foot">
          ${personPill(game.creator, game.editors.length)}
          <span>${escapeHtml(game.genre)}</span>
        </div>
        <div class="card-actions">
          ${cardPlayLink(game)}
          <a class="card-link" href="${escapeAttr(game.sourceUrl)}" target="_blank" rel="noreferrer noopener" aria-label="Open ${escapeAttr(game.name)} GitHub repository">GitHub</a>
        </div>
      </div>
    </article>
  `;
}

function gameDetail(game) {
  const related = games.filter((candidate) => candidate.id !== game.id).sort(byGameName);
  const isWip = game.status === "WIP";

  return `
    <main class="page detail-page">
      <a class="back-link" href="#/">Back to games</a>
      <section class="detail-hero">
        <div class="detail-media" style="--accent:${game.accent}">
          ${isWip ? wipBadge() : ""}
          ${thumb(game, true)}
        </div>
        <div class="detail-copy">
          <p class="eyebrow ${isWip ? "is-wip" : ""}">${isWip ? "Work in progress" : `${game.genre} / ${game.year}`}</p>
          <h1>${escapeHtml(game.name)}.</h1>
          <p class="detail-tagline">${escapeHtml(game.tagline)}</p>
          <div class="detail-actions">
            ${playButton(game, isWip ? "Not ready" : `Play ${game.name}`)}
            <a class="button button-secondary" href="${escapeAttr(game.sourceUrl)}" target="_blank" rel="noreferrer noopener">GitHub</a>
            <button class="button button-secondary" data-action="copy-link">Copy page link</button>
          </div>
          <div class="kv-grid" aria-label="${escapeAttr(game.name)} metadata">
            <div class="kv"><span>Genre</span><strong>${escapeHtml(game.genre)}</strong></div>
            <div class="kv"><span>Year</span><strong>${game.year}</strong></div>
            <div class="kv"><span>Status</span><strong>${game.status}</strong></div>
          </div>
        </div>
      </section>

      <section class="detail-section">
        <h2>About</h2>
        <p>${escapeHtml(game.description)}</p>
        ${isWip ? `<p class="wip-note">Pancake is still being built. Check back soon or bug ${creators[game.creator].name} on Discord.</p>` : ""}
      </section>

      <section class="detail-section">
        <h2>Links</h2>
        <div class="link-list">
          ${game.url ? `<a href="${escapeAttr(game.url)}" target="_blank" rel="noreferrer noopener"><strong>Play</strong><span>${escapeHtml(game.url)}</span></a>` : `<span><strong>Play</strong><span>Not live yet</span></span>`}
          <a href="${escapeAttr(game.sourceUrl)}" target="_blank" rel="noreferrer noopener"><strong>GitHub</strong><span>${escapeHtml(game.sourceUrl)}</span></a>
        </div>
      </section>

      <section class="detail-section">
        <h2>Built by</h2>
        <div class="credit-list">
          ${creditCard(game.creator, "Creator")}
          ${game.editors.map((id) => creditCard(id, "Editor")).join("")}
        </div>
      </section>

      ${related.length ? `
        <section class="related">
          <h2>Other games</h2>
          <div class="game-grid related-grid">${related.map(gameCard).join("")}</div>
        </section>
      ` : ""}
    </main>
  `;
}

function creatorsPage() {
  return `
    <main class="page">
      <section class="library-head">
        <div>
          <h1>Builders.</h1>
          <p>The three of us, and what we've shipped.</p>
        </div>
      </section>
      <section class="creator-grid">
        ${Object.entries(creators).map(([id, creator]) => {
          const created = games.filter((game) => game.creator === id);
          const edited = games.filter((game) => game.editors.includes(id));
          const listed = [...created, ...edited.filter((game) => !created.includes(game))].sort(byGameName);

          return `
            <article class="creator-card">
              <div class="creator-head">
                <span class="person-orb" style="--person:${creator.color}" aria-hidden="true"></span>
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
              ${listed.length ? `
                <div class="creator-games">
                  ${listed.map((game) => `
                    <button data-action="open-game" data-game="${game.id}">
                      <span>${escapeHtml(game.name)}${game.status === "WIP" ? `<small class="inline-wip">WIP</small>` : ""}</span>
                      <small>${game.creator === id ? "Creator" : "Editor"}</small>
                    </button>
                  `).join("")}
                </div>
              ` : ""}
            </article>
          `;
        }).join("")}
      </section>
    </main>
  `;
}

function aboutPage() {
  return `
    <main class="page about-page">
      <section class="library-head">
        <div>
          <h1>Hi.</h1>
          <p>First or Eighth is the friend-group game shelf.</p>
        </div>
      </section>
      <div class="about-copy">
        <p>
          We make small games on weekends. Some of them you play standing up in a kitchen at 2am.
          Some are still being built. This is where they live: a fast route to the current rotation.
        </p>
        <p>
          The name is a light TFT joke: first place or eighth place, glory or instant queue. No tracking, no ads, no coins.
        </p>
      </div>
    </main>
  `;
}

function thumb(game, big = false) {
  return `
    <div class="thumb ${big ? "big" : ""} ${game.status === "WIP" ? "is-wip" : ""}" style="--accent:${game.accent}; --accent-dark:${shade(game.accent, -70)}">
      <span class="thumb-pattern" aria-hidden="true"></span>
      <span class="thumb-tag">[ thumbnail ]</span>
    </div>
  `;
}

function playButton(game, label) {
  if (!game.url) return `<button class="button is-disabled" disabled>${label}</button>`;
  return `<a class="button" href="${escapeAttr(game.url)}" target="_blank" rel="noreferrer noopener">${escapeHtml(label)}</a>`;
}

function cardPlayLink(game) {
  if (!game.url) return `<span class="card-link is-disabled">Not live</span>`;
  return `<a class="card-link is-primary" href="${escapeAttr(game.url)}" target="_blank" rel="noreferrer noopener" aria-label="Play ${escapeAttr(game.name)}">Play</a>`;
}

function personPill(id, editorCount = 0) {
  const person = creators[id];
  return `
    <span class="person-pill">
      <span style="--person:${person.color}" aria-hidden="true"></span>
      ${person.name}${editorCount ? ` <small>+${editorCount}</small>` : ""}
    </span>
  `;
}

function creditCard(id, role) {
  const person = creators[id];
  return `
    <article class="credit-card">
      <span class="person-orb" style="--person:${person.color}" aria-hidden="true"></span>
      <div>
        <h3>${person.name}</h3>
        <p>${role} / ${person.handle}</p>
      </div>
    </article>
  `;
}

function wipBadge() {
  return `<span class="wip-badge"><span></span>WIP</span>`;
}

function emptyState() {
  return `
    <section class="empty-state">
      <h2>Nothing here.</h2>
      <p>Try a different search or clear the filters.</p>
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
      <span>FIRST_OR_EIGHTH</span>
      <span class="footer-creators">
        ${Object.values(creators).map((creator) => `
          <span><span style="--person:${creator.color}"></span>${creator.name}</span>
        `).join("")}
      </span>
      <span>No ads / no tracking / no coins</span>
    </footer>
  `;
}

function restoreSearchFocus() {
  const input = document.querySelector("[data-search]");
  if (!input) return;
  input.focus();
  input.setSelectionRange(state.query.length, state.query.length);
}

function shade(hex, amount) {
  const value = hex.replace("#", "");
  const number = Number.parseInt(value, 16);
  const red = clamp((number >> 16) + amount);
  const green = clamp(((number >> 8) & 255) + amount);
  const blue = clamp((number & 255) + amount);
  return `#${((1 << 24) + (red << 16) + (green << 8) + blue).toString(16).slice(1)}`;
}

function clamp(value) {
  return Math.max(0, Math.min(255, value));
}

function escapeAttr(value) {
  return escapeHtml(value).replaceAll('"', "&quot;");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}
