import { loadData } from "./data.mjs";

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

const state = {
  route: { name: "home" },
  query: "",
  genre: "All",
  sort: "az",
  navOpen: false,
  ready: false
};

const app = document.querySelector("#app");
const desktopQuery = window.matchMedia("(min-width: 961px)");

let creators = {};
let games = [];

let shellRendered = false;
let mountedPage = null; // "library" | "creators" — the background page in #view-root

// Modal layer bookkeeping (shared by the nav drawer and the detail overlay).
let activeLayer = null; // "nav" | "detail" | null
let layerReturnFocus = null;
const scrollLock = { active: false, y: 0 };

// Where to send the user when the detail overlay closes.
let detailReturn = "#/";

// ---------------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------------

window.addEventListener("hashchange", onHashChange);
document.addEventListener("click", onClick);
document.addEventListener("input", onInput);
document.addEventListener("keydown", onKeydown);
desktopQuery.addEventListener("change", onDesktopChange);

boot();

async function boot() {
  try {
    const data = await loadData();
    creators = data.creators;
    games = data.games;
  } catch (error) {
    renderFatal(error);
    return;
  }
  state.ready = true;
  state.route = readRoute();
  normalizeUnresolvedHash();
  render();
}

// ---------------------------------------------------------------------------
// Routing
// ---------------------------------------------------------------------------

