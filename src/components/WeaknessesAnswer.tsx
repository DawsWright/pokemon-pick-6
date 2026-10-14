import { useState, type FormEvent } from "react";

const TYPES = [
  "Normal", "Fire", "Water", "Electric", "Grass", "Ice",
  "Fighting", "Poison", "Ground", "Flying", "Psychic", "Bug",
  "Rock", "Ghost", "Dragon", "Dark", "Steel", "Fairy",
];

type WeaknessesAnswerProps = {
  onSubmit: (answer: string) => void;
  disabled?: boolean;
  category: "Weaknesses" | "Resistances";
  selectionLimit: number;
};

function typeClass(type: string) {
  return `type-choice type-${type.toLowerCase()}`;
}

export default function WeaknessesAnswer({
  onSubmit,
  disabled = false,
  category,
  selectionLimit,
}: WeaknessesAnswerProps) {
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);

  const isWeaknesses = category === "Weaknesses";

  const title = isWeaknesses
    ? "Weaknesses"
    : "Resistances & Immunities";

  const description = isWeaknesses
    ? "Select all types that are super effective against this Pokémon."
    : "Select all types this Pokémon resists or is immune to.";

  function toggleType(type: string) {
    setSelectedTypes((current) => {
      if (current.includes(type)) {
        return current.filter((item) => item !== type);
      }

      if (current.length >= selectionLimit) {
        return current;
      }

      return [...current, type];
    });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit(selectedTypes.join(","));
  }

  return (
    <form className="typing-answer" onSubmit={handleSubmit}>
      <p className="game-muted">
        {description} Do not consider abilities (for example, Levitate
        does not make a Pokémon immune to Ground moves).
      </p>

      <fieldset className="typing-column">
        <legend>{title}</legend>

        <div className="type-button-grid">
          {TYPES.map((type) => (
            <button
              key={type}
              type="button"
              className={`${typeClass(type)} ${
                selectedTypes.includes(type)
                  ? "type-choice-selected"
                  : ""
              }`}
              aria-pressed={selectedTypes.includes(type)}
              disabled={disabled}
              onClick={() => toggleType(type)}
            >
              {type}
            </button>
          ))}
        </div>

      <p className="game-muted">
        Selected: {selectedTypes.length} / {selectionLimit}
      </p>
      </fieldset>

      <div className="game-actions">
        <button
          type="submit"
          className="game-primary-button"
          disabled={disabled}
        >
          Submit {isWeaknesses ? "Weaknesses" : "Resistances"}
        </button>
      </div>
    </form>
  );
}