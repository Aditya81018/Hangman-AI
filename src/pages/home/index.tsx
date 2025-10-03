import { ModeToggle } from "@/components/mode-toggle";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { suggestCustomInstructions } from "@/services/genai";
import { Play } from "lucide-react";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

// Keys for localStorage
const INSTRUCTIONS_INPUT_KEY = "hangman-custom-instructions-input";
const INSTRUCTIONS_HISTORY_KEY = "hangman-custom-instructions-history";

export default function HomePage() {
  const [instructions, setInstructions] = useState(() => {
    const saved = localStorage.getItem(INSTRUCTIONS_INPUT_KEY);
    return saved || "";
  });
  const [instructionsHistory, setInstructionsHistory] = useState(() => {
    const saved = localStorage.getItem(INSTRUCTIONS_HISTORY_KEY);
    return saved ? JSON.parse(saved) : [];
  });
  const [instructionsList, setInstructionsList] = useState<string[]>(() => []);

  // 2. Persist the current input to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(INSTRUCTIONS_INPUT_KEY, instructions);
  }, [instructions]);

  useEffect(() => {
    (async () => {
      console.log("instructionsHistory", instructionsHistory);
      const list = await suggestCustomInstructions(instructionsHistory);
      setInstructionsList(list);
    })();
  }, []);

  /**
   * Handles the click on the Custom button.
   * Stores the used instruction into a history array in localStorage.
   */
  function handleCustomClick() {
    const trimmedInstructions = instructions.trim();

    if (trimmedInstructions) {
      try {
        // Load existing history
        const historyJson = localStorage.getItem(INSTRUCTIONS_HISTORY_KEY);
        let history: string[] = historyJson ? JSON.parse(historyJson) : [];

        // Ensure history is an array
        if (!Array.isArray(history)) {
          history = [];
        }

        // Add the new instruction to the front, avoiding duplicates
        const updatedHistory = [
          trimmedInstructions,
          ...history.filter((item) => item !== trimmedInstructions),
        ];

        // Optionally limit the history size (e.g., to 10 entries)
        const limitedHistory = updatedHistory.slice(0, 10);

        // Save the updated history
        localStorage.setItem(
          INSTRUCTIONS_HISTORY_KEY,
          JSON.stringify(limitedHistory)
        );
        setInstructionsHistory(limitedHistory);
      } catch (error) {
        console.error(
          "Failed to update instructions history in localStorage:",
          error
        );
      }
    }
  }

  return (
    <div className="flex flex-col gap-8 w-screen h-screen items-center justify-center p-8">
      <div className="text-4xl">Hangman</div>

      <div className="flex gap-4 max-md:flex-col items-center">
        <Link to={"/game/easy"}>
          <Button size="lg" className="px-16">
            Easy
          </Button>
        </Link>
        <Link to={"/game/medium"}>
          <Button size="lg" className="px-16">
            Medium
          </Button>
        </Link>
        <Link to={"/game/hard"}>
          <Button size="lg" className="px-16">
            Hard
          </Button>
        </Link>
      </div>

      <Textarea
        className="w-full max-w-2xl"
        placeholder="Enter custom instructions here."
        onChange={(e) => setInstructions(e.target.value)}
        value={instructions}
      />

      <Link
        // 3. Use encodeURIComponent for safe URL passing
        to={`/game/custom?instructions=${encodeURIComponent(
          instructions.trim()
        )}`}
        // 4. Call the saving function before navigation
        onClick={handleCustomClick}
      >
        <Button
          size="lg"
          className="px-16"
          disabled={instructions.trim() === ""}
        >
          Play Custom
        </Button>
      </Link>

      <div className="flex flex-col gap-2 w-full max-w-2xl">
        {instructionsList.map((instruction, index) => (
          <div
            key={index}
            className="flex w-full justify-between gap-4 border-b-2 py-2"
          >
            <div>{instruction}</div>
            <Button onClick={() => setInstructions(instruction)} size="sm">
              <Play className="w-4 h-4" />
            </Button>
          </div>
        ))}
      </div>

      <ModeToggle />
    </div>
  );
}
