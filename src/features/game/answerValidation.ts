
import {
  getBaseStatTotal,
  type PokemonData,
  type PokemonStatName,
} from "../../data/pokeAPI";

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

export function validateBST(
  pokemon: PokemonData,
  answer: string,
): ValidationResult {
  const guess = Number(answer.trim());
  const actual = getBaseStatTotal(pokemon);

  if (!answer.trim() || !Number.isFinite(guess)) {
    return {
      points: 0,
      message: "Enter a valid number.",
      correctAnswer: String(actual),
    };
  }

  if (guess === actual) {
    return {
      points: 2,
      message: "Perfect! Exact Base Stat Total.",
      correctAnswer: String(actual),
    };
  }

  if (Math.abs(guess - actual) <= 10) {
    return {
      points: 1,
      message: "Good! You were within 10 points.",
      correctAnswer: String(actual),
    };
  }

  return {
    points: 0,
    message: "Not quite!",
    correctAnswer: String(actual),
  };
}

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
      message: "Good! You identified at least one type.",
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
      message: "Perfect! You named every listed ability.",
      correctAnswer,
    };
  }

  if (matches > 0) {
    return {
      points: 1,
      message: "Good! You named at least one ability.",
      correctAnswer,
    };
  }

  return {
    points: 0,
    message: "None of those abilities matched.",
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

  const guesses = new Set(parseList(answer));
  const normalizedLabels = highestStats.map(normalize);
  const hasCorrectStat = normalizedLabels.some((stat, index) => {
    const label = normalize(STAT_LABELS[highestStats[index]]);
    return guesses.has(stat) || guesses.has(label);
  });

  const includesExactValue = guesses.has(String(maxStat));
  const correctAnswer = highestStats
    .map((stat) => `${STAT_LABELS[stat]} (${maxStat})`)
    .join(", ");

  if (hasCorrectStat && includesExactValue) {
    return {
      points: 2,
      message: "Perfect! Correct stat and exact value.",
      correctAnswer,
    };
  }

  if (hasCorrectStat) {
    return {
      points: 1,
      message: "Good! You identified a highest stat.",
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
      message: "Good! You identified the correct region, but not the professor.",
      correctAnswer: `${pokemon.region} — ${correctProfessor}`,
    };
  }

  return {
    points: 0,
    message: "That region was incorrect.",
    correctAnswer: `${pokemon.region} — ${correctProfessor}`,
  };
}
