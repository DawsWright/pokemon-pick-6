import { useEffect, useState } from "react";
import WeaknessesAnswer from "./WeaknessesAnswer";
import TypingAnswer from "./TypingAnswer";
import RegionAnswer from "./RegionAnswer";
import {
  getPokemonData,
  getBaseStatTotal,
  formatPokemonName,
  type PokemonData,
  type PokemonStatName,
} from "../data/pokeApi";
import {
  validateTyping,
  validateAbilities,
  validateHighestStat,
  validateRegion,
  type ValidationResult,
} from "../features/game/answerValidation";
import EvolutionMethodAnswer, {
  type EvolutionAnswer,
} from "./EvolutionMethodAnswer";


type Category =
  | "Typing"
  | "Region"
  | "Weaknesses"
  | "Resistances"
  | "Type Match"
  | "Highest Stat"
  | "Abilities"
  | "Evolution Method";

const CATEGORIES: Category[] = [
  "Typing",
  "Region",
  "Weaknesses",
  "Resistances",
  "Type Match",
  "Highest Stat",
  "Abilities",
  "Evolution Method",
];

const PROFESSORS: Record<string, string> = {
  Kanto: "Professor Oak",
  Johto: "Professor Elm",
  Hoenn: "Professor Birch",
  Sinnoh: "Professor Rowan",
  Unova: "Professor Juniper",
  Kalos: "Professor Sycamore",
  Alola: "Professor Kukui",
  Galar: "Professor Magnolia",
  Hisui: "Professor Laventon",
  Paldea: "Professor Sada or Professor Turo",
};

type GameScreenProps = {
  onHome: () => void;
};

type TypeApiResponse = {
  damage_relations: {
    double_damage_from: { name: string }[];
    half_damage_from: { name: string }[];
    no_damage_from: { name: string }[];
  };
};

type EvolutionDetail = {
  min_level: number | null;
  item: { name: string } | null;
  trigger: { name: string };
  held_item: { name: string } | null;
  known_move: { name: string } | null;
  min_happiness: number | null;
  time_of_day: string;
  location: { name: string } | null;
  trade_species: { name: string } | null;
};

type EvolutionNode = {
  species: { name: string };
  evolves_to: EvolutionNode[];
  evolution_details: EvolutionDetail[];
};

type EvolutionResponse = {
  chain: EvolutionNode;
};

type ExtraInfo = {
  weaknesses?: string[];
  resistances?: string[];
  evolutionDescription?: string;
  evolutionMethod?: string;
};

function shuffle<T>(items: T[]): T[] {
  const result = [...items];

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
}

function normalize(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");
}

function parseAnswers(answer: string): string[] {
  return answer
    .split(/[,;]+/)
    .map(normalize)
    .filter(Boolean);
}

function titleCase(value: string): string {
  return value.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`PokéAPI request failed (${response.status})`);
  }

  return response.json() as Promise<T>;
}

function collectEvolutionNodes(
  node: EvolutionNode,
  result: EvolutionNode[] = [],
): EvolutionNode[] {
  result.push(node);

  for (const child of node.evolves_to) {
    collectEvolutionNodes(child, result);
  }

  return result;
}

function describeEvolution(detail: EvolutionDetail): string {
  const trigger = detail.trigger.name;

  if (trigger === "level-up") {
    if (detail.min_level) return `Level ${detail.min_level}`;

    if (detail.min_happiness) {
      return `Level up with friendship ${detail.min_happiness}`;
    }

    if (detail.known_move) {
      return `Level up knowing ${formatPokemonName(detail.known_move.name)}`;
    }

    if (detail.location) {
      return `Level up at ${formatPokemonName(detail.location.name)}`;
    }

    if (detail.time_of_day) {
      return `Level up during ${detail.time_of_day}`;
    }

    return "Level up";
  }

  if (trigger === "use-item" && detail.item) {
    return `Use ${formatPokemonName(detail.item.name)}`;
  }

  if (trigger === "trade") {
    if (detail.held_item) {
      return `Trade while holding ${formatPokemonName(detail.held_item.name)}`;
    }

    if (detail.trade_species) {
      return `Trade for ${formatPokemonName(detail.trade_species.name)}`;
    }

    return "Trade";
  }

  return titleCase(trigger.replace(/-/g, " "));
}

