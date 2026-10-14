
import { useState } from "react";
import "./App.css";
import GameScreen from "./components/GameScreen";


const categoryRules = [

  {
    name: "Typing",
    description: "Identify the Pokémon's types.",
    partial: "You correctly name one of its types.",
    perfect: "You correctly name both types, or the one type for a single-type Pokémon.",
    example: "For Charizard, guessing Fire earns 1 point. Guessing Fire and Flying earns 2 points.",
  },
  {
    name: "Region",
    description: "Identify the region where the Pokémon originates from.",
    partial: "You correctly name its region of origin.",
    perfect: "You correctly name the region and its associated Pokémon Professor.",
    example: "For Snorlax, naming Kanto gives 1 point. Naming Kanto then naming Oak gives 2 points. Regional variants are considered to be from their variant region (Example: Alolan Sandshrew is from Alola, not Kanto). Mega Pokémon are from their base form's region (Example: Mega Lucario is from Sinnoh, not Kalos). For simplicity, Meltan and Melmetal are considered to be from Generation 7 (Alola).",
  },
  {
    name: "Weaknesses",
    description: "Identify the Pokémon's type weaknesses and resistances (ignoring abilities).",
    partial: "You name at least one correct weakness and one correct resistance.",
    perfect: "You correctly name all weaknesses and resistances.",
    example: "For Squirtle, naming Weakness = Grass and Resistance = Fire, Water grants 1 point. Naming Weakness = Grass, Electric and Resistance = Fire, Water, Steel, Ice grants 2 points. Immunities are considered resistances, and abilities are not considered. So Eelektross would have a weakness to Ground, despite having the ability Levitate.",
  },
  {
    name: "Type Match",
    description: "Name another Pokémon that shares a type with the revealed Pokémon.",
    partial: "Your answer shares at least one type.",
    perfect: "Your answer has the exact same type combination.",
    example: "For Gengar, naming Bulbasaur gives 1 point. Naming Haunter gives 2 points. If no other Pokémon shares the same type combination, select Unique Typing for 2 points."
  },
  {
    name: "Highest Stat",
    description: "Identify the Pokémon's highest base stat.",
    partial: "You correctly name the Pokémon's highest base stat.",
    perfect: "You name the Pokémon's highest base stat and its exact value.",
    example: "For Pikachu, guessing Speed gives 1 point. Guessing Speed = 90 gives 2 points. If a Pokémon's highest stat is a tie between multiple stats (Example: Mismagius), any of the stats are a valid answer.",
  },
  {
    name: "Abilities",
    description: "Name the Pokémon's possible abilities.",
    partial: "You correctly name one ability the Pokémon can have.",
    perfect: "You correctly name all abilities the Pokémon can have.",
    example: "If a Pokémon has three abilities, naming one earns 1 point; naming all three earns 2 points. Naming only two of the three earns 1 point.",
  },
  {
    name: "Evolution Method",
    description: "Identify how the Pokémon evolves, or how it evolved from its previous form.",
    partial: "You name the correct general evolution method, such as leveling up or using an item.",
    perfect: "You name the exact method, including the required level, item, move, or condition when applicable.",
    example: "For Magmar -> Magmortar, guessing Trade gives 1 point. Guessing Trade with Item - Magmarizer gives 2 points. For level-up evolutions, the exact level must be named for 2 points. If it has no evolution line, or is a Mega Pokémon, this category cannot be selected for that Pokémon!"
  },
  {
    name: "Base Stat Total",
    description: "Guess the Pokémon's Base Stat Total (BST), the sum of its six base stats.",
    partial: "Your guess is within 10 points of the actual BST.",
    perfect: "Your guess exactly matches the actual BST.",
    example: "If the BST is 525, guessing 520 earns 1 point. Guessing 525 earns 2 points.",
  },

];

function App() {
  const [gameStarted, setGameStarted] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<
  (typeof categoryRules)[number] | null
>(null);

  return (
    <div className="app">
      <header className="navbar">
        <a className="brand" href="#" aria-label="Pokémon Pick 6 home">
          <span className="pokeball" aria-hidden="true" />
          <span>Pokémon Pick 6</span>
        </a>
      </header>
{gameStarted ? (
  <GameScreen onHome={() => setGameStarted(false)} />
) : (
        <main className="home">
          <section className="hero">
            <span className="hero-label">POKÉMON KNOWLEDGE CHALLENGE</span>

            <h1>
              POKÉMON
              <span className="title-second">
                PICK <span className="six">6</span>
              </span>
            </h1>
          </section>

          <section className="rules-panel">
            <div className="rules-column">
              <h2>How to Play</h2>

              <ul className="rules-list">
                <li>
                  <span className="rule-icon blue">1</span>
                  <span>Six random Pokémon, revealed one at a time.</span>
                </li>
                <li>
                  <span className="rule-icon blue">2</span>
                  <span>Choose one category per Pokémon, and answer the question for that category. You won't know what Pokémon are coming up next, so choose wisely!</span>
                </li>
                <li>
                  <span className="rule-icon blue">3</span>
                  <span>Each category can only be used once. Some categories can be difficult, so save those for a Pokémon you know well! </span>
                </li>
                <li>
                  <span className="rule-icon blue">4</span>
                  <span>
                  Some answers are <span className="good-text">Good</span>, and some are{" "}
                  <span className="perfect-text">Perfect</span>. Get all <span className="good-text">Good</span> answers and
                  you win the challenge, but get all <span className="perfect-text">Perfect</span> answers for a{" "}
                  <span className="mastery-text">Mastery</span>!
                </span>
                </li>
              </ul>
            </div>
            
            <div className="category-section">
              <h2 className="category-heading">Categories</h2>
            <div className="category-list">
              {categoryRules.map((category) => (
                <button
                  className="category-item"
                  key={category.name}
                  onClick={() => setSelectedCategory(category)}
                  aria-label={`View rules for ${category.name}`}
                >
                  <span>{category.name}</span>
                  <span className="category-info" aria-hidden="true"></span>
                </button>
              ))}
            </div>
            <p className="category-hint">
              Click a category for more info
            </p>
          </div>

          </section>

          <section className="start-section">
            <button
              className="start-button"
              onClick={() => setGameStarted(true)}
            >
              <span className="button-ball" aria-hidden="true" />
              START GAME
              <span aria-hidden="true">→</span>
            </button>
          </section>
          
          {selectedCategory && (
            <div
              className="modal-overlay"
              onClick={() => setSelectedCategory(null)}
            >
              <section
                className="category-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="category-modal-title"
                onClick={(event) => event.stopPropagation()}
              >
                <button
                  className="modal-close"
                  onClick={() => setSelectedCategory(null)}
                  aria-label="Close category rules"
                >
                  x
                </button>

                <p className="modal-eyebrow">CATEGORY RULES</p>

                <h2 id="category-modal-title">
                  {selectedCategory.name}
                </h2>

                <p className="modal-description">
                  {selectedCategory.description}
                </p>

                <div className="rule-section partial-rule">
                  <h3>1 Point — Good Answer</h3>
                  <p>{selectedCategory.partial}</p>
                </div>

                <div className="rule-section perfect-rule">
                  <h3>2 Points — Perfect Answer</h3>
                  <p>{selectedCategory.perfect}</p>
                </div>

                <div className="example-section">
                  <h3>Example</h3>
                  <p>{selectedCategory.example}</p>
                </div>

                <button
                  className="start-button modal-done"
                  onClick={() => setSelectedCategory(null)}
                >
                  Got It
                </button>
              </section>
            </div>
          )}

        </main>
        
      )}
    </div>
    
  );
}

export default App;
