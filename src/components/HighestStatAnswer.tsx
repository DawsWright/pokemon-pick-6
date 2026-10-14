
import { useState } from "react";
import type { PokemonData, PokemonStatName } from "../data/pokeApi";

type HighestStatAnswerProps = {
  pokemon: PokemonData;
  onSubmit: (answer: string) => void;
};

const STATS: { key: PokemonStatName; label: string }[] = [
  { key: "hp", label: "HP" },
  { key: "attack", label: "Attack" },
  { key: "defense", label: "Defense" },
  { key: "special-attack", label: "Special Attack" },
  { key: "special-defense", label: "Special Defense" },
  { key: "speed", label: "Speed" },
];

export default function HighestStatAnswer({
  onSubmit,
}: HighestStatAnswerProps) {
  const [selectedStat, setSelectedStat] =
    useState<PokemonStatName | null>(null);
  const [value, setValue] = useState("");

  function handleValueChange(input: string) {
    // Keep only digits and allow at most three of them.
    setValue(input.replace(/\D/g, "").slice(0, 3));
  }

  function handleSubmit() {
    if (!selectedStat || value === "") return;

    onSubmit(`${selectedStat}, ${value}`);
  }

  return (
    <div className="highest-stat-answer">
      <p>Select the stat you think is highest:</p>

      <div className="highest-stat-buttons">
        {STATS.map((stat) => (
          <button
            key={stat.key}
            type="button"
            className={
              selectedStat === stat.key
                ? "highest-stat-button selected"
                : "highest-stat-button"
            }
            aria-pressed={selectedStat === stat.key}
            onClick={() => setSelectedStat(stat.key)}
          >
            {stat.label}
          </button>
        ))}
      </div>

      <label htmlFor="highest-stat-value">
        Enter its base stat value:
      </label>

      <input
        id="highest-stat-value"
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        maxLength={3}
        value={value}
        onChange={(event) => handleValueChange(event.target.value)}
        placeholder=""
        autoComplete="off"
      />

      <button
        type="button"
        onClick={handleSubmit}
        disabled={!selectedStat || value === ""}
      >
        Submit Answer
      </button>
    </div>
  );
}