function validateEvolutionAnswer(
  answer: string,
  extra: ExtraInfo,
): ValidationResult {
  const guesses = parseAnswers(answer);
  const method = normalize(extra.evolutionMethod ?? "");
  const exact = normalize(extra.evolutionDescription ?? "");

  if (!method || !exact) {
    return {
      points: 0,
      message: "This Pokémon has no applicable evolution for this category.",
      correctAnswer: "Not applicable",
       
    };
  }

  const methodAliases: Record<string, string[]> = {
    "level-up": ["level up", "level"],
    "use-item": ["use item", "item"],
    trade: ["trade", "trading"],
    "shed": ["shed"],
    "three-critical-hits": ["critical hits", "three critical hits"],
    "take-damage": ["take damage", "damage"],
    "spin": ["spin"],
    "tower-of-darkness": ["tower of darkness"],
    "tower-of-waters": ["tower of waters"],
  };

  const aliases = methodAliases[method] ?? [method.replace(/-/g, " ")];
  const hasGeneralMethod = guesses.some((guess) =>
    aliases.some((alias) => guess.includes(normalize(alias))),
  );

  const exactMatch =
    guesses.some((guess) => guess === exact) ||
    normalize(answer).includes(exact);

  if (exactMatch) {
    return {
      points: 2,
      message: "Perfect! You identified the exact evolution condition.",
      correctAnswer: extra.evolutionDescription!,
       
    };
  }

  if (hasGeneralMethod) {
    return {
      points: 1,
      message: "Nice! You identified the general evolution method.",
      correctAnswer: extra.evolutionDescription!,
       
    };
  }

  return {
    points: 0,
    message: "That evolution method was not correct.",
    correctAnswer: extra.evolutionDescription!,
     
  };
}

function validateTypeMatch(
  pokemon: PokemonData,
  answer: string,
  allPokemon: PokemonData[],
): ValidationResult {
  const guess = normalize(answer);

  const exactTypes = pokemon.types.map(normalize).sort().join(",");
  
  const actualTyping = pokemon.types.map(titleCase).join(" / ");

  const matchingPokemon = allPokemon.filter(
    (candidate) =>
      candidate.id !== pokemon.id &&
      candidate.types.map(normalize).sort().join(",") === exactTypes,
  );


  if (guess === "unique") {
    if (matchingPokemon.length === 0) {
      return {
        points: 2,
        message: "Perfect! No other Pokémon shares this exact typing.",
        correctAnswer: `${formatPokemonName(pokemon.name)} (${actualTyping})`,
        guessedAnswer: "Unique",
      };
    }

    return {
      points: 0,
      message: "This Pokémon shares its exact typing with other Pokémon.",
      correctAnswer: `${formatPokemonName(pokemon.name)} (${actualTyping}) —  ${
        matchingPokemon
          .slice(0, 1)
          .map((p) => formatPokemonName(p.name))
          .join(", ")
      } shares this typing.`,
      guessedAnswer: "Unique",
    };
  }

  const match = allPokemon.find(
    (candidate) => normalize(candidate.name) === guess,
  );

  if (!match || match.id === pokemon.id) {
    return {
      points: 0,
      message: "Enter the name of a different Pokémon, or answer 'unique' if its typing is unique.",
      correctAnswer:
        matchingPokemon.length > 0
          ? matchingPokemon
              .slice(0, 5)
              .map((p) => formatPokemonName(p.name))
              .join(", ")
          : "Unique Typing",
    };
  }


  const sharedType = match.types.some((type) =>
    pokemon.types.map(normalize).includes(normalize(type)),
  );

  const sameCombination =
    match.types.map(normalize).sort().join(",") === exactTypes;

  const guessedTyping = match.types.map(titleCase).join(" / ");

  if (sameCombination) {
    return {
      points: 2,
      message: "Perfect! You guessed the exact same typing.",
      correctAnswer: `${formatPokemonName(pokemon.name)} (${actualTyping})`,
      guessedAnswer: `${formatPokemonName(match.name)} (${guessedTyping})`,
    };
  }

  if (sharedType) {
    return {
      points: 1,
      message: "Nice! Your guess shares at least one type.",
      correctAnswer: `${formatPokemonName(pokemon.name)} (${actualTyping})`,
      guessedAnswer: `${formatPokemonName(match.name)} (${guessedTyping})`,
    };
  }

  return {
    points: 0,
    message: "That Pokémon doesn't share a type.",
    correctAnswer: `${formatPokemonName(pokemon.name)} (${actualTyping})`,
    guessedAnswer: `${formatPokemonName(match.name)} (${guessedTyping})`,
  };
}

