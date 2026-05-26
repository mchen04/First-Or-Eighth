import { readFileSync, statSync } from "node:fs";
import { creators, games } from "../src/data.mjs";
import { assertImageContract } from "./image-metadata.mjs";

const expectedCssFiles = [
  "styles.css",
  "css/shell.css",
  "css/primitives.css",
  "css/library.css",
  "css/detail.css",
  "css/creators.css",
  "css/responsive.css"
];

const screenshotFiles = games.flatMap((game) => game.screenshot ? Object.values(game.screenshot) : []);
const required = [
  "index.html",
  "src/app.js",
  "src/data.mjs",
  "scripts/generate-screenshots.mjs",
  "scripts/image-metadata.mjs",
  "README.md",
  ...expectedCssFiles,
  ...screenshotFiles
];
const missing = required.filter((file) => !exists(file));

if (missing.length) {
  fail(`Missing required files: ${missing.join(", ")}`);
}

const html = readFileSync("index.html", "utf8");
const js = readFileSync("src/app.js", "utf8");
const cssFiles = [...html.matchAll(/<link\b[^>]*>/gi)]
  .map(([tag]) => linkStylesheet(tag))
  .filter(Boolean);
const data = JSON.stringify({ creators, games });
validateData();

if (!cssFiles.length) fail("index.html does not link any local stylesheets");
if (cssFiles.join("\n") !== expectedCssFiles.join("\n")) {
  fail(`index.html stylesheet order mismatch. Expected: ${expectedCssFiles.join(", ")}; found: ${cssFiles.join(", ")}`);
}

for (const snippet of ["First or Eighth", "src/app.js", ...cssFiles]) {
  if (!html.includes(snippet)) fail(`index.html does not include ${snippet}`);
}

for (const file of cssFiles) {
  if (!exists(file)) fail(`Stylesheet linked from index.html is missing: ${file}`);
}

const css = cssFiles.map((file) => readFileSync(file, "utf8")).join("\n");

for (const name of ["Jeremy", "Matthew", "Michael", "Ding", "LoLdle", "Valence", "25 Words or Less", "Pancake", "WIP"]) {
  if (!data.includes(name)) fail(`src/data.mjs missing expected game/creator copy: ${name}`);
}

for (const copy of ["collaborative poker-ranking", "League of Legends champion guessing", "live sports dashboard", "local same-screen party game"]) {
  if (!data.includes(copy)) fail(`src/data.mjs missing GitHub-informed description copy: ${copy}`);
}

for (const query of [
  "@media (max-width: 840px)",
  "@media (max-width: 520px)",
  "@media (orientation: landscape) and (max-height: 500px)",
  ".mobile-drawer",
  ".related > h2"
]) {
  if (!css.includes(query)) fail(`Linked stylesheet set missing responsive rule ${query}`);
}

if (css.includes(".related h2")) fail("Linked stylesheet set must not style related card titles as section headings");

for (const forbidden of ["statsPage", "#/stats", "hero(", "#/about", "aboutPage", "about-page", "about-copy"]) {
  if (js.includes(forbidden)) fail(`src/app.js still includes removed design element: ${forbidden}`);
}

if (!js.includes('sort: "az"')) fail("src/app.js should default to alphabetical sorting");

for (const snippet of ["Autist #1", "Autist #2", "Autist #3", "onlineCount()"]) {
  if (!(js + data).includes(snippet)) fail(`Source missing requested builder copy: ${snippet}`);
}

for (const game of games) {
  if (game.url && !game.screenshot) fail(`${game.name} is live but has no screenshot set`);
  if (!game.screenshot) continue;
  verifyScreenshotSet(game);
}

for (const file of ["assets/thumb-25.svg", "assets/thumb-ding.svg", "assets/thumb-pancake.svg", "assets/thumb-valence.svg"]) {
  if (exists(file)) fail(`Unused thumbnail artifact should not be checked in: ${file}`);
}

console.log("Static site checks passed.");

function exists(path) {
  try {
    statSync(path);
    return true;
  } catch {
    return false;
  }
}

function verifyScreenshotSet(game) {
  const expected = {
    card: { suffix: "-card.webp", format: "webp", width: 640, height: 400 },
    detail: { suffix: "-detail.webp", format: "webp", width: 1200, height: 750 },
    fallback: { suffix: ".png", format: "png", width: 1440, height: 900 }
  };
  const base = game.screenshot.fallback.replace(/\.png$/, "");

  for (const [kind, contract] of Object.entries(expected)) {
    const file = game.screenshot[kind];
    if (!file) fail(`${game.name} screenshot set missing ${kind}`);
    if (file !== `${base}${contract.suffix}`) fail(`${game.name} ${kind} screenshot must use ${contract.suffix}: ${file}`);
    assertImage(file, contract, `${game.name} ${kind}`);
  }
}

function validateData() {
  const creatorIds = new Set(Object.keys(creators));
  const gameIds = new Set();

  for (const [id, creator] of Object.entries(creators)) {
    if (!creator.name || !creator.githubUrl || !creator.color) fail(`Creator ${id} is missing required fields`);
    if (!isUrl(creator.githubUrl)) fail(`Creator ${id} has invalid GitHub URL: ${creator.githubUrl}`);
    if (!isHexColor(creator.color)) fail(`Creator ${id} has invalid color: ${creator.color}`);
  }

  for (const game of games) {
    if (!game.id || gameIds.has(game.id)) fail(`Duplicate or missing game id: ${game.id}`);
    gameIds.add(game.id);
    if (!Array.isArray(game.editors)) fail(`${game.name || game.id} editors must be an array`);
    if (!["Live", "WIP"].includes(game.status)) fail(`${game.name} has unknown status: ${game.status}`);
    if (!creatorIds.has(game.creator)) fail(`${game.name} references unknown creator: ${game.creator}`);
    for (const editor of game.editors) {
      if (!creatorIds.has(editor)) fail(`${game.name} references unknown editor: ${editor}`);
    }
    if (!game.name || !game.genre || !game.year || !game.sourceUrl || !game.tagline || !game.description) {
      fail(`${game.id} is missing required game metadata`);
    }
    if (!isHexColor(game.accent)) fail(`${game.name} has invalid accent: ${game.accent}`);
    if (game.url && !isUrl(game.url)) fail(`${game.name} has invalid play URL: ${game.url}`);
    if (!isUrl(game.sourceUrl)) fail(`${game.name} has invalid source URL: ${game.sourceUrl}`);
    if (game.status === "Live" && !game.url) fail(`${game.name} is live but has no play URL`);
    if (game.screenshot && !["card", "detail", "fallback"].every((key) => typeof game.screenshot[key] === "string")) {
      fail(`${game.name} has incomplete screenshot metadata`);
    }
  }
}

function isUrl(value) {
  return /^https:\/\/\S+$/.test(value);
}

function isHexColor(value) {
  return /^#[0-9a-f]{6}$/i.test(value);
}

function assertImage(file, contract, label) {
  assertImageContract(file, contract, label, fail);
}

function linkStylesheet(tag) {
  const rel = attr(tag, "rel");
  const href = attr(tag, "href");
  if (!rel || !href) return "";
  if (!rel.split(/\s+/).includes("stylesheet")) return "";
  return href.endsWith(".css") ? href : "";
}

function attr(tag, name) {
  return tag.match(new RegExp(`\\b${name}=["']([^"']+)["']`, "i"))?.[1] || "";
}

function fail(message) {
  console.error(message);
  process.exit(1);
}
