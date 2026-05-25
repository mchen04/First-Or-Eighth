import { mkdtempSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { games } from "../src/data.mjs";

const contracts = [
  ["card", 640, 400],
  ["detail", 1200, 750]
];

ensureCommand("sips", ["--version"]);
ensureCommand("cwebp", ["-version"]);

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
  for (const [kind, width, height] of contracts) {
    const source = game.screenshot.fallback;
    const target = game.screenshot[kind];
    const resized = join(workspace, `${game.id}-${kind}.png`);

    if (dirname(target) !== dirname(source)) {
      fail(`${game.name} ${kind} screenshot must stay beside its fallback: ${target}`);
    }

    run("sips", ["-z", String(height), String(width), source, "--out", resized], `resize ${game.name} ${kind}`);
    run("cwebp", ["-quiet", "-q", "82", resized, "-o", target], `encode ${game.name} ${kind}`);
  }
}

function ensureCommand(command, args) {
  const result = spawnSync(command, args, { stdio: "ignore" });
  if (result.error?.code === "ENOENT") fail(`Missing required image tool: ${command}`);
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
