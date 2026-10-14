
const API_BASE = "https://pokeapi.co/api/v2";

export type PokemonStatName =
  | "hp"
  | "attack"
  | "defense"
  | "special-attack"
  | "special-defense"
  | "speed";

export type PokemonData = {
  id: number;
  name: string;
  sprite: string;
  types: string[];
  stats: Record<PokemonStatName, number>;
  abilities: string[];
  generation: string;
  region: string;
  evolutionChainUrl: string | null;
};

type ApiResource = {
  name: string;
  url: string;
};

type ApiPokemon = {
  id: number;
  name: string;
  sprites: {
    front_default: string | null;
  };
  types: {
    slot: number;
    type: ApiResource;
  }[];
  stats: {
    base_stat: number;
    stat: ApiResource;
  }[];
  abilities: {
    ability: ApiResource;
    is_hidden: boolean;
  }[];
};

type ApiSpecies = {
  generation: ApiResource;
  evolution_chain: ApiResource;
};

const STAT_NAMES: PokemonStatName[] = [
  "hp",
  "attack",
  "defense",
  "special-attack",
  "special-defense",
  "speed",
];

const REGION_BY_GENERATION: Record<string, string> = {
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

let pokemonCache: PokemonData[] | null = null;

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`PokéAPI request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

async function fetchInBatches<T, R>(
  items: T[],
  batchSize: number,
  fetchItem: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = [];

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(fetchItem));
    results.push(...batchResults);
  }

  return results;
}

export async function getPokemonData(): Promise<PokemonData[]> {
  if (pokemonCache) {
    return pokemonCache;
  }

  const pokemonIds = Array.from({ length: 151 }, (_, i) => i + 1);

  const pokemonRecords = await fetchInBatches(
    pokemonIds,
    10,
    async (id) => {
      const pokemon = await fetchJson<ApiPokemon>(
        `${API_BASE}/pokemon/${id}`,
      );

      const species = await fetchJson<ApiSpecies>(
        `${API_BASE}/pokemon-species/${id}`,
      );

      const stats = Object.fromEntries(
        pokemon.stats.map((stat) => [
          stat.stat.name,
          stat.base_stat,
        ]),
      ) as Record<PokemonStatName, number>;

      const generation = species.generation.name;

      return {
        id: pokemon.id,
        name: pokemon.name,
        sprite:
          pokemon.sprites.front_default ??
          `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`,
        types: pokemon.types
          .sort((a, b) => a.slot - b.slot)
          .map((entry) => entry.type.name),
        stats: Object.fromEntries(
          STAT_NAMES.map((statName) => [
            statName,
            stats[statName],
          ]),
        ) as Record<PokemonStatName, number>,
        abilities: pokemon.abilities.map(
          (entry) => entry.ability.name,
        ),
        generation,
        region: REGION_BY_GENERATION[generation] ?? "Unknown",
        evolutionChainUrl: species.evolution_chain?.url ?? null,
      } satisfies PokemonData;
    },
  );

  pokemonCache = pokemonRecords;
  return pokemonCache;
}

export function getBaseStatTotal(pokemon: PokemonData): number {
  return Object.values(pokemon.stats).reduce(
    (total, value) => total + value,
    0,
  );
}

export function formatPokemonName(name: string): string {
  return name
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
