// Browser data loader. Fetches the canonical YAML sources at runtime, parses
// them with the shared dependency-free parser, and normalizes + validates them
// with the shared data layer. There is no build step: edit a YAML file in
// data/ and refresh. The same modules back the Node checks, so what the browser
// renders and what the checks verify can never drift.

import { parseYaml } from "./lib/yaml.mjs";
import { buildData, validateData } from "./lib/data.mjs";

let cache = null;

export async function loadData() {
  if (cache) return cache;

  const [rawCreators, rawGames] = await Promise.all([
    fetchYaml("data/creators.yaml"),
    fetchYaml("data/games.yaml")
  ]);

  const data = buildData(rawCreators, rawGames);
  const errors = validateData(data);
  if (errors.length) {
    console.error(`First or Eighth data has ${errors.length} validation error(s):\n- ${errors.join("\n- ")}`);
  }

  cache = data;
  return cache;
}

async function fetchYaml(path) {
  const response = await fetch(path, { cache: "no-cache" });
  if (!response.ok) throw new Error(`Could not load ${path} (${response.status})`);
  return parseYaml(await response.text());
}
