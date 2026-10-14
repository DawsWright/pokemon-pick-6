
import { useState, type FormEvent } from "react";

const TYPES = [
  "Normal", "Fire", "Water", "Electric", "Grass", "Ice",
  "Fighting", "Poison", "Ground", "Flying", "Psychic", "Bug",
  "Rock", "Ghost", "Dragon", "Dark", "Steel", "Fairy",
];

type WeaknessesAnswerProps = {
  onSubmit: (answer: string) => void;
  disabled?: boolean;
};

function typeClass(type: string) {
  return `type-choice type-${type.toLowerCase()}`;
}

export default function WeaknessesAnswer({
  onSubmit,
  disabled = false,
}: WeaknessesAnswerProps) {
  const [weaknesses, setWeaknesses] = useState<string[]>([]);
  const [resistances, setResistances] = useState<string[]>([]);

  function toggleType(
    type: string,
    selected: string[],
    setSelected: (types: string[]) => void,
  ) {
    setSelected(
      selected.includes(type)
        ? selected.filter((item) => item !== type)
        : [...selected, type],
    );
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    // Keep the two columns separate for answer validation.
    onSubmit(
      `weaknesses=${weaknesses.join(",")}|resistances=${resistances.join(",")}`,
    );
  }

  return (
    <form className="typing-answer" onSubmit={handleSubmit}>
      <p className="game-muted">
        Select all types that are super effective against this Pokémon
        and all types it resists or is immune to. You may leave either
        column empty.
      </p>

      <div className="typing-columns">
        <fieldset className="typing-column">
          <legend>Weaknesses</legend>
          <div className="type-button-grid">
            {TYPES.map((type) => (
              <button
                key={type}
                type="button"
                className={`${typeClass(type)} ${
                  weaknesses.includes(type) ? "type-choice-selected" : ""
                }`}
                aria-pressed={weaknesses.includes(type)}
                disabled={disabled}
                onClick={() =>
                  toggleType(type, weaknesses, setWeaknesses)
                }
              >
                {type}
              </button>
            ))}
          </div>
          <p className="game-muted">
            Selected: {weaknesses.length}
          </p>
        </fieldset>

        <fieldset className="typing-column">
          <legend>Resistances &amp; Immunities</legend>
          <div className="type-button-grid">
            {TYPES.map((type) => (
              <button
                key={type}
                type="button"
                className={`${typeClass(type)} ${
                  resistances.includes(type) ? "type-choice-selected" : ""
                }`}
                aria-pressed={resistances.includes(type)}
                disabled={disabled}
                onClick={() =>
                  toggleType(type, resistances, setResistances)
                }
              >
                {type}
              </button>
            ))}
          </div>
          <p className="game-muted">
            Selected: {resistances.length}
          </p>
        </fieldset>
      </div>

      <div className="game-actions">
        <button
          type="submit"
          className="game-primary-button"
          disabled={disabled}
        >
          Submit Weaknesses
        </button>
      </div>
    </form>
  );
}
