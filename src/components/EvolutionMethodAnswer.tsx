import { useState } from "react";

export type EvolutionDirection =
  | "evolves-into"
  | "evolves-from";

export type EvolutionMethod =
  | "level-up"
  | "level-up-condition"
  | "evolution-item"
  | "trade"
  | "misc";

export type EvolutionAnswer = {
  direction: EvolutionDirection;
  method: EvolutionMethod;
  level?: number;
  gender?: string;
  region?: string;
  conditionType?: string;
  conditionDetail?: string;
  secondaryCondition?: string;
  item?: string;
  tradeWith?: "nothing" | "pokemon" | "item";
  tradePokemon?: string;
  tradeItem?: string;
  games?: string[];
  miscOption?: string;
};

type Props = {
  disabled?: boolean;
  onSubmit: (answer: EvolutionAnswer) => void;
};

const METHODS: { value: EvolutionMethod; label: string }[] = [
  { value: "level-up", label: "Level Up" },
  {
    value: "level-up-condition",
    label: "Level Up + Condition",
  },
  { value: "evolution-item", label: "Evolution Item" },
  { value: "trade", label: "Trade" },
  { value: "misc", label: "Misc" },
];

const ITEMS = [
  "Fire Stone",
  "Water Stone",
  "Thunder Stone",
  "Leaf Stone",
  "Moon Stone",
  "Sun Stone",
  "Shiny Stone",
  "Dusk Stone",
  "Dawn Stone",
  "Ice Stone",
  "Metal Coat",
  "King's Rock",
  "Dragon Scale",
  "Upgrade",
  "Dubious Disc",
  "Protector",
  "Electirizer",
  "Magmarizer",
  "Razor Claw",
  "Razor Fang",
  "Oval Stone",
  "Sweet Apple",
  "Tart Apple",
  "Syrupy Apple",
  "Cracked Pot",
  "Chipped Pot",
  "Galarica Cuff",
  "Galarica Wreath",
  "Auspicious Armor",
  "Malicious Armor",
  "Unremarkable Teacup",
  "Masterpiece Teacup",
  "Black Augurite",
  "Metal Alloy",
  "Peat Block",
  "Scroll of Darkness",
  "Scroll of Waters",
];

const CONDITIONS = [
  { value: "knows-move", label: "Knows a specific move" },
  { value: "friendship", label: "Friendship" },
  { value: "walk-steps", label: "Walk 1,000 steps (GO mode)" },
  { value: "time-of-day", label: "Time of day" },
  { value: "stat-based", label: "Stat-based" },
  { value: "location", label: "Location" },
  { value: "game-based", label: "Game-based" },
  { value: "held-item", label: "Held item" },
];

const GAMES = [
  "Red / Blue / Yellow",
  "Gold / Silver / Crystal",
  "Ruby / Sapphire / Emerald",
  "Diamond / Pearl / Platinum",
  "Black / White",
  "X / Y",
  "Sun / Moon",
  "Sword / Shield",
  "Brilliant Diamond / Shining Pearl",
  "Scarlet / Violet",
  "Pokémon GO",
];

