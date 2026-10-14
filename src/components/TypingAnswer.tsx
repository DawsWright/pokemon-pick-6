
import { useState, type FormEvent } from "react";

const TYPES = [
  "Normal",
  "Fire",
  "Water",
  "Electric",
  "Grass",
  "Ice",
  "Fighting",
  "Poison",
  "Ground",
  "Flying",
  "Psychic",
  "Bug",
  "Rock",
  "Ghost",
  "Dragon",
  "Dark",
  "Steel",
  "Fairy",
];

type TypingAnswerProps = {
  onSubmit: (answer: string) => void;
  disabled?: boolean;
};

function typeClass(type: string) {
  return `type-choice type-${type.toLowerCase()}`;
}

export default function TypingAnswer({
  onSubmit,
  disabled = false,
}: TypingAnswerProps) {
  const [primaryType, setPrimaryType] = useState("");
  const [secondaryType, setSecondaryType] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!primaryType || !secondaryType) return;

    const answer =
      secondaryType === "None"
        ? primaryType
        : `${primaryType}, ${secondaryType}`;

    onSubmit(answer);
  }

  return (
    <form className="typing-answer" onSubmit={handleSubmit}>
      <p className="game-muted">
        Choose one type from each column (order does not matter).
        Select None in the second column if the Pokémon has only one type.
      </p>

      <div className="typing-columns">
        <fieldset className="typing-column">
          <legend>Primary Type</legend>

          <div className="type-button-grid">
            {TYPES.map((type) => (
              <button
                key={type}
                type="button"
                className={`${typeClass(type)} ${
                  primaryType === type ? "type-choice-selected" : ""
                }`}
                aria-pressed={primaryType === type}
                disabled={disabled || secondaryType === type}
                onClick={() => setPrimaryType(type)}
              >
                {type}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="typing-column">
          <legend>Secondary Type</legend>

          <div className="type-button-grid">
            {TYPES.map((type) => (
              <button
                key={type}
                type="button"
                className={`${typeClass(type)} ${
                  secondaryType === type ? "type-choice-selected" : ""
                }`}
                aria-pressed={secondaryType === type}
                disabled={disabled || primaryType === type}
                onClick={() => setSecondaryType(type)}
              >
                {type}
              </button>
            ))}

                        <button
              type="button"
              className={`type-choice type-none ${
                secondaryType === "None" ? "type-choice-selected" : ""
              }`}
              aria-pressed={secondaryType === "None"}
              disabled={disabled}
              onClick={() => setSecondaryType("None")}
            >
              None
            </button>
          </div>
        </fieldset>
      </div>

      <div className="game-actions">
        <button
          type="submit"
          className="game-primary-button"
          disabled={disabled || !primaryType || !secondaryType}
        >
          Submit Typing
        </button>
      </div>
    </form>
  );
}