function readRoute() {
  const hash = location.hash.replace(/^#\/?/, "");
  if (!hash) return { name: "home" };
  const [name, id] = hash.split("/");
  if (name === "game" && games.some((game) => game.id === id)) return { name: "game", id };
  if (name === "creators") return { name: "creators" };
  return { name: "home" };
}

function currentHash() {
  return location.hash || "#/";
}

// If the URL points at a game that does not resolve (unknown/empty id), repair
// the address bar so it stops lying about the view. replaceState avoids both a
// spurious history entry and re-triggering hashchange.
function normalizeUnresolvedHash() {
  if (location.hash.startsWith("#/game") && state.route.name !== "game") {
    history.replaceState(null, "", "#/");
  }
}

function onHashChange() {
  if (!state.ready) return;
  const previous = state.route.name;
  const next = readRoute();

  if (next.name === "game" && previous !== "game") {
    detailReturn = previous === "creators" ? "#/creators" : "#/";
  }

  state.route = next;
  state.navOpen = false;
  normalizeUnresolvedHash();
  render();

  // Top-level page navigations start at the top; opening/closing the detail
  // overlay preserves the background scroll position via the scroll lock.
  if (next.name !== "game" && previous !== "game") {
    window.scrollTo({ top: 0, behavior: "auto" });
  }
}

function onDesktopChange() {
  if (desktopQuery.matches && state.navOpen) {
    state.navOpen = false;
    render();
  }
}

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

function onClick(event) {
  const actionEl = event.target.closest("[data-action]");
  if (!actionEl) return;
  if (handleAction(actionEl)) render();
}

function handleAction(actionEl) {
  switch (actionEl.dataset.action) {
    case "toggle-nav":
      state.navOpen = !state.navOpen;
      return true;
    case "close-nav":
      state.navOpen = false;
      return true;
    case "nav-link":
      state.navOpen = false;
      return actionEl.getAttribute("href") === currentHash();
    case "set-genre":
      state.genre = actionEl.dataset.genre;
      syncGenreChips();
      renderResults();
      return false;
    case "clear-filters": {
      state.query = "";
      state.genre = "All";
      const input = document.querySelector("[data-search]");
      if (input) input.value = "";
      syncGenreChips();
      renderResults();
      return false;
    }
    case "copy-link":
      copyCurrentLink(actionEl);
      return false;
    case "close-detail":
      location.hash = detailReturn || "#/";
      return false;
    default:
      return false;
  }
}

function onInput(event) {
  if (event.target.matches("[data-search]")) {
    state.query = event.target.value;
    renderResults();
    return;
  }
  if (event.target.matches("[data-sort]")) {
    state.sort = event.target.value;
    renderResults();
  }
}

function onKeydown(event) {
  const layer = currentLayer();
  if (!layer) return;

  if (event.key === "Tab") {
    trapFocus(event, layerElement(layer));
    return;
  }

  if (event.key === "Escape") {
    if (layer === "nav") {
      state.navOpen = false;
      render();
    } else {
      location.hash = detailReturn || "#/";
    }
  }
}

// ---------------------------------------------------------------------------
// Render orchestration
// ---------------------------------------------------------------------------

function render() {
  if (!shellRendered) renderShell();
  renderBackground();
  renderOverlay();
  syncShellState();
}

function renderShell() {
  app.innerHTML = `
    ${topbar()}
    <div id="view-root"></div>
    <div id="overlay-root"></div>
    ${footer()}
  `;
  shellRendered = true;
}

function renderBackground() {
  const viewRoot = document.querySelector("#view-root");
  // A game route keeps whatever page is already mounted behind the overlay
  // (defaulting to the library on a cold deep-link). Keeping that DOM intact
  // preserves the library's scroll/search state and lets focus return to the
  // exact card the overlay was opened from when it closes.
  const wanted =
    state.route.name === "creators" ? "creators" :
    state.route.name === "game" ? (mountedPage ?? "library") :
    "library";

  if (mountedPage === wanted) return;

  viewRoot.innerHTML = wanted === "creators" ? creatorsPage() : libraryPage();
  mountedPage = wanted;
}

function renderResults() {
  const host = document.querySelector("#game-results");
  if (host) host.innerHTML = resultsMarkup();
}

function renderOverlay() {
  const host = document.querySelector("#overlay-root");

  if (state.route.name !== "game") {
    dismissOverlay(host);
    return;
  }

  const game = games.find((candidate) => candidate.id === state.route.id);
  if (!game) {
    dismissOverlay(host);
    return;
  }
  if (host.dataset.gameId === game.id) return;

  // Already-open overlay swapping to a different game (e.g. a manual hash
  // change): move focus into the rebuilt panel. On a fresh open this stays
  // false so syncLayerFocus can record the trigger element for focus return.
  const wasOpen = activeLayer === "detail";

  host.innerHTML = detailOverlay(game);
  host.dataset.gameId = game.id;
  requestAnimationFrame(() => host.querySelector(".detail-overlay")?.classList.add("is-open"));

  if (wasOpen) focusInto(host.querySelector(".detail-panel"));
}

// Play the close transition, then tear down the DOM — unless a new overlay
// opened in the meantime (dataset.gameId set again).
function dismissOverlay(host) {
  if (!host.dataset.gameId) return;
  delete host.dataset.gameId;

  const overlay = host.querySelector(".detail-overlay");
  if (!overlay) {
    host.innerHTML = "";
    return;
  }

  const clear = () => {
    if (!host.dataset.gameId) host.innerHTML = "";
  };

  if (prefersReducedMotion()) {
    clear();
    return;
  }

  overlay.classList.remove("is-open");
  overlay.style.pointerEvents = "none";

  let done = false;
  const finish = () => {
    if (done) return;
    done = true;
    clear();
  };
  overlay.addEventListener("transitionend", finish, { once: true });
  window.setTimeout(finish, 280);
}

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function syncShellState() {
  const layer = currentLayer();
  const overlayActive = layer !== null;

  document.querySelector("[data-action='toggle-nav']")?.setAttribute("aria-expanded", String(state.navOpen));
  document.querySelector(".mobile-scrim")?.classList.toggle("is-open", state.navOpen);

  setInert(".topbar", overlayActive);
  setInert("#view-root", overlayActive);
  setInert(".footer", overlayActive);

  const drawer = document.querySelector(".mobile-drawer");
  if (drawer) {
    drawer.classList.toggle("is-open", state.navOpen);
    drawer.setAttribute("aria-hidden", String(!state.navOpen));
    drawer.setAttribute("aria-modal", String(state.navOpen));
    drawer.toggleAttribute("inert", !state.navOpen);
  }

  for (const link of document.querySelectorAll("[data-route]")) {
    link.classList.toggle("is-active", link.dataset.route === routeId());
  }

  syncScrollLock(overlayActive);
  syncLayerFocus(layer);
}

// ---------------------------------------------------------------------------
// Modal layer helpers (drawer + detail overlay)
// ---------------------------------------------------------------------------

function currentLayer() {
  if (state.navOpen) return "nav";
  if (state.route.name === "game") return "detail";
  return null;
}

function layerElement(layer) {
  if (layer === "nav") return document.querySelector(".mobile-drawer");
  if (layer === "detail") return document.querySelector(".detail-panel");
  return null;
}

function syncScrollLock(shouldLock) {
  if (shouldLock && !scrollLock.active) {
    scrollLock.y = window.scrollY;
    document.body.style.top = `-${scrollLock.y}px`;
    document.body.classList.add("scroll-lock");
    scrollLock.active = true;
  } else if (!shouldLock && scrollLock.active) {
    scrollLock.active = false;
    document.body.classList.remove("scroll-lock");
    document.body.style.top = "";
    window.scrollTo({ top: scrollLock.y, behavior: "auto" });
  }
}

function syncLayerFocus(layer) {
  if (layer && layer !== activeLayer) {
    layerReturnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    focusInto(layerElement(layer));
  } else if (!layer && activeLayer) {
    if (layerReturnFocus?.isConnected) layerReturnFocus.focus({ preventScroll: true });
    layerReturnFocus = null;
  }
  activeLayer = layer;
}

function focusInto(element) {
  if (!element || element.contains(document.activeElement)) return;
  const focusable = element.querySelector("a[href], button:not([disabled]), input, select, [tabindex]");
  (focusable || element).focus({ preventScroll: true });
}

function trapFocus(event, container) {
  if (!container) return;
  const focusable = [...container.querySelectorAll("a[href], button:not([disabled]), input, select")];
  if (!focusable.length) {
    event.preventDefault();
    container.focus({ preventScroll: true });
    return;
  }

  const first = focusable[0];
  const last = focusable.at(-1);

  if (!container.contains(document.activeElement)) {
    event.preventDefault();
    (event.shiftKey ? last : first).focus({ preventScroll: true });
  } else if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus({ preventScroll: true });
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus({ preventScroll: true });
  }
}

