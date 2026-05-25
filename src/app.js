import { creators, games } from "./data.mjs";

const state = {
  route: readRoute(),
  query: "",
  genre: "All",
  sort: "az",
  navOpen: false,
  navScrollY: 0
};

const app = document.querySelector("#app");

window.addEventListener("hashchange", () => {
  state.route = readRoute();
  setNavOpen(false, { restoreScroll: false });
  render();
  window.scrollTo({ top: 0, behavior: "auto" });
});

document.addEventListener("click", (event) => {
  const action = event.target.closest("[data-action]");
  if (!action) return;

  const type = action.dataset.action;
  if (type === "toggle-nav") setNavOpen(!state.navOpen);
  if (type === "close-nav") setNavOpen(false);
  if (type === "nav-link") setNavOpen(false);
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
  setNavOpen(false);
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

function setNavOpen(open, { restoreScroll = true } = {}) {
  if (state.navOpen === open) return;

  if (open) {
    state.navScrollY = window.scrollY;
    document.body.style.top = `-${state.navScrollY}px`;
    document.body.classList.add("nav-open");
    state.navOpen = true;
    return;
  }

  state.navOpen = false;
  document.body.classList.remove("nav-open");
  document.body.style.top = "";

  if (restoreScroll) {
    window.scrollTo({ top: state.navScrollY, behavior: "auto" });
  }
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
        <span class="online-pill" title="${onlineCount()} live playable games"><span></span>${onlineCount()} online</span>
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
      <button class="drawer-close" data-action="close-nav" aria-label="Close menu">
        <span></span><span></span>
      </button>
      ${links.map(([id, label, href]) => navLink(id, label, href, "nav-link")).join("")}
      <div class="drawer-foot">
        <span class="status-dot"></span>
        ${games.length} ${games.length === 1 ? "game" : "games"} in rotation
      </div>
    </aside>
  `;
}

function navLink(id, label, href, action = "") {
  const active = (id === "home" && state.route.name === "home") || id === state.route.name;
  return `<a class="${active ? "is-active" : ""}" href="${href}" ${action ? `data-action="${action}"` : ""}>${label}</a>`;
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
        ${sortedCreators().map(([id, creator]) => {
          const created = games.filter((game) => game.creator === id);
          const edited = games.filter((game) => game.editors.includes(id));
          const listed = [...created, ...edited.filter((game) => !created.includes(game))].sort(byGameName);

          return `
            <article class="creator-card">
              <div class="creator-head">
                <span class="person-orb" style="--person:${creator.color}" aria-hidden="true"></span>
                <div>
                  <h2>${creator.name}</h2>
                  <a class="creator-handle" href="${escapeAttr(creator.githubUrl)}" target="_blank" rel="noreferrer noopener">${creator.handle}</a>
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
          A few specials with AI doing things: small games, fast prototypes, weird tools, and whatever makes the group want to queue one more round.
        </p>
        <p>
          First or Eighth is the shelf for the current rotation. Some games are live, some are still cooking, and the links stay one click away.
        </p>
      </div>
    </main>
  `;
}

function thumb(game, big = false) {
  const image = game.screenshot;
  return `
    <div class="thumb ${big ? "big" : ""} ${game.status === "WIP" ? "is-wip" : ""}" style="--accent:${game.accent}; --accent-dark:${shade(game.accent, -70)}">
      ${image ? screenshotImage(game, image, big) : `<span class="thumb-pattern" aria-hidden="true"></span>`}
      <span class="thumb-tag">${image ? "Live capture" : "[ thumbnail ]"}</span>
    </div>
  `;
}

function screenshotImage(game, image, big) {
  const sizes = big ? "(max-width: 840px) 100vw, 52vw" : "(max-width: 520px) 100vw, 360px";
  const priority = big ? 'loading="eager" fetchpriority="high"' : 'loading="lazy"';
  return `
    <picture>
      <source type="image/webp" srcset="${escapeAttr(image.card)} 640w, ${escapeAttr(image.detail)} 1200w" sizes="${sizes}" />
      <img src="${escapeAttr(image.fallback)}" width="1440" height="900" alt="${escapeAttr(`${game.name} screenshot`)}" ${priority} />
    </picture>
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
        <p>${role} / <a class="inline-handle" href="${escapeAttr(person.githubUrl)}" target="_blank" rel="noreferrer noopener">${person.handle}</a></p>
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
        ${sortedCreators().map(([, creator]) => `
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

function sortedCreators() {
  return Object.entries(creators).sort(([, a], [, b]) => a.name.localeCompare(b.name));
}

function onlineCount() {
  return games.filter((game) => game.status === "Live" && game.url).length;
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