function validateWeaknesses(
  answer: string,
  extra: ExtraInfo,
): ValidationResult {
  const [weaknessPart = "", resistancePart = ""] = answer.split("|");

  const guessedWeaknesses = new Set(
    weaknessPart
      .replace(/^weaknesses=/, "")
      .split(",")
      .map(normalize)
      .filter(Boolean),
  );

  const guessedResistances = new Set(
    resistancePart
      .replace(/^resistances=/, "")
      .split(",")
      .map(normalize)
      .filter(Boolean),
  );

  const weaknesses = (extra.weaknesses ?? []).map(normalize);
  const resistances = (extra.resistances ?? []).map(normalize);

  const correctWeaknessCount = weaknesses.filter((type) =>
    guessedWeaknesses.has(type),
  ).length;

  const correctResistanceCount = resistances.filter((type) =>
    guessedResistances.has(type),
  ).length;

  const hasIncorrectWeakness = [...guessedWeaknesses].some(
    (type) => !weaknesses.includes(type),
  );

  const hasIncorrectResistance = [...guessedResistances].some(
    (type) => !resistances.includes(type),
  );

  const allCorrect =
    !hasIncorrectWeakness &&
    !hasIncorrectResistance &&
    correctWeaknessCount === weaknesses.length &&
    correctResistanceCount === resistances.length;

  const correctAnswer =
    `Weaknesses: ${weaknesses.map(titleCase).join(", ") || "None"}. ` +
    `Resistances and immunities: ${
      resistances.map(titleCase).join(", ") || "None"
    }.`;

  if (allCorrect) {
    return {
      points: 2,
      message: "Perfect! You identified every weakness and resistance correctly.",
      correctAnswer,
       
    };
  }

  if (correctWeaknessCount > 0 && correctResistanceCount > 0) {
    return {
      points: 1,
      message: "Nice! You identified at least one weakness and one resistance.",
      correctAnswer,
       
    };
  }

  return {
    points: 0,
    message: "You need at least one correct weakness and one correct resistance.",
    correctAnswer,
     
  };
}

function getEvolutionData(
  pokemon: PokemonData,
  allPokemon: PokemonData[],
): { description: string; method: string } | null {
  // Evolution details are loaded asynchronously elsewhere.
  // This function is intentionally not used for network requests.
  void pokemon;
  void allPokemon;
  return null;
}

