import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const required = ["index.html", "styles.css", "src/app.js", "README.md"];
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
  "https://valence1.vercel.app/",
  "https://25-words-or-less.vercel.app/"
]) {
  if (!js.includes(url)) fail(`src/app.js missing game URL ${url}`);
}

for (const name of ["Jeremy", "Matthew", "Michael", "Valence", "25 Words or Less", "Pancake", "WIP"]) {
  if (!js.includes(name)) fail(`src/app.js missing expected game/creator copy: ${name}`);
}

for (const query of ["@media (max-width: 840px)", "@media (max-width: 520px)", "@media (orientation: landscape) and (max-height: 500px)", ".mobile-drawer"]) {
  if (!css.includes(query)) fail(`styles.css missing responsive rule ${query}`);
}

for (const forbidden of ["ding-game.vercel.app", "statsPage", "#/stats", "hero("]) {
  if (js.includes(forbidden)) fail(`src/app.js still includes removed design element: ${forbidden}`);
}

for (const file of walk("assets")) {
  if (!file.endsWith(".svg")) continue;
  const body = readFileSync(file, "utf8");
  if (!body.includes("<svg")) fail(`Asset is not an SVG: ${file}`);
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