export default function EvolutionMethodAnswer({
  disabled = false,
  onSubmit,
}: Props) {
  const [direction, setDirection] =
    useState<EvolutionDirection>("evolves-into");
  const [method, setMethod] =
    useState<EvolutionMethod | "">("");

  const [level, setLevel] = useState("");
  const [gender, setGender] = useState("");
  const [region, setRegion] = useState("");
  const [conditionType, setConditionType] = useState("");
  const [conditionDetail, setConditionDetail] = useState("");
  const [secondaryCondition, setSecondaryCondition] = useState("");
  const [item, setItem] = useState("");
  const [tradeWith, setTradeWith] =
    useState<"nothing" | "pokemon" | "item">("nothing");
  const [tradePokemon, setTradePokemon] = useState("");
  const [tradeItem, setTradeItem] = useState("");
  const [games, setGames] = useState<string[]>([]);
  const [miscOption, setMiscOption] = useState("");

  function submit() {
    if (!method) return;

    const result: EvolutionAnswer = {
      direction,
      method,
    };

    if (method === "level-up") {
      result.level = Number(level);
      if (gender) result.gender = gender;
    }

    if (method === "level-up-condition") {
      result.conditionType = conditionType;
      result.conditionDetail = conditionDetail;

      if (secondaryCondition) {
        result.secondaryCondition = secondaryCondition;
      }

      if (conditionType === "held-item") {
        result.item = item;
      }

      if (conditionType === "game-based") {
        result.games = games;
      }
    }

    if (method === "evolution-item") {
      result.item = item;
      if (gender) result.gender = gender;
      if (region) result.region = region;
    }

    if (method === "trade") {
      result.tradeWith = tradeWith;

      if (tradeWith === "pokemon") {
        result.tradePokemon = tradePokemon;
      }

      if (tradeWith === "item") {
        result.tradeItem = tradeItem;
      }
    }

    if (method === "misc") {
      result.miscOption = miscOption;
    }

    onSubmit(result);
  }

  const canSubmit =
    !disabled &&
    Boolean(method) &&
    (method !== "level-up" ||
      (level !== "" &&
        Number(level) >= 0 &&
        Number(level) <= 99)) &&
    (method !== "level-up-condition" ||
      Boolean(conditionType && conditionDetail)) &&
    (method !== "evolution-item" || Boolean(item)) &&
    (method !== "trade" ||
      tradeWith === "nothing" ||
      (tradeWith === "pokemon" && Boolean(tradePokemon)) ||
      (tradeWith === "item" && Boolean(tradeItem))) &&
    (method !== "misc" || Boolean(miscOption));

  return (
    <form
      className="evolution-form"
      onSubmit={(event) => {
        event.preventDefault();
        if (canSubmit) submit();
      }}
    >
      <fieldset disabled={disabled}>
        <legend>Evolution direction</legend>

        <div className="evolution-choice-row">
          <label>
            <input
              type="radio"
              name="evolution-direction"
              checked={direction === "evolves-into"}
              onChange={() => setDirection("evolves-into")}
            />
            Evolves into
          </label>

          <label>
            <input
              type="radio"
              name="evolution-direction"
              checked={direction === "evolves-from"}
              onChange={() => setDirection("evolves-from")}
            />
            Evolves from
          </label>
        </div>

        <label htmlFor="evolution-method">Evolution method</label>
        <select
          id="evolution-method"
          value={method}
          onChange={(event) =>
            setMethod(event.target.value as EvolutionMethod | "")
          }
          required
        >
          <option value="">Choose a method...</option>
          {METHODS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        {method === "level-up" && (
          <div className="evolution-fields">
            <label htmlFor="evolution-level">Required level</label>
            <input
              id="evolution-level"
              type="number"
              min={0}
              max={99}
              value={level}
              onChange={(event) => setLevel(event.target.value)}
              placeholder="Enter level (0–99)"
              required
            />

            <label htmlFor="level-gender">
              Gender requirement (if applicable)
            </label>
            <select
              id="level-gender"
              value={gender}
              onChange={(event) => setGender(event.target.value)}
            >
              <option value="">No gender requirement</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>
        )}

        {method === "level-up-condition" && (
          <div className="evolution-fields">
            <label htmlFor="evolution-condition">
              Condition type
            </label>
            <select
              id="evolution-condition"
              value={conditionType}
              onChange={(event) => {
                setConditionType(event.target.value);
                setConditionDetail("");
                setSecondaryCondition("");
                setItem("");
                setGames([]);
              }}
              required
            >
              <option value="">Choose a condition...</option>
              {CONDITIONS.map((condition) => (
                <option key={condition.value} value={condition.value}>
                  {condition.label}
                </option>
              ))}
            </select>

            {conditionType === "knows-move" && (
              <>
                <label htmlFor="condition-detail">Required move</label>
                <input
                  id="condition-detail"
                  value={conditionDetail}
                  onChange={(event) =>
                    setConditionDetail(event.target.value)
                  }
                  placeholder="Enter move name"
                  required
                />
              </>
            )}

            {conditionType === "friendship" && (
              <label>
                <input
                  type="checkbox"
                  checked={conditionDetail === "time-of-day"}
                  onChange={(event) =>
                    setConditionDetail(
                      event.target.checked ? "time-of-day" : "any",
                    )
                  }
                />
                Also requires a specific time of day
              </label>
            )}

            {conditionType === "walk-steps" && (
              <p>Walk 1,000 steps in Pokémon GO mode.</p>
            )}

            {conditionType === "time-of-day" && (
              <>
                <label htmlFor="condition-detail">Time of day</label>
                <select
                  id="condition-detail"
                  value={conditionDetail}
                  onChange={(event) =>
                    setConditionDetail(event.target.value)
                  }
                  required
                >
                  <option value="">Choose time...</option>
                  <option value="day">Day</option>
                  <option value="night">Night</option>
                  <option value="dusk">Dusk</option>
                </select>
                <label htmlFor="secondary-condition">
                  Additional condition (optional)
                </label>
                <input
                  id="secondary-condition"
                  value={secondaryCondition}
                  onChange={(event) =>
                    setSecondaryCondition(event.target.value)
                  }
                  placeholder="e.g. high friendship"
                />
              </>
            )}

            {conditionType === "stat-based" && (
              <>
                <label htmlFor="condition-detail">Stat comparison</label>
                <select
                  id="condition-detail"
                  value={conditionDetail}
                  onChange={(event) =>
                    setConditionDetail(event.target.value)
                  }
                  required
                >
                  <option value="">Choose comparison...</option>
                  <option value="attack-greater">
                    Attack greater than Defense
                  </option>
                  <option value="attack-equal">
                    Attack equal to Defense
                  </option>
                  <option value="attack-less">
                    Attack less than Defense
                  </option>
                </select>
              </>
            )}

            {conditionType === "location" && (
              <>
                <label htmlFor="condition-detail">Location</label>
                <input
                  id="condition-detail"
                  value={conditionDetail}
                  onChange={(event) =>
                    setConditionDetail(event.target.value)
                  }
                  placeholder="Enter location"
                  required
                />
              </>
            )}

            {conditionType === "game-based" && (
              <div className="evolution-fields">
                <span>Applicable games (select all that apply)</span>
                {GAMES.map((game) => (
                  <label key={game}>
                    <input
                      type="checkbox"
                      checked={games.includes(game)}
                      onChange={(event) =>
                        setGames((previous) =>
                          event.target.checked
                            ? [...previous, game]
                            : previous.filter((value) => value !== game),
                        )
                      }
                    />
                    {game}
                  </label>
                ))}
                <input
                  aria-label="Game-based condition details"
                  value={conditionDetail}
                  onChange={(event) =>
                    setConditionDetail(event.target.value)
                  }
                  placeholder="Evolution requirement"
                  required
                />
              </div>
            )}

            {conditionType === "held-item" && (
              <>
                <label htmlFor="condition-item">Held item</label>
                <select
                  id="condition-item"
                  value={item}
                  onChange={(event) => {
                    setItem(event.target.value);
                    setConditionDetail(event.target.value);
                  }}
                  required
                >
                  <option value="">Choose held item...</option>
                  {ITEMS.map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
                <label htmlFor="secondary-condition">
                  Additional condition (optional)
                </label>
                <input
                  id="secondary-condition"
                  value={secondaryCondition}
                  onChange={(event) =>
                    setSecondaryCondition(event.target.value)
                  }
                  placeholder="e.g. evolve at night"
                />
              </>
            )}
          </div>
        )}

        {method === "evolution-item" && (
          <div className="evolution-fields">
            <label htmlFor="evolution-item">Evolution item</label>
            <select
              id="evolution-item"
              value={item}
              onChange={(event) => setItem(event.target.value)}
              required
            >
              <option value="">Choose an item...</option>
              {ITEMS.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>

            <label htmlFor="item-gender">Gender requirement</label>
            <select
              id="item-gender"
              value={gender}
              onChange={(event) => setGender(event.target.value)}
            >
              <option value="">No gender requirement</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>

            <label htmlFor="item-region">Regional form requirement</label>
            <select
              id="item-region"
              value={region}
              onChange={(event) => setRegion(event.target.value)}
            >
              <option value="">No regional requirement</option>
              <option value="alola">Alolan</option>
              <option value="galar">Galarian</option>
              <option value="hisui">Hisuian</option>
              <option value="paldea">Paldean</option>
            </select>
          </div>
        )}

        {method === "trade" && (
          <div className="evolution-fields">
            <label htmlFor="trade-with">Trade with...</label>
            <select
              id="trade-with"
              value={tradeWith}
              onChange={(event) =>
                setTradeWith(
                  event.target.value as "nothing" | "pokemon" | "item",
                )
              }
            >
              <option value="nothing">No special requirement</option>
              <option value="pokemon">Specific Pokémon</option>
              <option value="item">Held item</option>
            </select>

            {tradeWith === "pokemon" && (
              <>
                <label htmlFor="trade-pokemon">Pokémon</label>
                <input
                  id="trade-pokemon"
                  value={tradePokemon}
                  onChange={(event) => setTradePokemon(event.target.value)}
                  placeholder="Enter Pokémon name"
                  required
                />
              </>
            )}

            {tradeWith === "item" && (
              <>
                <label htmlFor="trade-item">Held item</label>
                <select
                  id="trade-item"
                  value={tradeItem}
                  onChange={(event) => setTradeItem(event.target.value)}
                  required
                >
                  <option value="">Choose an item...</option>
                  {ITEMS.map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </>
            )}
          </div>
        )}

        {method === "misc" && (
          <div className="evolution-fields">
            <label htmlFor="misc-option">Special evolution method</label>
            <select
              id="misc-option"
              value={miscOption}
              onChange={(event) => setMiscOption(event.target.value)}
              required
            >
              <option value="">Choose a method...</option>
              <option value="critical-hits">
                Galarian Farfetch'd — land critical hits
              </option>
              <option value="take-damage">
                Galarian Yamask — take damage
              </option>
              <option value="spin">
                Milcery — spin while holding a sweet
              </option>
              <option value="transfer-candy">
                Meltan — transfer using Pokémon GO Candy
              </option>
            </select>
          </div>
        )}
      </fieldset>

      <div className="game-actions">
        <button
          type="submit"
          className="game-primary-button"
          disabled={!canSubmit}
        >
          Submit Evolution Answer
        </button>
      </div>
    </form>
  );
}