export default function GameScreen({ onHome }: GameScreenProps) {
  const [allPokemon, setAllPokemon] = useState<PokemonData[]>([]);
  const [team, setTeam] = useState<PokemonData[]>([]);
  const [turn, setTurn] = useState(0);
  const [score, setScore] = useState(0);
  const [usedCategories, setUsedCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [answer, setAnswer] = useState("");
  const [result, setResult] = useState<ValidationResult | null>(null);
  const [extraInfo, setExtraInfo] = useState<ExtraInfo>({});
  const [loading, setLoading] = useState(true);
  const [loadingExtra, setLoadingExtra] = useState(false);
  const [error, setError] = useState("");
  const [pokemonSearch, setPokemonSearch] = useState("");
  const [showPokemonSuggestions, setShowPokemonSuggestions] = useState(false);
  const [abilityAnswers, setAbilityAnswers] = useState<string[]>([]);
  const [activeAbilityInput, setActiveAbilityInput] = useState<number | null>(null);
  const [validPokemonSelection, setValidPokemonSelection] = useState(false);
  const [validAbilitySelections, setValidAbilitySelections] = useState<boolean[]>([]);
  const [evolutionAnswer, setEvolutionAnswer] = useState<EvolutionAnswer | null>(null);

  const currentPokemon = team[turn];
  const gameOver = !loading && !error && team.length === 6 && turn >= 6;
  const filteredPokemon = allPokemon
  .filter((pokemon) =>
    pokemon.name
      .toLowerCase()
      .includes(pokemonSearch.trim().toLowerCase())
  )
  .filter((pokemon) => pokemon.id !== currentPokemon?.id)
  .slice(0, 8);

  const allAbilities = [
    ...new Set(
        allPokemon.flatMap((pokemon) => pokemon.abilities)
    ),
    ].sort((a, b) => a.localeCompare(b));

    const getFilteredAbilities = (search: string) => {
    const query = search.trim().toLowerCase();

  if (!query) return [];

  return allAbilities
    .filter((ability) => ability.toLowerCase().includes(query))
    .slice(0, 8);
};

  useEffect(() => {
    let cancelled = false;

    async function loadGame() {
      try {
        setLoading(true);
        setError("");

        const pokemon = await getPokemonData();

        if (cancelled) return;

        setAllPokemon(pokemon);
        setTeam(shuffle(pokemon).slice(0, 6));
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load Pokémon data. Please try again.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadGame();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadCategoryData() {
      if (!currentPokemon || !selectedCategory) return;

      setExtraInfo({});
      setLoadingExtra(false);

      if (
          selectedCategory === "Weaknesses" ||
          selectedCategory === "Resistances"
        ) {
        setLoadingExtra(true);

        try {
          const typeData = await Promise.all(
            currentPokemon.types.map((type) =>
              fetchJson<TypeApiResponse>(
                `https://pokeapi.co/api/v2/type/${normalize(type)}`,
              ),
            ),
          );

          if (cancelled) return;

          const weaknessCounts = new Map<string, number>();
          const resistanceCounts = new Map<string, number>();
          const immunityCounts = new Map<string, number>();

          for (const data of typeData) {
            for (const type of data.damage_relations.double_damage_from) {
              weaknessCounts.set(type.name, (weaknessCounts.get(type.name) ?? 0) + 1);
            }

            for (const type of data.damage_relations.half_damage_from) {
              resistanceCounts.set(type.name, (resistanceCounts.get(type.name) ?? 0) + 1);
            }

            for (const type of data.damage_relations.no_damage_from) {
              immunityCounts.set(type.name, (immunityCounts.get(type.name) ?? 0) + 1);
            }
          }


        const allTypes = [
        "normal", "fire", "water", "electric", "grass", "ice",
        "fighting", "poison", "ground", "flying", "psychic", "bug",
        "rock", "ghost", "dragon", "dark", "steel", "fairy",
        ];

        const effectiveness = new Map<string, number>(
        allTypes.map((type) => [type, 1]),
        );

        for (const data of typeData) {
        for (const type of data.damage_relations.double_damage_from) {
            effectiveness.set(
            type.name,
            (effectiveness.get(type.name) ?? 1) * 2,
            );
        }

        for (const type of data.damage_relations.half_damage_from) {
            effectiveness.set(
            type.name,
            (effectiveness.get(type.name) ?? 1) * 0.5,
            );
        }

        for (const type of data.damage_relations.no_damage_from) {
            effectiveness.set(type.name, 0);
        }
        }

        const weaknesses = allTypes.filter(
        (type) => (effectiveness.get(type) ?? 1) > 1,
        );

        const resistances = allTypes.filter(
        (type) => (effectiveness.get(type) ?? 1) < 1,
        );

        setExtraInfo({ weaknesses, resistances });

        } catch {
          if (!cancelled) {
            setError("Couldn't load type effectiveness. Please try again.");
          }
        } finally {
          if (!cancelled) setLoadingExtra(false);
        }
      }

      if (selectedCategory === "Evolution Method") {
        setLoadingExtra(true);

        try {
          if (!currentPokemon.evolutionChainUrl) {
            setExtraInfo({});
            return;
          }

          const data = await fetchJson<EvolutionResponse>(
            currentPokemon.evolutionChainUrl,
          );

          if (cancelled) return;

          const nodes = collectEvolutionNodes(data.chain);
          const currentName = currentPokemon.name.toLowerCase();

          const currentNode = nodes.find(
            (node) => node.species.name === currentName,
          );

          if (!currentNode) {
            setExtraInfo({});
            return;
          }

          const nextEvolution = currentNode.evolves_to[0];

          if (nextEvolution?.evolution_details[0]) {
            const detail = nextEvolution.evolution_details[0];
            const description = describeEvolution(detail);

            setExtraInfo({
              evolutionDescription: description,
              evolutionMethod: detail.trigger.name,
            });
            return;
          }

          const previousNode = nodes.find((node) =>
            node.evolves_to.some(
              (child) => child.species.name === currentName,
            ),
          );

          const previousDetail = previousNode?.evolves_to
            .find((child) => child.species.name === currentName)
            ?.evolution_details[0];

          if (previousDetail) {
            const description = describeEvolution(previousDetail);

            setExtraInfo({
              evolutionDescription: description,
              evolutionMethod: previousDetail.trigger.name,
            });
          } else {
            setExtraInfo({});
          }
        } catch {
          if (!cancelled) {
            setError("Couldn't load evolution data. Please try again.");
          }
        } finally {
          if (!cancelled) setLoadingExtra(false);
        }
      }
    }

    void loadCategoryData();

    return () => {
      cancelled = true;
    };
  }, [currentPokemon, selectedCategory]);

  function selectCategory(category: Category) {
    if (usedCategories.includes(category) || result) return;

    setSelectedCategory(category);
    setAnswer("");
    setResult(null);
    setPokemonSearch("");
    setShowPokemonSuggestions(false);
    setEvolutionAnswer(null);
  }

  function checkAnswer(answerToCheck: string = answer): ValidationResult {
    if (!currentPokemon || !selectedCategory) {
      return {
        points: 0,
        message: "Select a category first.",
        correctAnswer: "",
         
      };
    }

    switch (selectedCategory) {

      case "Typing":
        return validateTyping(currentPokemon, answer);

      case "Abilities":
        return validateAbilities(currentPokemon, answer);

      case "Highest Stat":
        return validateHighestStat(currentPokemon, answer);

      case "Region":
        return validateRegion(currentPokemon, answer, PROFESSORS);

      case "Type Match":
        return validateTypeMatch(currentPokemon, answer, allPokemon);

      case "Weaknesses":
      case "Resistances": {
        const isWeaknesses = selectedCategory === "Weaknesses";

        const expectedTypes = (
          isWeaknesses
            ? extraInfo.weaknesses
            : extraInfo.resistances
        ) ?? [];

        const guessedTypes = parseAnswers(answerToCheck);
        const expected = expectedTypes.map(normalize);

        const correctCount = new Set(guessedTypes).size > 0
          ? [...new Set(guessedTypes)].filter((type) =>
              expected.includes(type)
            ).length
          : 0;

        const hasIncorrect = guessedTypes.some(
          (type) => !expected.includes(type)
        );

        const allCorrect =
          !hasIncorrect &&
          correctCount === expected.length &&
          new Set(guessedTypes).size === expected.length;

        const points = allCorrect
          ? 2
          : correctCount > 0
            ? 1
            : 0;

        return {
          points,
          message: allCorrect
            ? `Perfect! You identified every ${
                isWeaknesses
                  ? "weakness"
                  : "resistance and immunity"
              } correctly.`
            : points === 1
              ? `Nice! You identified some ${
                  isWeaknesses
                    ? "weaknesses"
                    : "resistances and immunities"
                } correctly.`
              : `You did not identify the ${
                  isWeaknesses
                    ? "weaknesses"
                    : "resistances and immunities"
                } correctly.`,
          correctAnswer: expectedTypes.map(titleCase).join(", ") || "None",
           
        };
      }

      case "Evolution Method":
        return validateEvolutionAnswer(answer, extraInfo);

      default:
        return {
          points: 0,
          message: "This category isn't supported yet.",
          correctAnswer: "",
           
        };
    }
  }

  function submitAnswer() {
    if (!selectedCategory || !answer.trim() || loadingExtra) return;

    const validation = checkAnswer();

    setResult(validation);
    setScore((previous) => previous + validation.points);
    setUsedCategories((previous) => [...previous, selectedCategory]);
  }

  function nextTurn() {
    setTurn((previous) => previous + 1);
    setSelectedCategory(null);
    setAnswer("");
    setResult(null);
    setExtraInfo({});
    setValidPokemonSelection(false);
    setValidAbilitySelections([]);
    setEvolutionAnswer(null);
  }

  function restartGame() {
    setTeam(shuffle(allPokemon).slice(0, 6));
    setTurn(0);
    setScore(0);
    setUsedCategories([]);
    setSelectedCategory(null);
    setAnswer("");
    setResult(null);
    setExtraInfo({});
    setError("");
    setEvolutionAnswer(null);
  }

  if (loading) {
    return (
      <main className="game-page">
        <section className="game-results">
          <p className="game-eyebrow">LOADING POKÉMON</p>
          <h1>Preparing your challenge...</h1>
        </section>
      </main>
    );
  }

  if (error) {
    return (
      <main className="game-page">
        <section className="game-results">
          <p className="game-eyebrow">SOMETHING WENT WRONG</p>
          <h1>Couldn't load the game</h1>
          <p>{error}</p>
          <div className="game-actions">
            <button className="game-primary-button" onClick={restartGame}>
              Try Again
            </button>
            <button className="game-secondary-button" onClick={onHome}>
              Back to Home
            </button>
          </div>
        </section>
      </main>
    );
  }

  if (gameOver) {
    return (
      <main className="game-page">
        <section className="game-results">
          <p className="game-eyebrow">RUN COMPLETE</p>
          <h1>Challenge Complete!</h1>
          <p className="final-score">
            {score} <span>/ 12 points</span>
          </p>
          <p>
            {score === 12
              ? "Mastery! Every answer was perfect."
              : score >= 6
                ? "Challenge complete! You earned enough points to win."
                : "Keep practicing and try for a higher score next time."}
          </p>

          <div className="game-actions">
            <button className="game-primary-button" onClick={restartGame}>
              Play Again
            </button>
            <button className="game-secondary-button" onClick={onHome}>
              Back to Home
            </button>
          </div>
        </section>
      </main>
    );
  }

  if (!currentPokemon) return null;

  const bst = getBaseStatTotal(currentPokemon);
  const highestStat = Math.max(...Object.values(currentPokemon.stats));
  const highestStatNames = (
    Object.entries(currentPokemon.stats) as [PokemonStatName, number][]
  )
    .filter(([, value]) => value === highestStat)
    .map(([name]) => name.replace(/-/g, " "));

  return (
    <main className="game-page">
      <section className="game-content">
        <div className="game-score-panel">
          <div className="turn-progress" aria-label={`Turn ${turn + 1} of 6`}>
            {team.map((pokemon, index) => (
              <span
                key={`${pokemon.id}-${index}`}
                className={`turn-segment ${
                  index < turn
                    ? "turn-complete"
                    : index === turn
                      ? "turn-current"
                      : ""
                }`}
              />
            ))}
          </div>

          <p className="turn-label">TURN {turn + 1} OF 6</p>
        </div>

        <section className="pokemon-panel">
          <p className="game-eyebrow">YOUR POKÉMON</p>

          <div className="pokemon-art">
            <img src={currentPokemon.sprite} alt={currentPokemon.name} />
          </div>

          <h1>{formatPokemonName(currentPokemon.name)}</h1>
        </section>

        <section className="game-category-section">
          <h2>Choose a Category</h2>

          <div className="game-category-grid">
            {CATEGORIES.map((category) => {
              const used = usedCategories.includes(category);
              const selected = selectedCategory === category;

              return (
                <button
                  key={category}
                  className={`game-category-button ${
                    selected ? "category-selected" : ""
                  }`}
                  disabled={used || Boolean(result)}
                  onClick={() => selectCategory(category)}
                >
                  <span>{category}</span>
                  <span className="game-category-status">
                    {used ? "Used" : selected ? "Selected" : "＋"}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {selectedCategory && (
          <section className="answer-panel">
            <h2>{selectedCategory}</h2>
            
        {!result ? (
        selectedCategory === "Typing" ? (
            <TypingAnswer
            disabled={loadingExtra}
            onSubmit={(typingAnswer) => {
                if (!selectedCategory || result) return;

                const validation = validateTyping(
                currentPokemon,
                typingAnswer
                );

                setAnswer(typingAnswer);
                setResult(validation);
                setScore((previous) => previous + validation.points);
                setUsedCategories((previous) => [
                ...previous,
                selectedCategory,
                ]);
            }}
            />
        ) : selectedCategory === "Region" ? (
            <RegionAnswer
            disabled={loadingExtra}
            onSubmit={(regionAnswer) => {
                if (!selectedCategory || result) return;

                const validation = validateRegion(
                currentPokemon,
                regionAnswer,
                PROFESSORS
                );

                setAnswer(regionAnswer);
                setResult(validation);
                setScore((previous) => previous + validation.points);
                setUsedCategories((previous) => [
                ...previous,
                selectedCategory,
                ]);
            }}
            />
        ) : selectedCategory === "Weaknesses" ||
                  selectedCategory === "Resistances" ? (
                    <WeaknessesAnswer
                      key={selectedCategory}
                      category={selectedCategory}
                      disabled={loadingExtra}
                      selectionLimit={
                        selectedCategory === "Weaknesses"
                          ? (extraInfo.weaknesses?.length ?? 0)
                          : (extraInfo.resistances?.length ?? 0)
                      }
                      onSubmit={(typeAnswer) => {
                        if (!selectedCategory || result || loadingExtra) return;

                        const validation = checkAnswer(typeAnswer);

                        setAnswer(typeAnswer);
                        setResult(validation);
                        setScore((previous) => previous + validation.points);
                        setUsedCategories((previous) => [
                          ...previous,
                          selectedCategory,
                        ]);
                      }}
                    />
                ) : selectedCategory === "Evolution Method" ? (
                <EvolutionMethodAnswer
                  key={`${currentPokemon.id}-${turn}`}
                  disabled={loadingExtra || result !== null}
                  onSubmit={(submittedAnswer) => {
                    setEvolutionAnswer(submittedAnswer);
                  }}
                />
                ) : (
                <form
                onSubmit={(event) => {
                  event.preventDefault();

                  if (
                    selectedCategory === "Type Match" &&
                    !validPokemonSelection
                  ) {
                    return;
                  }

                  if (
                    selectedCategory === "Abilities" &&
                    abilityAnswers.some(
                      (ability, index) =>
                        ability.trim() !== "" && !validAbilitySelections[index]
                    )
                  ) {
                    return;
                  }

                  submitAnswer();
                }}
                >
                <label>
                {selectedCategory === "Type Match"
                  ? 'Enter a Pokémon with the same typing, or answer "Unique" if it does not share its typing with any Pokémon.'
                  : selectedCategory === "Abilities"
                    ? "Enter the Pokémon's abilities."
                    : "Enter your answer."}
                </label>

                {selectedCategory === "Abilities" ? (
                  <div className="ability-inputs">
                    {currentPokemon.abilities.map((_, index) => {
                      const search = abilityAnswers[index] ?? "";
                      const filteredAbilities = getFilteredAbilities(search);

                      return (
                        <div className="pokemon-autocomplete" key={index}>
                          <label htmlFor={`ability-answer-${index}`}>
                            Ability {index + 1}
                          </label>

                          <input
                            id={`ability-answer-${index}`}
                            value={search}
                            onChange={(event) => {
                              const value = event.target.value;

                              setAbilityAnswers((previous) => {
                                const updated = [...previous];
                                updated[index] = value;
                                setAnswer(updated.join(", "));
                                return updated;
                              });

                              setValidAbilitySelections((previous) => {
                                const updated = [...previous];
                                updated[index] = false;
                                return updated;
                              });

                              setActiveAbilityInput(index);
                            }}
                            onFocus={() => setActiveAbilityInput(index)}
                            onBlur={() => {
                              window.setTimeout(() => {
                                setActiveAbilityInput((active) =>
                                  active === index ? null : active
                                );
                              }, 150);
                            }}
                            placeholder="Start typing an ability..."
                            autoComplete="off"
                            required
                          />

                          {activeAbilityInput === index &&
                            search.trim() !== "" &&
                            filteredAbilities.length > 0 && (
                              <ul className="pokemon-suggestions">
                                {filteredAbilities.map((suggestion) => (
                                  <li key={suggestion}>
                                    <button
                                      type="button"
                                      onMouseDown={(event) => event.preventDefault()}
                                      onClick={() => {
                                        setAbilityAnswers((previous) => {
                                          const updated = [...previous];
                                          updated[index] = suggestion;
                                          setAnswer(updated.join(", "));
                                          return updated;
                                        });

                                        setValidAbilitySelections((previous) => {
                                          const updated = [...previous];
                                          updated[index] = true;
                                          return updated;
                                        });

                                        setActiveAbilityInput(null);
                                      }}
                                    >
                                      {formatPokemonName(suggestion)}
                                    </button>
                                  </li>
                                ))}
                              </ul>
                            )}
                        </div>
                      );
                    })}
                  </div>
                ) : selectedCategory === "Type Match" ? (
                  <div className="pokemon-autocomplete">
                    <input
                      id="pokemon-answer"
                      value={pokemonSearch}
                      onChange={(event) => {
                        const value = event.target.value;
                        setPokemonSearch(value);
                        setAnswer(value);
                        setValidPokemonSelection(false);
                        setShowPokemonSuggestions(true);
                      }}
                      onFocus={() => setShowPokemonSuggestions(true)}
                      onBlur={() => {
                        window.setTimeout(() => {
                          setShowPokemonSuggestions(false);
                        }, 150);
                      }}
                      placeholder="Search Pokémon..."
                      autoComplete="off"
                      required
                    />

                    {showPokemonSuggestions && pokemonSearch.trim() !== "" && (
                      <ul className="pokemon-suggestions">
                        {filteredPokemon.map((pokemon) => (
                          <li key={pokemon.id}>
                            <button
                              type="button"
                              onMouseDown={(event) => event.preventDefault()}
                              onClick={() => {
                                setPokemonSearch(pokemon.name);
                                setAnswer(pokemon.name);
                                setValidPokemonSelection(true);
                                setShowPokemonSuggestions(false);
                              }}
                            >
                              {formatPokemonName(pokemon.name)}
                            </button>
                          </li>
                        ))}

                        {"unique typing".includes(pokemonSearch.trim().toLowerCase()) ||
                        "unique".includes(pokemonSearch.trim().toLowerCase()) ? (
                          <li>
                            <button
                              type="button"
                              onMouseDown={(event) => event.preventDefault()}
                              onClick={() => {
                                setPokemonSearch("unique");
                                setAnswer("unique");
                                setValidPokemonSelection(true);
                                setShowPokemonSuggestions(false);
                              }}
                            >
                              Unique
                            </button>
                          </li>
                        ) : null}
                      </ul>
                    )}
                  </div>
                ):(
                <input
                    id="pokemon-answer"
                    value={answer}
                    onChange={(event) => setAnswer(event.target.value)}
                    placeholder={`Your answer for ${selectedCategory.toLowerCase()}...`}
                    autoFocus
                    required
                />
                )}

                {loadingExtra && (
                    <p className="game-muted">Loading category details...</p>
                )}

                <div className="game-actions">
                    <button
                    type="button"
                    className="game-secondary-button"
                    onClick={() => {
                        setSelectedCategory(null);
                        setAnswer("");
                        setExtraInfo({});
                    }}
                    >
                    Cancel
                    </button>

                    <button
                    type="submit"
                    className="game-primary-button"
                    disabled={!answer.trim() || loadingExtra}
                    >
                    Submit Answer
                    </button>
                </div>
                </form>
            )
            ) : (
            <div className="grading-panel">
              <p>
                Your answer:{" "}
                <strong
                  className={
                    result.points === 2
                      ? "answer-perfect"
                      : result.points === 1
                        ? "answer-correct"
                        : "answer-incorrect"
                  }
                >
                  {answer}
                </strong>
              </p>

              <p>{result.message}</p>

              <p>
                Answer: <strong>{result.correctAnswer}</strong>
              </p>

              {result.guessedAnswer && (
                <p>
                  Your guess: <strong>{result.guessedAnswer}</strong>
                </p>
              )}

              <p>
                Points earned: <strong>{result.points} / 2</strong>
              </p>

              <div className="game-actions">
                <button className="game-primary-button" onClick={nextTurn}>
                  {turn === 5 ? "View Results" : "Next Pokémon"}
                </button>
              </div>
            </div>
            )}
          </section>
        )}
      </section>
    </main>
  );
}
