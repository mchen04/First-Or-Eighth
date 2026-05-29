// Node-side data loader for the build/check scripts. Reads the same canonical
// YAML the browser fetches and runs it through the same parser + data layer,
// resolving paths from the repo root so the scripts work from any cwd.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { parseYaml } from "./yaml.mjs";
import { buildData } from "./data.mjs";

export const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

export function fromRoot(...segments) {
  return join(repoRoot, ...segments);
}

export function loadDataSync() {
  const creators = parseYaml(readFileSync(fromRoot("data", "creators.yaml"), "utf8"));
  const games = parseYaml(readFileSync(fromRoot("data", "games.yaml"), "utf8"));
  return buildData(creators, games);
}
