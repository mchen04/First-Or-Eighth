import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { loadDataSync, fromRoot } from "../src/lib/node.mjs";
import { SCREENSHOT_CONTRACT } from "../src/lib/data.mjs";

// Regenerates the responsive WebP variants for every game that has a capture.
// Drop a fresh 1440x900 PNG at assets/<id>.png and run `npm run assets`; the
// card (640x400) and detail (1200x750) WebPs are derived from it. Dimensions
// come from the shared contract so they cannot drift from the checks.

const contracts = Object.entries(SCREENSHOT_CONTRACT)
  .filter(([kind]) => kind !== "fallback")
  .map(([kind, contract]) => [kind, contract.width, contract.height]);

ensureCommand("sips", ["--version"]);
ensureCommand("cwebp", ["-version"]);

const { games } = loadDataSync();
const workspace = mkdtempSync(join(tmpdir(), "first-eighth-assets-"));

try {
  for (const game of games) {
    if (!game.screenshot) continue;
    generateSet(game);
  }
} finally {
  rmSync(workspace, { recursive: true, force: true });
}

console.log("Screenshot WebP assets generated.");

function generateSet(game) {
  const source = fromRoot(game.screenshot.fallback);
  if (!existsSync(source)) {
    fail(`Missing source capture for ${game.name}: ${game.screenshot.fallback} (add a 1440x900 PNG there)`);
  }

  for (const [kind, width, height] of contracts) {
    const target = fromRoot(game.screenshot[kind]);
    const resized = join(workspace, `${game.id}-${kind}.png`);

    run("sips", ["-z", String(height), String(width), source, "--out", resized], `resize ${game.name} ${kind}`);
    run("cwebp", ["-quiet", "-q", "82", resized, "-o", target], `encode ${game.name} ${kind}`);
  }
}

function ensureCommand(command, args) {
  const result = spawnSync(command, args, { stdio: "ignore" });
  if (result.error?.code === "ENOENT") fail(`Missing required image tool: ${command}`);
  if (result.error) fail(`Unable to run required image tool ${command}: ${result.error.message}`);
  if (result.status !== 0) fail(`Required image tool ${command} failed preflight with status ${result.status}`);
}

function run(command, args, label) {
  const result = spawnSync(command, args, { stdio: "inherit" });
  if (result.error) fail(`${label} failed: ${result.error.message}`);
  if (result.status !== 0) fail(`${label} failed with status ${result.status}`);
}

function fail(message) {
  console.error(message);
  process.exit(1);
}
