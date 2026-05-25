import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const required = [
  "index.html",
  "styles.css",
  "src/app.js",
  "README.md",
  "assets/shot-valence.png",
  "assets/shot-ding.png",
  "assets/shot-25-words.png"
];
const missing = required.filter((file) => !exists(file));

if (missing.length) {
  fail(`Missing required files: ${missing.join(", ")}`);
}

const html = readFileSync("index.html", "utf8");
const js = readFileSync("src/app.js", "utf8");
const css = readFileSync("styles.css", "utf8");

for (const snippet of ["First or Eighth", "src/app.js", "styles.css"]) {
  if (!html.includes(snippet)) fail(`index.html does not include ${snippet}`);
}

for (const url of [
  "https://ding-game.vercel.app/",
  "https://valence1.vercel.app/",
  "https://25-words-or-less.vercel.app/",
  "https://github.com/mchen04",
  "https://github.com/jormyy",
  "https://github.com/matthewh8",
  "https://github.com/jormyy/ding",
  "https://github.com/jormyy/valence",
  "https://github.com/jormyy/pancake",
  "https://github.com/matthewh8/25-words-or-less"
]) {
  if (!js.includes(url)) fail(`src/app.js missing game/source URL ${url}`);
}

for (const name of ["Jeremy", "Matthew", "Michael", "Ding", "Valence", "25 Words or Less", "Pancake", "WIP"]) {
  if (!js.includes(name)) fail(`src/app.js missing expected game/creator copy: ${name}`);
}

for (const copy of ["collaborative poker-ranking", "live sports dashboard", "local same-screen party game"]) {
  if (!js.includes(copy)) fail(`src/app.js missing GitHub-informed description copy: ${copy}`);
}

for (const query of [
  "@media (max-width: 840px)",
  "@media (max-width: 520px)",
  "@media (orientation: landscape) and (max-height: 500px)",
  ".mobile-drawer",
  ".related > h2"
]) {
  if (!css.includes(query)) fail(`styles.css missing responsive rule ${query}`);
}

if (css.includes(".related h2")) fail("styles.css must not style related card titles as section headings");

for (const forbidden of ["statsPage", "#/stats", "hero("]) {
  if (js.includes(forbidden)) fail(`src/app.js still includes removed design element: ${forbidden}`);
}

if (!js.includes('sort: "az"')) fail("src/app.js should default to alphabetical sorting");

for (const snippet of ["Autist #1", "Autist #2", "Autist #3", "onlineCount()", "A few specials with AI doing things"]) {
  if (!js.includes(snippet)) fail(`src/app.js missing requested builder/about copy: ${snippet}`);
}

for (const file of walk("assets")) {
  if (file.endsWith(".svg")) fail(`Unused SVG artifact should not be checked in: ${file}`);
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

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    const stat = statSync(path);
    if (stat.isDirectory()) out.push(...walk(path));
    else out.push(path);
  }
  return out;
}

function fail(message) {
  console.error(message);
  process.exit(1);
}
