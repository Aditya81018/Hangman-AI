import { ModeToggle } from "@/components/mode-toggle";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { suggestCustomInstructions } from "@/services/genai";
import {
  Loader2,
  Play,
  Sparkles,
  Star,
  Trash,
  X,
  RotateCw,
  Ban,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

// Keys for localStorage
const INSTRUCTIONS_INPUT_KEY = "hangman-custom-instructions-input";
const INSTRUCTIONS_HISTORY_KEY = "hangman-custom-instructions-history";
const INSTRUCTIONS_FAVORITES_KEY = "hangman-custom-instructions-favorites";
const USED_WORDS_KEY = "hangman-used-words";
const ADVANCE_AI_KEY = "hangman-settings-advance-ai"; // <-- ADDED
const NO_REPEAT_KEY = "hangman-settings-no-repeat"; // <-- ADDED
const MAX_HISTORY_SIZE = 10;

// Helper function to safely parse JSON from localStorage
function getFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : defaultValue;
  } catch (error) {
    console.error(`Failed to parse ${key} from localStorage`, error);
    return defaultValue;
  }
}

// Helper function to safely stringify and set JSON to localStorage
function saveToStorage(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Failed to save ${key} to localStorage`, error);
  }
}

export default function HomePage() {
  const [instructions, setInstructions] = useState(() => {
    // Input is plain text, not JSON, so we handle it separately
    return localStorage.getItem(INSTRUCTIONS_INPUT_KEY) || "";
  });

  const [instructionsHistory, setInstructionsHistory] = useState<string[]>(() =>
    getFromStorage(INSTRUCTIONS_HISTORY_KEY, [])
  );

  const [instructionsFavorites, setInstructionsFavorites] = useState<string[]>(
    () => getFromStorage(INSTRUCTIONS_FAVORITES_KEY, [])
  );

  const [instructionsList, setInstructionsList] = useState<string[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(true);

  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">(
    "medium"
  );
  // --- MODIFIED: Load settings from localStorage ---
  const [isAdvanceAI, setIsAdvanceAI] = useState(() => {
    return getFromStorage(ADVANCE_AI_KEY, false);
  });
  const [cantRepeatWords, setCantRepeatWords] = useState(() => {
    return getFromStorage(NO_REPEAT_KEY, false);
  });
  // --- END MODIFICATION ---

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const navigate = useNavigate();

  const trimmedInstructions = instructions.trim();
  const isCurrentInputFavorite =
    instructionsFavorites.includes(trimmedInstructions);

  // 1. Persist the current input to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(INSTRUCTIONS_INPUT_KEY, instructions);
    } catch (error) {
      console.error("Failed to save instructions input:", error);
    }
    textareaRef.current?.focus();
  }, [instructions]);

  // --- ADDED: Persist settings to localStorage ---
  useEffect(() => {
    saveToStorage(ADVANCE_AI_KEY, isAdvanceAI);
  }, [isAdvanceAI]);

  useEffect(() => {
    saveToStorage(NO_REPEAT_KEY, cantRepeatWords);
  }, [cantRepeatWords]);
  // --- END ADDED ---

  // 2. Fetch suggestions ONLY on startup //
  useEffect(() => {
    let isMounted = true;
    setIsLoadingSuggestions(true);

    (async () => {
      try {
        // Fetches using the state that was just initialized from localStorage
        const list = await suggestCustomInstructions(
          instructionsHistory,
          instructionsFavorites
        );
        if (isMounted) {
          setInstructionsList(list);
        }
      } catch (error) {
        console.error("Failed to fetch suggestions:", error);
        if (isMounted) {
          setInstructionsList([]);
        }
      } finally {
        if (isMounted) {
          setIsLoadingSuggestions(false);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // <-- CRITICAL: Empty dependency array ensures this runs only on mount

  // Manual fetch suggestions function
  async function handleFetchSuggestions() {
    setIsLoadingSuggestions(true);
    try {
      // Fetches using the CURRENT state
      const list = await suggestCustomInstructions(
        instructionsHistory,
        instructionsFavorites
      );
      setInstructionsList(list);
    } catch (error) {
      console.error("Failed to fetch suggestions:", error);
      setInstructionsList([]);
    } finally {
      setIsLoadingSuggestions(false);
    }
  }

  /**
   * Updates the instruction history in both state and localStorage.
   */
  function updateInstructionsHistory(instruction: string) {
    if (!instruction) return; // Don't save empty strings

    setInstructionsHistory((prevHistory) => {
      // Ensure history is an array (paranoid check, good for robustness)
      const history = Array.isArray(prevHistory) ? prevHistory : [];

      // Add new instruction to the front, avoiding duplicates
      const updatedHistory = [
        instruction,
        ...history.filter((item) => item !== instruction),
      ];

      const limitedHistory = updatedHistory.slice(0, MAX_HISTORY_SIZE);

      saveToStorage(INSTRUCTIONS_HISTORY_KEY, limitedHistory);
      return limitedHistory; // <-- CRITICAL FIX: Return new state
    });
  }

  /**
   * Handles the click on the main Play button.
   * Stores the used instruction and navigates to the game.
   */
  function handleCustomClick() {
    const trimmedInstructions = instructions.trim();
    updateInstructionsHistory(trimmedInstructions);

    navigate(
      `/game/${difficulty}?isAdvanceAI=${isAdvanceAI}&cantRepeatWords=${cantRepeatWords}${
        // <-- MODIFIED to remove extra &
        trimmedInstructions
          ? `&instructions=${encodeURIComponent(trimmedInstructions)}` // <-- ADDED & here
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
        saveToStorage(INSTRUCTIONS_FAVORITES_KEY, newList);
        return newList;
      });
    }
  }

  function handleDeleteFavClick(instruction: string) {
    setInstructionsFavorites((list) => {
      const newList = list.filter((item) => item !== instruction);
      saveToStorage(INSTRUCTIONS_FAVORITES_KEY, newList);
      return newList;
    });
  }

  function handleClearHistoryClick() {
    localStorage.removeItem(INSTRUCTIONS_HISTORY_KEY);
    localStorage.removeItem(USED_WORDS_KEY);
    setInstructionsHistory([]);
  }

  return (
    // Use min-h-screen to prevent overflow issues on small viewports
    <div className="relative flex flex-col gap-8 w-screen min-h-screen items-center p-8 pt-32">
      {/* Moved ModeToggle to a more conventional top-right corner */}
      <div className="absolute top-8 right-8">
        <ModeToggle />
      </div>

      <div className="text-8xl max-md:text-6xl playful">Hangman</div>

      <div className="relative w-full max-w-2xl">
        <Textarea
          className="w-full min-h-32"
          placeholder="Enter custom instructions here."
          onChange={(e) => setInstructions(e.target.value)}
          value={instructions}
          ref={textareaRef}
        />
        <Button
          variant={isCurrentInputFavorite ? "default" : "outline"}
          size={"icon"}
          onClick={() => handleAddFavClick(trimmedInstructions)}
          disabled={!trimmedInstructions}
          className="absolute bottom-2 right-10 z-10 size-6" // <-- MODIFIED position
          aria-label={
            isCurrentInputFavorite
              ? "Remove from favorites"
              : "Add to favorites"
          }
        >
          <Star className="size-3" />
        </Button>
        <Button
          variant="outline"
          size={"icon"}
          onClick={() => setInstructions("")}
          className="absolute bottom-2 right-2 z-10 size-6"
          aria-label="Clear instructions"
        >
          <X className="size-3" />
        </Button>
      </div>

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

      <div className="flex gap-4 -mt-4 ">
        <Button
          size={"sm"}
          variant={isAdvanceAI ? "default" : "outline"}
          onClick={() => setIsAdvanceAI(!isAdvanceAI)}
        >
          <Sparkles
            className={cn(
              "text-primary size-4 mr-1", // <-- ADDED mr-1
              isAdvanceAI && "text-white"
            )}
          />{" "}
          Advance AI
        </Button>
        <Button
          size={"sm"}
          variant={cantRepeatWords ? "default" : "outline"}
          onClick={() => setCantRepeatWords(!cantRepeatWords)}
        >
          <Ban
            className={cn(
              "text-primary size-4 mr-1", // <-- ADDED mr-1
              cantRepeatWords && "text-white"
            )}
          />{" "}
          No Repeating Words
        </Button>
      </div>

      <div className="flex max-md:flex-col gap-4 h-full w-full justify-center max-md:justify-start max-md:h-fit max-w-6xl pb-8">
        <div className="w-full h-full border-2 rounded-md p-4 flex flex-col">
          {/* Improved header with contextual "Clear History" button */}
          <div className="font-bold flex gap-2 justify-between items-center mb-2">
            <div className="flex gap-2 items-center">
              Suggestions <Sparkles className="text-primary size-4" />
              {/* --- ADDED REFRESH BUTTON --- */}
              <Button
                variant="ghost"
                size="icon"
                onClick={handleFetchSuggestions}
                disabled={isLoadingSuggestions}
                aria-label="Refresh suggestions"
                className="size-6" // <-- ADDED
              >
                <RotateCw
                  className={cn(
                    "size-4",
                    isLoadingSuggestions && "animate-spin" // <-- MODIFIED
                  )}
                />
              </Button>
            </div>
            <Button
              size={"sm"}
              onClick={handleClearHistoryClick}
              variant={"outlineDestructive"}
            >
              <Trash className="size-3 mr-1" /> Clear History
            </Button>
          </div>
          <div className="flex flex-col gap-2 w-full h-full overflow-y-auto">
            {isLoadingSuggestions ? (
              <div className="flex justify-center items-center w-full h-full py-8">
                <Loader2 className="animate-spin text-primary" />
              </div>
            ) : instructionsList.length === 0 ? (
              <div className="flex justify-center items-center w-full h-full py-8 text-sm text-muted-foreground">
                No suggestions found.
              </div>
            ) : (
              instructionsList.map((instruction, index) => (
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
                    // Added accessibility label
                    aria-label={
                      instructionsFavorites.includes(instruction)
                        ? "Remove from favorites"
                        : "Add to favorites"
                    }
                  >
                    <Star className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={() => setInstructions(instruction)}
                    size="icon"
                    aria-label="Use this instruction" // Added accessibility label
                  >
                    <Play className="w-4 h-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>

        <div
          className={cn(
            "w-full h-full p-4 border-2 rounded-md flex flex-col", // Added flex flex-col
            instructionsFavorites.length === 0 && "hidden"
          )}
        >
          <div className="font-bold flex gap-2 mb-2 items-center">
            Favorites <Star className="text-primary size-4" />
          </div>

          <div className="flex flex-col gap-2 w-full h-full overflow-y-auto">
            {instructionsFavorites.map((instruction, index) => (
              <div
                key={index}
                className="flex w-full justify-between gap-4 border-t-2 pt-2 items-end"
              >
                <div className="max-md:text-sm w-full self-center">
                  {instruction}
                </div>
                <Button
                  onClick={() => handleDeleteFavClick(instruction)}
                  size="icon"
                  className="-mr-2"
                  variant={"outlineDestructive"}
                  aria-label="Remove from favorites" // Added accessibility label
                >
                  <Trash className="w-4 h-4" />
                </Button>
                <Button
                  onClick={() => setInstructions(instruction)}
                  size="icon"
                  aria-label="Use this instruction" // Added accessibility label
                >
                  <Play className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