function setInert(selector, inert) {
  document.querySelector(selector)?.toggleAttribute("inert", inert);
}

// ---------------------------------------------------------------------------
// Shell
// ---------------------------------------------------------------------------

const NAV_LINKS = [
  ["home", "Games", "#/"],
  ["creators", "Builders", "#/creators"]
];

function topbar() {
  return `
    <header class="topbar">
      <a class="brand" href="#/" aria-label="First or Eighth home">
        <span class="brand-mark" aria-hidden="true"></span>
        <span>FIRST_OR_EIGHTH</span>
      </a>
      <nav class="desktop-nav" aria-label="Primary">
        ${NAV_LINKS.map(([id, label, href]) => navLink(id, label, href)).join("")}
      </nav>
      <div class="topbar-right">
        <span class="online-pill" title="${onlineCount()} live playable games"><span class="status-dot"></span>${onlineCount()} online</span>
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
      aria-modal="${state.navOpen ? "true" : "false"}"
      role="dialog"
      tabindex="-1"
      ${state.navOpen ? "" : "inert"}
    >
      <button class="drawer-close" data-action="close-nav" aria-label="Close menu">
        <span></span><span></span>
      </button>
      ${NAV_LINKS.map(([id, label, href]) => navLink(id, label, href, "nav-link")).join("")}
      <div class="drawer-foot">
        <span class="status-dot"></span>
        ${games.length} ${games.length === 1 ? "game" : "games"} in rotation
      </div>
    </aside>
  `;
}

function navLink(id, label, href, action = "") {
  const active = id === routeId();
  return `<a class="${active ? "is-active" : ""}" href="${href}" data-route="${id}" ${action ? `data-action="${action}"` : ""}>${label}</a>`;
}

function footer() {
  return `
    <footer class="footer">
      <span>FIRST_OR_EIGHTH</span>
      <span class="footer-creators">
        ${sortedCreators().map(([, creator]) => `
          <span class="footer-person"><span class="person-dot" style="--person:${escapeAttr(creator.color)}"></span>${escapeHtml(creator.name)}</span>
        `).join("")}
      </span>
      <span>No ads / no tracking / no coins</span>
    </footer>
  `;
}

// ---------------------------------------------------------------------------
// Library page
// ---------------------------------------------------------------------------

