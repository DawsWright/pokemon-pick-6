import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const API = "https://pokeapi.co/api/v2";
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const REGION_BY_GENERATION = {
  "generation-i": "Kanto",
  "generation-ii": "Johto",
  "generation-iii": "Hoenn",
  "generation-iv": "Sinnoh",
  "generation-v": "Unova",
  "generation-vi": "Kalos",
  "generation-vii": "Alola",
  "generation-viii": "Galar",
  "generation-ix": "Paldea",
};

const STAT_NAMES = [
  "hp",
  "attack",
  "defense",
  "special-attack",
  "special-defense",
  "speed",
];

async function fetchJson(url, retries = 4) {
  for (let attempt = 0; ; attempt++) {
    try {
      const response = await fetch(url);

      if (response.status === 429 || response.status >= 500) {
        if (attempt >= retries) {
          throw new Error(`Request failed: ${response.status} ${url}`);
        }

        await new Promise((resolve) =>
          setTimeout(resolve, 1000 * (attempt + 1)),
        );
        continue;
      }

      if (!response.ok) {
        throw new Error(`Request failed: ${response.status} ${url}`);
      }

      return response.json();
    } catch (error) {
      if (attempt >= retries) throw error;

      await new Promise((resolve) =>
        setTimeout(resolve, 1000 * (attempt + 1)),
      );
    }
  }
}

async function inBatches(items, size, callback) {
  const output = [];

  for (let i = 0; i < items.length; i += size) {
    const results = await Promise.all(
      items.slice(i, i + size).map(callback),
    );

    output.push(...results);
    console.log(`Processed ${Math.min(i + size, items.length)} / ${items.length}`);
  }

  return output;
}

function classifyForm(name, isDefaultForm) {
  if (/-mega(?:-|$)/.test(name)) return "mega";
  if (/-primal(?:-|$)/.test(name)) return "primal";

  if (/(?:^|-)(?:alola|galar|hisui|paldea)(?:-|$)/.test(name)) {
    return "regional";
  }

  if (isDefaultForm) return "base";

  // Other non-default forms are included because they may
  // have distinct types, stats, or abilities.
  return "other";
}

function getFormName(name, speciesName) {
  if (name === speciesName) return null;

  const prefix = `${speciesName}-`;

  return name.startsWith(prefix)
    ? name.slice(prefix.length)
    : name;
}

function getPokemonRegion(name, generation) {
  if (/(?:^|-)alola(?:-|$)/.test(name)) return "Alola";
  if (/(?:^|-)galar(?:-|$)/.test(name)) return "Galar";
  if (/(?:^|-)hisui(?:-|$)/.test(name)) return "Hisui";
  if (/(?:^|-)paldea(?:-|$)/.test(name)) return "Paldea";

  return REGION_BY_GENERATION[generation] ?? "Unknown";
}

async function main() {
  console.log("Fetching Pokémon list...");

  const list = await fetchJson(`${API}/pokemon?limit=100000&offset=0`);
  const entries = list.results.filter(
    (entry) => !entry.name.endsWith("-gmax"),
  );

  console.log(`Found ${entries.length} Pokémon form records.`);

  // Fetch each form's battle data.
  const pokemonRecords = await inBatches(entries, 10, (entry) =>
    fetchJson(entry.url),
  );

  // Fetch each species only once, even when it has many forms.
  const speciesUrls = [
    ...new Set(pokemonRecords.map((pokemon) => pokemon.species.url)),
  ];

  console.log(`Found ${speciesUrls.length} distinct species records.`);

  const speciesRecords = await inBatches(speciesUrls, 10, (url) =>
    fetchJson(url),
  );

  const speciesByUrl = new Map(
    speciesUrls.map((url, index) => [url, speciesRecords[index]]),
  );

  const output = pokemonRecords.map((pokemon) => {
    const species = speciesByUrl.get(pokemon.species.url);

    if (!species) {
      throw new Error(`Missing species data for ${pokemon.name}`);
    }

    const stats = Object.fromEntries(
      STAT_NAMES.map((statName) => [
        statName,
        pokemon.stats.find((entry) => entry.stat.name === statName)
          ?.base_stat ?? 0,
      ]),
    );

    const speciesId = Number(
      pokemon.species.url.match(/\/pokemon-species\/(\d+)\/?$/)?.[1],
    );

    const generation = species.generation.name;

    const sprite =
      pokemon.sprites.versions?.["generation-v"]?.["black-white"]?.front_default ??
      pokemon.sprites.front_default ??
      null;

    return {
      id: pokemon.id,
      speciesId,
      name: pokemon.name,
      displayName: pokemon.name
        .split("-")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" "),
      formName: getFormName(pokemon.name, species.name),
      isDefaultForm: pokemon.is_default,
      formType: classifyForm(pokemon.name, pokemon.is_default),
      sprite,
      types: pokemon.types
        .sort((a, b) => a.slot - b.slot)
        .map((entry) => entry.type.name),
      stats,
      abilities: pokemon.abilities.map(
        (entry) => entry.ability.name,
      ),
      generation,
      region: getPokemonRegion(pokemon.name, generation),
      evolutionChainUrl: species.evolution_chain?.url ?? null,
    };
  });

  // Keep deterministic ordering for reproducible builds.
  output.sort((a, b) => a.id - b.id);

  const outputPath = path.resolve(
    __dirname,
    "../src/data/pokemon.json",
  );

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(
    outputPath,
    JSON.stringify(output, null, 2),
    "utf8",
  );

  console.log(`Wrote ${output.length} Pokémon forms to ${outputPath}`);
  console.log(
    `Included ${new Set(output.map((pokemon) => pokemon.speciesId)).size} species.`,
  );
}

main().catch((error) => {
  console.error("Pokémon dataset generation failed:", error);
  process.exitCode = 1;
});
