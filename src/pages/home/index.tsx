import { ModeToggle } from "@/components/mode-toggle";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { suggestCustomInstructions } from "@/services/genai";
import { Loader2, Play, Send, Sparkles, Star, Trash } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

// Keys for localStorage
const INSTRUCTIONS_INPUT_KEY = "hangman-custom-instructions-input";
const INSTRUCTIONS_HISTORY_KEY = "hangman-custom-instructions-history";
const INSTRUCTIONS_FAVORITES_KEY = "hangman-custom-instructions-favorites";

export default function HomePage() {
  const [instructions, setInstructions] = useState(() => {
    const saved = localStorage.getItem(INSTRUCTIONS_INPUT_KEY);
    return saved || "";
  });
  const [instructionsHistory, setInstructionsHistory] = useState(() => {
    const saved = localStorage.getItem(INSTRUCTIONS_HISTORY_KEY);
    return saved ? JSON.parse(saved) : [];
  });
  const [instructionsFavorites, setInstructionsFavorites] = useState<string[]>(
    () => {
      const saved = localStorage.getItem(INSTRUCTIONS_FAVORITES_KEY);
      return saved ? JSON.parse(saved) : [];
    }
  );

  const [instructionsList, setInstructionsList] = useState<string[]>(() => []);

  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">(
    "medium"
  );
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const navigate = useNavigate();

  // 2. Persist the current input to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(INSTRUCTIONS_INPUT_KEY, instructions);
    textareaRef.current?.focus();
  }, [instructions]);

  useEffect(() => {
    (async () => {
      setInstructionsList([]);
      const list = await suggestCustomInstructions(instructionsHistory);
      setInstructionsList(list);
    })();
  }, [instructionsHistory]);

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

    navigate(
      `/game/${difficulty}${
        instructions !== ""
          ? `?instructions=${encodeURIComponent(instructions.trim())}`
          : ""
      }`
    );
  }

  function handleAddFavClick(instruction: string) {
    if (instructionsFavorites.includes(instruction)) {
      handleDeleteFavClick(instruction);
    } else {
      setInstructionsFavorites((list) => {
        const newList = [instruction, ...list];

        localStorage.setItem(
          INSTRUCTIONS_FAVORITES_KEY,
          JSON.stringify(newList)
        );

        return newList;
      });
    }
  }

  function handleDeleteFavClick(instruction: string) {
    setInstructionsFavorites((list) => {
      const newList = list.filter((item) => item !== instruction);

      localStorage.setItem(INSTRUCTIONS_FAVORITES_KEY, JSON.stringify(newList));

      return newList;
    });
  }

  function handleClearHistoryClick() {
    localStorage.removeItem(INSTRUCTIONS_HISTORY_KEY);
    setInstructionsHistory([]);
  }

  return (
    <div className="flex flex-col gap-8 w-screen h-screen items-center p-8 pt-32">
      <div className="text-8xl max-md:text-6xl playful">Hangman</div>

      <Textarea
        className="w-full max-w-2xl min-h-32"
        placeholder="Enter custom instructions here."
        onChange={(e) => setInstructions(e.target.value)}
        value={instructions}
        ref={textareaRef}
      />

      <div className="flex gap-4 -my-4">
        <Button
          size={"sm"}
          variant={difficulty === "easy" ? "default" : "outline"}
          onClick={() => setDifficulty("easy")}
        >
          Easy
        </Button>
        <Button
          size={"sm"}
          variant={difficulty === "medium" ? "default" : "outline"}
          onClick={() => setDifficulty("medium")}
        >
          Medium
        </Button>
        <Button
          size={"sm"}
          variant={difficulty === "hard" ? "default" : "outline"}
          onClick={() => setDifficulty("hard")}
        >
          Hard
        </Button>
      </div>

      <Button className="w-64 h-12" onClick={handleCustomClick}>
        <Play className="size-6" />
      </Button>

      <div className="flex max-md:flex-col gap-4 max-md:mt-4 h-full w-full justify-center max-md:justify-start max-md:h-fit max-w-6xl">
        <div className="w-full h-full border-2 rounded-md p-4">
          <div className="font-bold flex gap-2">
            Suggestions <Sparkles className="text-primary size-4" />
          </div>
          <div className="flex flex-col gap-2 w-full h-full overflow-y-auto">
            {instructionsList.length === 0 && (
              <div className="flex justify-center items-center w-full h-full py-8">
                <Loader2 className="animate-spin text-primary" />
              </div>
            )}
            {instructionsList.map((instruction, index) => (
              <div
                key={index}
                className="flex w-full justify-between gap-4 border-t-2 pt-2 items-end"
              >
                <div className="max-md:text-sm w-full self-center">
                  {instruction}
                </div>
                <Button
                  onClick={() => handleAddFavClick(instruction)}
                  size="icon"
                  className="-mr-2"
                  variant={
                    instructionsFavorites.includes(instruction)
                      ? "default"
                      : "outline"
                  }
                >
                  <Star className="w-4 h-4" />
                </Button>
                <Button
                  onClick={() => setInstructions(instruction)}
                  size="icon"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        <div
          className={cn(
            "w-full h-full p-4 border-2 rounded-md",
            instructionsFavorites.length === 0 && "hidden"
          )}
        >
          <div className="flex font-bold gap-2">
            Favorites <Star className="text-primary size-4" />
          </div>

          <div className="flex flex-col gap-2 w-full max-w-2xl h-full overflow-y-auto">
            {instructionsFavorites.map((instruction, index) => (
              <div
                key={index}
                className="flex w-full justify-between gap-4 border-t-2 py-2"
              >
                <div className="text-sm">{instruction}</div>
                <Button
                  onClick={() => handleDeleteFavClick(instruction)}
                  size="icon"
                  className="-mr-2"
                  variant={"destructive"}
                >
                  <Trash className="w-4 h-4" />
                </Button>
                <Button
                  onClick={() => setInstructions(instruction)}
                  size="icon"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="w-full h-full max-w-6xl pb-8 flex justify-end">
        <Button
          size={"lg"}
          className="w-fit"
          onClick={handleClearHistoryClick}
          variant={"destructive"}
        >
          <Trash /> Clear History
        </Button>
      </div>

      <ModeToggle />
    </div>
  );
}