function libraryPage() {
  const genres = ["All", ...new Set(games.map((game) => game.genre))];
  const wipCount = games.filter((game) => game.status === "WIP").length;

  return `
    <main class="page" data-page="library">
      <section class="library-head">
        <div>
          <h1>Games.</h1>
          <p>Everything we've built, plus what's still in the kitchen.</p>
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

      ${genres.length > 2 ? chipRow(genres) : ""}

      <div class="game-results" id="game-results">${resultsMarkup()}</div>
    </main>
  `;
}

function chipRow(genres) {
  return `
    <section class="chip-row" aria-label="Genre filters">
      ${genres.map((genre) => `
        <button class="chip ${state.genre === genre ? "is-active" : ""}" aria-pressed="${state.genre === genre}" data-action="set-genre" data-genre="${escapeAttr(genre)}">
          ${escapeHtml(genre)}
        </button>
      `).join("")}
    </section>
  `;
}

function syncGenreChips() {
  for (const chip of document.querySelectorAll(".chip[data-genre]")) {
    const on = chip.dataset.genre === state.genre;
    chip.classList.toggle("is-active", on);
    chip.setAttribute("aria-pressed", String(on));
  }
}

function resultsMarkup() {
  const list = filteredGames();
  return list.length ? `<section class="game-grid">${list.map(gameCard).join("")}</section>` : emptyState();
}

function filteredGames() {
  const query = state.query.trim().toLowerCase();
  const list = games.filter((game) => {
    if (state.genre !== "All" && game.genre !== state.genre) return false;
    if (!query) return true;
    return searchText(game).includes(query);
  });
  return [...list].sort(sorters[state.sort] ?? sorters.az);
}

function searchText(game) {
  const people = [game.creator, ...game.editors].map((id) => creators[id]?.name ?? "").join(" ");
  return `${game.name} ${game.genre} ${game.tagline} ${game.description} ${people} ${game.status} ${game.url} ${game.sourceUrl}`.toLowerCase();
}

const sorters = {
  az: byGameName,
  newest: (a, b) => b.year.localeCompare(a.year) || byGameName(a, b),
  creator: (a, b) => (creators[a.creator]?.name ?? "").localeCompare(creators[b.creator]?.name ?? "") || byGameName(a, b),
  status: (a, b) => Number(b.status === "Live") - Number(a.status === "Live") || byGameName(a, b)
};

function byGameName(a, b) {
  return a.name.localeCompare(b.name, undefined, { numeric: true });
}

function option(value, label) {
  return `<option value="${value}" ${state.sort === value ? "selected" : ""}>Sort: ${label}</option>`;
}

function gameCard(game) {
  return `
    <article class="game-card surface" style="--accent:${escapeAttr(game.accent)}">
      ${game.status === "WIP" ? wipBadge() : ""}
      <a class="card-open" href="#/game/${escapeAttr(game.id)}" aria-label="Open ${escapeAttr(game.name)} details">
        ${thumb(game)}
      </a>
      <div class="card-body">
        <div class="card-title-row">
          <h2>${escapeHtml(game.name)}</h2>
          <span class="year-pill">${escapeHtml(game.year)}</span>
        </div>
        <p class="card-tagline">${escapeHtml(game.tagline)}</p>
        <div class="card-foot">
          ${personPill(game.creator, game.editors.length)}
          <span>${escapeHtml(game.genre)}</span>
        </div>
        <div class="card-actions">
          ${cardPlayLink(game)}
          <a class="card-link" href="${escapeAttr(safeUrl(game.sourceUrl))}" target="_blank" rel="noreferrer noopener" aria-label="Open ${escapeAttr(game.name)} GitHub repository">GitHub</a>
        </div>
      </div>
    </article>
  `;
}

function emptyState() {
  return `
    <section class="empty-state surface">
      <h2>Nothing here.</h2>
      <p>Try a different search or clear the filters.</p>
      <button class="button button-secondary" data-action="clear-filters">Clear filters</button>
    </section>
  `;
}

// ---------------------------------------------------------------------------
// Detail overlay
// ---------------------------------------------------------------------------

