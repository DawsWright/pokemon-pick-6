import type { ReactNode } from "react";
import type { PokemonData, PokemonStatName } from "../../data/pokeApi";

export type Category =
  | "Base Stat Total"
  | "Typing"
  | "Abilities"
  | "Evolution Method"
  | "Region"
  | "Type Match"
  | "Highest Stat"
  | "Weaknesses";

export type ValidationResult = {
  guessedAnswer?: ReactNode;
  points: 0 | 1 | 2;
  message: string;
  correctAnswer: string;
};

function normalize(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, " ");
}

function parseList(answer: string): string[] {
  return answer
    .split(/[,;]+/)
    .map(normalize)
    .filter(Boolean);
}

const STAT_LABELS: Record<PokemonStatName, string> = {
  hp: "HP",
  attack: "Attack",
  defense: "Defense",
  "special-attack": "Special Attack",
  "special-defense": "Special Defense",
  speed: "Speed",
};

export function validateTyping(
  pokemon: PokemonData,
  answer: string,
): ValidationResult {
  const guesses = new Set(parseList(answer));
  const actual = pokemon.types.map(normalize);
  const matches = actual.filter((type) => guesses.has(type)).length;

  const correctAnswer = actual
    .map((type) => type.charAt(0).toUpperCase() + type.slice(1))
    .join(" / ");

  if (matches === actual.length && guesses.size === actual.length) {
    return {
      points: 2,
      message: "Perfect! You identified every type.",
      correctAnswer,
       
    };
  }

  if (matches > 0) {
    return {
      points: 1,
      message: "Nice! You identified at least one type.",
      correctAnswer,
       
    };
  }

  return {
    points: 0,
    message: "Incorrect typing.",
    correctAnswer,
     
  };
}

export function validateAbilities(
  pokemon: PokemonData,
  answer: string,
): ValidationResult {
  const guesses = new Set(parseList(answer));
  const actual = [...new Set(pokemon.abilities.map(normalize))];
  const matches = actual.filter((ability) => guesses.has(ability)).length;

  const correctAnswer = actual
    .map((ability) =>
      ability.replace(/\b\w/g, (letter) => letter.toUpperCase()),
    )
    .join(", ");

  if (matches === actual.length && guesses.size === actual.length) {
    return {
      points: 2,
      message: "Perfect! You named every ability.",
      correctAnswer,
       
    };
  }

  if (matches > 0) {
    return {
      points: 1,
      message: "Nice! You named at least one ability.",
      correctAnswer,
       
    };
  }

  return {
    points: 0,
    message: "None of those abilities are available to this Pokémon.",
    correctAnswer,
     
  };
}


export function validateHighestStat(
  pokemon: PokemonData,
  answer: string,
): ValidationResult {
  const maxStat = Math.max(...Object.values(pokemon.stats));

  const highestStats = (
    Object.entries(pokemon.stats) as [PokemonStatName, number][]
  )
    .filter(([, value]) => value === maxStat)
    .map(([stat]) => stat);

  const guesses = parseList(answer);

  const guessedStat = guesses.find((guess) =>
    Object.entries(STAT_LABELS).some(
      ([key, label]) =>
        normalize(key) === guess || normalize(label) === guess,
    ),
  );

  const guessedValue = guesses.find((guess) => /^\d+$/.test(guess));

  const isCorrectStat = highestStats.some(
    (stat) =>
      normalize(stat) === guessedStat ||
      normalize(STAT_LABELS[stat]) === guessedStat,
  );

  const hasCorrectValue = guessedValue === String(maxStat);

  const correctAnswer = highestStats
    .map((stat) => `${STAT_LABELS[stat]} (${maxStat})`)
    .join(", ");

  if (isCorrectStat && hasCorrectValue) {
    return {
      points: 2,
      message: "Perfect! You identified a highest stat and its correct value.",
      correctAnswer,
    };
  }

  if (isCorrectStat) {
    return {
      points: 1,
      message: "Nice! You identified a highest stat, but its value was incorrect.",
      correctAnswer,
    };
  }

  return {
    points: 0,
    message: "That isn't one of its highest stats.",
    correctAnswer,
  };
}


export function validateRegion(
  pokemon: PokemonData,
  answer: string,
  professorByRegion: Record<string, string>,
): ValidationResult {
  const guesses = answer.split(/[,;]+/).map(normalize).filter(Boolean);
  const guessedRegion = guesses[0] ?? "";
  let guessedProfessor = guesses.slice(1).join(" ");

  // Accept names with or without the word "Professor".
  guessedProfessor = guessedProfessor.replace(/^professor\s+/, "");

  const correctRegion = normalize(pokemon.region);
  const professorEntry = professorByRegion[pokemon.region] ?? "";

  // Allow either professor for Paldea.
  const acceptedProfessors =
    pokemon.region === "Paldea"
      ? ["sada", "turo"]
      : [professorEntry.replace(/^Professor\s+/i, "").toLowerCase()];

  const regionCorrect = guessedRegion === correctRegion;
  const professorCorrect = acceptedProfessors.some(
    (professor) => normalize(professor) === guessedProfessor,
  );

  const correctProfessor =
    pokemon.region === "Paldea"
      ? "Professor Sada or Professor Turo"
      : professorEntry;

  if (regionCorrect && professorCorrect) {
    return {
      points: 2,
      message: "Perfect! You identified the correct region and professor.",
      correctAnswer: `${pokemon.region} — ${correctProfessor}`,
       
    };
  }

  if (regionCorrect) {
    return {
      points: 1,
      message: "Nice! You identified the correct region, but not the professor.",
      correctAnswer: `${pokemon.region} — ${correctProfessor}`,
       
    };
  }

  return {
    points: 0,
    message: "That region was incorrect.",
    correctAnswer: `${pokemon.region} — ${correctProfessor}`,
     
  };
}
