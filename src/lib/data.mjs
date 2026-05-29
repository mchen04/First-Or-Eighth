// Pure data layer: turns the raw parsed YAML (data/creators.yaml,
// data/games.yaml) into the normalized shapes the app and the checks consume,
// and validates them. No I/O here, so the browser loader and the Node scripts
// share exactly the same normalization and rules.

const SCREENSHOT_CONTRACT = {
  card: { suffix: "-card.webp", format: "webp", width: 640, height: 400 },
  detail: { suffix: "-detail.webp", format: "webp", width: 1200, height: 750 },
  fallback: { suffix: ".png", format: "png", width: 1440, height: 900 }
};

export { SCREENSHOT_CONTRACT };

export function buildData(rawCreators, rawGames) {
  if (rawCreators != null && (typeof rawCreators !== "object" || Array.isArray(rawCreators))) {
    throw new Error("data/creators.yaml must be a mapping of creator id to fields");
  }
  if (rawGames != null && !Array.isArray(rawGames)) {
    throw new Error('data/games.yaml must be a list of game blocks (each starting with "- id:")');
  }
  return {
    creators: normalizeCreators(rawCreators),
    games: normalizeGames(rawGames)
  };
}

function normalizeCreators(raw) {
  const creators = {};
  for (const [id, value] of Object.entries(raw ?? {})) {
    creators[id] = {
      id,
      name: text(value?.name),
      handle: text(value?.handle),
      githubUrl: value?.github,
      color: value?.color,
      bio: text(value?.bio)
    };
  }
  return creators;
}

function normalizeGames(raw) {
  const list = Array.isArray(raw) ? raw : [];
  return list.map((game) => {
    const editorsValue = game?.editors;
    const normalized = {
      id: game?.id,
      name: text(game?.name),
      status: game?.status,
      url: game?.url ?? "",
      sourceUrl: game?.source,
      creator: game?.creator,
      editors: Array.isArray(editorsValue) ? editorsValue : [],
      genre: text(game?.genre),
      year: text(game?.year),
      accent: game?.accent,
      tagline: text(game?.tagline),
      description: text(game?.description),
      screenshot: screenshotFor(game)
    };
    // Surface a hand-edit that wrote editors as something other than a list, so
    // validation can report it instead of the app silently treating it as none.
    if (editorsValue != null && !Array.isArray(editorsValue)) {
      normalized.editorsInvalid = editorsValue;
    }
    return normalized;
  });
}

// Numbers/booleans from YAML (e.g. `name: 2048`) are coerced to text so they
// behave like every other string downstream (sorting, rendering) instead of
// crashing; null/undefined are preserved so validation can flag a missing field.
function text(value) {
  return value == null ? value : String(value);
}

function screenshotFor(game) {
  const flag = game?.screenshot;
  const disabled = flag === false || (typeof flag === "string" && ["false", "no", "off"].includes(flag.trim().toLowerCase()));
  if (disabled || !game?.id) return null;
  const base = `assets/${game.id}`;
  return Object.fromEntries(
    Object.entries(SCREENSHOT_CONTRACT).map(([kind, contract]) => [kind, `${base}${contract.suffix}`])
  );
}

// Returns an array of human-readable error strings; empty means valid.
export function validateData({ creators, games }) {
  const errors = [];
  const creatorIds = new Set(Object.keys(creators));

  for (const [id, creator] of Object.entries(creators)) {
    if (!creator.name) errors.push(`Creator ${id} is missing a name`);
    if (!creator.handle) errors.push(`Creator ${id} is missing a handle`);
    if (!creator.bio) errors.push(`Creator ${id} is missing a bio`);
    if (!isUrl(creator.githubUrl)) errors.push(`Creator ${id} has an invalid GitHub URL: ${creator.githubUrl}`);
    if (!isHexColor(creator.color)) errors.push(`Creator ${id} has an invalid color: ${creator.color}`);
  }

  const seenIds = new Set();
  for (const game of games) {
    const label = game.name || game.id || "(unnamed game)";
    if (game.id != null && typeof game.id !== "string") errors.push(`A game has a non-text id (quote it, e.g. id: "${game.id}"): ${JSON.stringify(game.id)}`);
    else if (!game.id) errors.push("A game is missing its id");
    else if (seenIds.has(game.id)) errors.push(`Duplicate game id: ${game.id}`);
    else if (!/^[a-z0-9-]+$/.test(game.id)) errors.push(`Game id must be lowercase letters, numbers, and dashes: ${game.id}`);
    seenIds.add(game.id);

    if (!["Live", "WIP"].includes(game.status)) errors.push(`${label} has an unknown status: ${game.status}`);
    if (!creatorIds.has(game.creator)) errors.push(`${label} references an unknown creator: ${game.creator}`);
    if (game.editorsInvalid !== undefined) {
      errors.push(`${label} editors must be a list like [michael]: got ${JSON.stringify(game.editorsInvalid)}`);
    }
    for (const editor of game.editors) {
      if (!creatorIds.has(editor)) errors.push(`${label} references an unknown editor: ${editor}`);
    }

    for (const field of ["name", "genre", "year", "tagline", "description"]) {
      if (!game[field]) errors.push(`${label} is missing required field: ${field}`);
    }
    if (game.year && !/^\d{4}$/.test(game.year)) errors.push(`${label} has an invalid year (expected 4 digits): ${game.year}`);

    if (!isHexColor(game.accent)) errors.push(`${label} has an invalid accent: ${game.accent}`);
    if (!isUrl(game.sourceUrl)) errors.push(`${label} has an invalid source URL: ${game.sourceUrl}`);
    if (game.url && !isUrl(game.url)) errors.push(`${label} has an invalid play URL: ${game.url}`);
    if (game.status === "Live" && !game.url) errors.push(`${label} is Live but has no play URL`);
    if (game.status === "Live" && !game.screenshot) errors.push(`${label} is Live but has no screenshot`);
  }

  return errors;
}

function isUrl(value) {
  return typeof value === "string" && /^https:\/\/\S+$/.test(value);
}

function isHexColor(value) {
  return typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value);
}