function detailOverlay(game) {
  const isWip = game.status === "WIP";

  return `
    <div class="detail-overlay" role="presentation">
      <div class="detail-scrim" data-action="close-detail" aria-hidden="true"></div>
      <div
        class="detail-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="detail-title"
        tabindex="-1"
        style="--accent:${escapeAttr(game.accent)}; --accent-dark:${escapeAttr(shade(game.accent, -70))}"
      >
        <button class="detail-close" data-action="close-detail" aria-label="Close details">
          <span></span><span></span>
        </button>

        <div class="detail-media">
          ${isWip ? wipBadge() : ""}
          ${thumb(game, true)}
        </div>

        <div class="detail-body">
          <div class="detail-scroll">
            <div class="detail-content">
              <p class="eyebrow ${isWip ? "is-wip" : ""}">${detailEyebrow(game, isWip)}</p>
              <h2 class="detail-title" id="detail-title">${escapeHtml(game.name)}</h2>
              <p class="detail-tagline">${escapeHtml(game.tagline)}</p>
              <div class="detail-tags">
                <span class="tag">${escapeHtml(game.genre)}</span>
                <span class="tag">${escapeHtml(game.year)}</span>
                <span class="tag ${isWip ? "is-wip" : "is-live"}">${escapeHtml(game.status)}</span>
              </div>
              <div class="detail-credits" role="group" aria-label="Built by">
                ${creditPill(game.creator, "Creator")}
                ${game.editors.map((id) => creditPill(id, "Editor")).join("")}
              </div>
              <p class="detail-desc">${escapeHtml(game.description)}</p>
            </div>
          </div>

          <div class="detail-actions">
            ${playButton(game, isWip ? "Not ready yet" : `Play ${game.name}`)}
            <a class="button button-secondary" href="${escapeAttr(safeUrl(game.sourceUrl))}" target="_blank" rel="noreferrer noopener">GitHub</a>
            <button class="button button-secondary" data-action="copy-link">Copy link</button>
            <span class="sr-only" data-detail-status aria-live="polite" aria-atomic="true"></span>
          </div>
        </div>
      </div>
    </div>
  `;
}

function detailEyebrow(game, isWip) {
  if (isWip) return "Work in progress";
  return `${escapeHtml(game.genre)} / ${escapeHtml(game.year)}`;
}

function creditPill(id, role) {
  const person = creators[id];
  if (!person) return "";
  return `
    <a class="credit-pill" href="${escapeAttr(safeUrl(person.githubUrl))}" target="_blank" rel="noreferrer noopener">
      <span class="person-dot" style="--person:${escapeAttr(person.color)}" aria-hidden="true"></span>
      <span class="credit-name">${escapeHtml(person.name)}</span>
      <span class="credit-role">${escapeHtml(role)}</span>
    </a>
  `;
}

// ---------------------------------------------------------------------------
// Creators page
// ---------------------------------------------------------------------------

function creatorsPage() {
  return `
    <main class="page" data-page="creators">
      <section class="library-head">
        <div>
          <h1>Builders.</h1>
          <p>The four of us, and what we've shipped.</p>
        </div>
      </section>
      <section class="creator-grid">
        ${sortedCreators().map(([id, creator]) => creatorCard(id, creator)).join("")}
      </section>
    </main>
  `;
}

function creatorCard(id, creator) {
  const created = games.filter((game) => game.creator === id);
  const edited = games.filter((game) => game.editors.includes(id));
  const listed = [...created, ...edited.filter((game) => !created.includes(game))].sort(byGameName);

  return `
    <article class="creator-card surface">
      <div class="creator-head">
        <span class="person-orb" style="--person:${escapeAttr(creator.color)}" aria-hidden="true"></span>
        <div>
          <h2>${escapeHtml(creator.name)}</h2>
          <a class="creator-handle" href="${escapeAttr(safeUrl(creator.githubUrl))}" target="_blank" rel="noreferrer noopener">${escapeHtml(creator.handle)}</a>
        </div>
      </div>
      <p>${escapeHtml(creator.bio)}</p>
      <div class="creator-stats">
        <span><strong>${created.length}</strong> created</span>
        <span><strong>${edited.length}</strong> edited</span>
      </div>
      ${listed.length ? `
        <div class="creator-games">
          ${listed.map((game) => `
            <a href="#/game/${escapeAttr(game.id)}">
              <span>${escapeHtml(game.name)}${game.status === "WIP" ? `<small class="inline-wip">WIP</small>` : ""}</span>
              <small>${game.creator === id ? "Creator" : "Editor"}</small>
            </a>
          `).join("")}
        </div>
      ` : ""}
    </article>
  `;
}

