
import { useState, type FormEvent } from "react";

const REGIONS = [
  "Kanto",
  "Johto",
  "Hoenn",
  "Sinnoh",
  "Unova",
  "Kalos",
  "Alola",
  "Galar",
  "Hisui",
  "Paldea",
];

type RegionAnswerProps = {
  onSubmit: (answer: string) => void;
  disabled?: boolean;
};

export default function RegionAnswer({
  onSubmit,
  disabled = false,
}: RegionAnswerProps) {
  const [region, setRegion] = useState("");
  const [professor, setProfessor] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!region || !professor.trim()) return;

    onSubmit(`${region}, ${professor.trim()}`);
  }

  return (
    <form className="region-answer" onSubmit={handleSubmit}>
      <p className="game-muted">
        Select the Pokémon's region and enter its associated professor.
      </p>

      <div className="region-columns">
        <fieldset className="region-column">
          <legend>Region</legend>

          <div className="region-button-grid">
            {REGIONS.map((item) => (
              <button
                key={item}
                type="button"
                className={`region-choice ${
                  region === item ? "region-choice-selected" : ""
                }`}
                aria-pressed={region === item}
                disabled={disabled}
                onClick={() => setRegion(item)}
              >
                {item}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="region-column">
          <legend>Professor</legend>

          <label className="region-professor-label" htmlFor="region-professor">
            Professor's name
          </label>

          <input
            id="region-professor"
            className="region-professor-input"
            type="text"
            value={professor}
            onChange={(event) => setProfessor(event.target.value)}
            placeholder=""
            disabled={disabled}
            autoComplete="off"
            required
          />

          <p className="game-muted">
            Enter the professor associated with your selected region.
          </p>
        </fieldset>
      </div>

      <div className="game-actions">
        <button
          type="submit"
          className="game-primary-button"
          disabled={disabled || !region || !professor.trim()}
        >
          Submit Region
        </button>
      </div>
    </form>
  );
}
