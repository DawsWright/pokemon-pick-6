import pokemonJson from "./pokemon.json";

export type PokemonStatName =
  | "hp"
  | "attack"
  | "defense"
  | "special-attack"
  | "special-defense"
  | "speed";

export type PokemonFormType =
  | "base"
  | "regional"
  | "mega"
  | "primal"
  | "battle"
  | "other";

export type PokemonData = {
  id: number;
  speciesId: number;
  name: string;
  displayName: string;
  formName: string | null;
  isDefaultForm: boolean;
  formType: PokemonFormType;
  sprite: string;
  types: string[];
  stats: Record<PokemonStatName, number>;
  abilities: string[];
  generation: string;
  region: string;
  evolutionChainUrl: string | null;
};

const pokemonRecords = pokemonJson as PokemonData[];

export async function getPokemonData(): Promise<PokemonData[]> {
  return pokemonRecords;
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