// ---------------------------------------------------------------------------
// Shared building blocks
// ---------------------------------------------------------------------------

function thumb(game, big = false) {
  const image = game.screenshot;
  return `
    <div class="thumb ${big ? "big" : ""} ${game.status === "WIP" ? "is-wip" : ""}" style="--accent:${escapeAttr(game.accent)}; --accent-dark:${escapeAttr(shade(game.accent, -70))}">
      ${image ? screenshotImage(game, image, big) : `<span class="thumb-pattern" aria-hidden="true"></span>`}
      <span class="thumb-tag">${image ? "Live capture" : "[ thumbnail ]"}</span>
    </div>
  `;
}

function screenshotImage(game, image, big) {
  const sizes = big ? "(max-width: 840px) 100vw, 720px" : "(max-width: 520px) 100vw, 360px";
  const priority = big ? 'loading="eager" fetchpriority="high"' : 'loading="lazy"';
  return `
    <picture>
      <source type="image/webp" srcset="${escapeAttr(image.card)} 640w, ${escapeAttr(image.detail)} 1200w" sizes="${sizes}" />
      <img src="${escapeAttr(image.fallback)}" width="1440" height="900" alt="${escapeAttr(`${game.name} screenshot`)}" ${priority} />
    </picture>
  `;
}

function playButton(game, label) {
  if (!game.url) return `<button class="button is-disabled" disabled>${escapeHtml(label)}</button>`;
  return `<a class="button" href="${escapeAttr(safeUrl(game.url))}" target="_blank" rel="noreferrer noopener">${escapeHtml(label)}</a>`;
}

function cardPlayLink(game) {
  if (!game.url) return `<span class="card-link is-disabled">Not live</span>`;
  return `<a class="card-link is-primary" href="${escapeAttr(safeUrl(game.url))}" target="_blank" rel="noreferrer noopener" aria-label="Play ${escapeAttr(game.name)}">Play</a>`;
}

function personPill(id, editorCount = 0) {
  const person = creators[id];
  if (!person) return "";
  return `
    <span class="person-pill">
      <span class="person-dot" style="--person:${escapeAttr(person.color)}" aria-hidden="true"></span>
      ${escapeHtml(person.name)}${editorCount ? ` <small>+${editorCount}</small>` : ""}
    </span>
  `;
}

function wipBadge() {
  return `<span class="wip-badge"><span></span>WIP</span>`;
}

async function copyCurrentLink(button) {
  const announce = (message) => {
    const status = button.closest(".detail-panel")?.querySelector("[data-detail-status]");
    if (status) status.textContent = message;
  };
  const reset = () => window.setTimeout(() => { button.textContent = "Copy link"; }, 1200);

  try {
    await navigator.clipboard.writeText(location.href);
    button.textContent = "Copied";
    announce("Link copied");
    reset();
  } catch {
    button.textContent = "Copy failed";
    announce("Copy failed");
    reset();
  }
}

function renderFatal(error) {
  app.innerHTML = `
    <main class="page">
      <section class="empty-state surface">
        <h2>Couldn't load the games.</h2>
        <p>${escapeHtml(error.message)}</p>
      </section>
    </main>
  `;
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

function routeId() {
  return state.route.name === "game" ? "home" : state.route.name;
}

function sortedCreators() {
  return Object.entries(creators).sort(([, a], [, b]) => a.name.localeCompare(b.name));
}

function onlineCount() {
  return games.filter((game) => game.status === "Live" && game.url).length;
}

function shade(hex, amount) {
  const number = Number.parseInt(hex.replace("#", ""), 16);
  const red = clamp((number >> 16) + amount);
  const green = clamp(((number >> 8) & 255) + amount);
  const blue = clamp((number & 255) + amount);
  return `#${((1 << 24) + (red << 16) + (green << 8) + blue).toString(16).slice(1)}`;
}

function clamp(value) {
  return Math.max(0, Math.min(255, value));
}

// Only ever emit https:// links into href attributes, so a bad/hostile value
// in the data can never become a javascript:/data: URL.
function safeUrl(value) {
  return /^https:\/\//i.test(value) ? value : "#";
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
