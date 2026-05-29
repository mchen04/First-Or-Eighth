import { readFileSync, readdirSync, statSync } from "node:fs";
import { loadDataSync, fromRoot } from "../src/lib/node.mjs";
import { validateData, SCREENSHOT_CONTRACT } from "../src/lib/data.mjs";
import { assertImageContract } from "./image-metadata.mjs";

const failures = [];
const fail = (message) => failures.push(message);

const expectedCssFiles = [
  "styles.css",
  "css/shell.css",
  "css/primitives.css",
  "css/library.css",
  "css/detail.css",
  "css/creators.css",
  "css/responsive.css"
];

// --- Data: parse + normalize + validate the canonical YAML --------------------

let data;
try {
  data = loadDataSync();
} catch (error) {
  fail(`Could not load YAML data: ${error.message}`);
}

if (data) {
  for (const error of validateData(data)) fail(`Data: ${error}`);
}

const games = data?.games ?? [];
if (data && !games.length) fail("No games defined in data/games.yaml");

// --- Files exist --------------------------------------------------------------

const screenshotFiles = games.flatMap((game) => (game.screenshot ? Object.values(game.screenshot) : []));
const requiredFiles = [
  "index.html",
  "src/app.js",
  "src/data.mjs",
  "src/lib/yaml.mjs",
  "src/lib/data.mjs",
  "src/lib/node.mjs",
  "data/creators.yaml",
  "data/games.yaml",
  "scripts/generate-screenshots.mjs",
  "scripts/image-metadata.mjs",
  "README.md",
  ...expectedCssFiles,
  ...screenshotFiles
];

for (const file of requiredFiles) {
  if (!exists(file)) fail(`Missing required file: ${file}`);
}

// --- index.html links the stylesheet set in order ----------------------------

const html = exists("index.html") ? readText("index.html") : "";
const js = exists("src/app.js") ? readText("src/app.js") : "";

const linkedCss = [...html.matchAll(/<link\b[^>]*>/gi)].map(([tag]) => linkStylesheet(tag)).filter(Boolean);
if (!linkedCss.length) fail("index.html does not link any local stylesheets");
if (linkedCss.join("\n") !== expectedCssFiles.join("\n")) {
  fail(`index.html stylesheet order mismatch. Expected: ${expectedCssFiles.join(", ")}; found: ${linkedCss.join(", ")}`);
}

for (const snippet of ["First or Eighth", "src/app.js", ...linkedCss]) {
  if (!html.includes(snippet)) fail(`index.html does not include ${snippet}`);
}

// --- CSS contracts ------------------------------------------------------------

const css = linkedCss.filter(exists).map(readText).join("\n");

for (const rule of [
  "@media (max-width: 840px)",
  "@media (max-width: 520px)",
  "@media (orientation: landscape) and (max-height: 500px)",
  ".mobile-drawer",
  ".detail-overlay",
  ".detail-actions",
  "body.scroll-lock"
]) {
  if (!css.includes(rule)) fail(`Linked stylesheet set is missing rule: ${rule}`);
}

for (const stale of [".detail-hero", ".kv-grid", ".back-link", ".related-grid"]) {
  if (css.includes(stale)) fail(`Stylesheets still contain pre-overlay detail rule: ${stale}`);
}

// --- app.js contracts ---------------------------------------------------------

for (const forbidden of ["statsPage", "#/stats", "hero(", "#/about", "aboutPage", "about-page", "about-copy"]) {
  if (js.includes(forbidden)) fail(`src/app.js still includes removed design element: ${forbidden}`);
}

if (!js.includes('sort: "az"')) fail("src/app.js should default to alphabetical sorting");
if (!js.includes("onlineCount()")) fail("src/app.js should derive the online count from data");
if (!js.includes('loadData')) fail("src/app.js should load data from the YAML loader");

// --- Screenshots: derived names + image contracts -----------------------------

for (const game of games) {
  if (!game.screenshot) continue;
  verifyScreenshotSet(game);
}

// Renamed/legacy artifacts must not linger.
if (exists("assets")) {
  for (const name of readdirSync(fromRoot("assets"))) {
    if (name.startsWith("shot-")) fail(`Legacy screenshot name should be renamed to its game id: assets/${name}`);
    if (name.startsWith("thumb-") && name.endsWith(".svg")) fail(`Unused thumbnail artifact should not be checked in: assets/${name}`);
  }
}

// --- Report -------------------------------------------------------------------

if (failures.length) {
  console.error(`Static site checks failed (${failures.length}):`);
  for (const message of failures) console.error(`  - ${message}`);
  process.exit(1);
}

console.log(`Static site checks passed (${games.length} games).`);

// --- Helpers ------------------------------------------------------------------

function verifyScreenshotSet(game) {
  const base = `assets/${game.id}`;
  for (const [kind, contract] of Object.entries(SCREENSHOT_CONTRACT)) {
    const file = game.screenshot[kind];
    const expectedName = `${base}${contract.suffix}`;
    if (file !== expectedName) {
      fail(`${game.name} ${kind} screenshot must be derived from its id (${expectedName}): ${file}`);
      continue;
    }
    if (!exists(file)) {
      fail(`${game.name} ${kind} screenshot is missing: ${file}`);
      continue;
    }
    assertImageContract(fromRoot(file), contract, `${game.name} ${kind}`, fail);
  }
}

function exists(path) {
  try {
    statSync(fromRoot(path));
    return true;
  } catch {
    return false;
  }
}

function readText(path) {
  return readFileSync(fromRoot(path), "utf8");
}

function linkStylesheet(tag) {
  const rel = attr(tag, "rel");
  const href = attr(tag, "href");
  if (!rel || !href) return "";
  if (!rel.split(/\s+/).includes("stylesheet")) return "";
  // Only count local stylesheets; a CDN/protocol-relative .css is not one of ours.
  if (/^(?:[a-z]+:)?\/\//i.test(href)) return "";
  return href.endsWith(".css") ? href : "";
}

function attr(tag, name) {
  return tag.match(new RegExp(`\\b${name}=["']([^"']+)["']`, "i"))?.[1] || "";
}
