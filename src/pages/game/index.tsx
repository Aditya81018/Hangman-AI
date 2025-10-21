import { cn } from "@/lib/utils";
import Keyboard from "./keyboard";
import { useEffect, useState, useCallback } from "react";
import Hangman, { type Parts } from "./hangman";
import { ModeToggle } from "@/components/mode-toggle";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Home, Loader2, RotateCcw, Star } from "lucide-react";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { generateHangmanWords } from "@/services/genai";

// Define the type for the AI-generated word object
interface HangmanWordObject {
  category: string;
  word: string;
  hint: string;
}

const INSTRUCTIONS_FAVORITES_KEY = "hangman-custom-instructions-favorites";
const USED_WORDS_KEY = "hangman-used-words";

export default function GamePage() {
  const parts: Parts[] = [
    "rope",
    "face",
    "body",
    "left-arm",
    "right-arm",
    "left-leg",
    "right-leg",
  ];
  const { difficulty = "medium" } = useParams();
  const [searchParams] = useSearchParams();
  const instructions = searchParams.get("instructions");
  const isAdvanceAI = searchParams.get("isAdvanceAI") === "true";
  const cantRepeatWords = searchParams.get("cantRepeatWords") === "true";
  console.log(isAdvanceAI, cantRepeatWords);

  const [wordBatch, setWordBatch] = useState<HangmanWordObject[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [category, setCategory] = useState("");
  const [originalWord, setOriginalWord] = useState("");
  const [decodedWord, setDecodedWord] = useState("");
  const [dangerKeys, setDangerKeys] = useState("");
  const [successKeys, setSuccessKeys] = useState("");
  const [lives, setLives] = useState(parts.length);
  const [hiddenParts, setHiddenParts] = useState<Parts[]>(parts);
  const [gameState, setGameState] = useState<
    "playing" | "won" | "lost" | "waiting"
  >("waiting");
  const [hint, setHint] = useState("");
  const [level, setLevel] = useState(1);
  const [isSaved, setIsSaved] = useState(
    JSON.parse(
      localStorage.getItem(INSTRUCTIONS_FAVORITES_KEY) || "[]"
    ).includes(instructions)
  );
  const [alrUsedWords, setAlrUsedWords] = useState(
    JSON.parse(localStorage.getItem(USED_WORDS_KEY) || "[]") as string[]
  );

  const navigate = useNavigate();

  /**
   * Function to call the AI for a new batch of words.
   */
  const fetchNewWordBatch = useCallback(async () => {
    if (wordBatch.length === 0) setIsLoading(true);
    try {
      const currentUsedWords = wordBatch.map((e) => e.word);
      const newWords = await generateHangmanWords(
        `Set of unique and random words for hangman. ${instructions}`,
        difficulty,
        isAdvanceAI,
        [
          ...currentUsedWords,
          ...(cantRepeatWords
            ? alrUsedWords.slice(currentUsedWords.length, 100)
            : []),
        ]
      );
      if (newWords.length === 0) {
        throw new Error("Failed to generate new words");
      }
      setWordBatch((words) => [...words, ...newWords]);
    } catch (error) {
      console.error("Failed to generate words:", error);
      navigate("/error");
    } finally {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wordBatch.length]);

  // --- PRIMARY EFFECT: Load the initial word batch ---
  useEffect(() => {
    if (
      (level === 1 && wordBatch.length === 0) ||
      level === wordBatch.length - 3
    ) {
      fetchNewWordBatch();
    }
  }, [level, wordBatch, fetchNewWordBatch]);

  // --- SECONDARY EFFECT: Set the game word when the batch/index changes ---
  useEffect(() => {
    if (
      wordBatch.length > 0 &&
      level <= wordBatch.length && // Use <= to allow the last word
      gameState === "waiting"
    ) {
      const {
        category: newCategory,
        word: newWord,
        hint: newHint,
      } = wordBatch[level - 1];

      setCategory(newCategory);
      setOriginalWord(newWord.toUpperCase());
      setHint(newHint);
      setDangerKeys("");
      setSuccessKeys("");
      setLives(parts.length);
      setGameState("playing");

      setDecodedWord(
        newWord
          .toUpperCase()
          .split("")
          .map((letter: string) => (letter === " " ? " " : "_"))
          .join("")
      );
    }
  }, [wordBatch, level, gameState]);

  useEffect(() => {
    setHiddenParts(parts.slice(parts.length - lives, parts.length));
    if (lives === 0) {
      setGameState("lost");
    }
  }, [lives]);

  /**
   * Handles a key click event.
   */
  function handleKeyClick(key: string) {
    setDecodedWord((prev) => {
      const newWord = prev.split("");
      let isUpdated = false;
      for (let i = 0; i < originalWord.length; i++) {
        if (originalWord[i] === key) {
          newWord[i] = key;
          isUpdated = true;
        }
      }

      if (!isUpdated) {
        setLives((prev) => prev - 1);
        setDangerKeys((prev) => prev + key);
      } else {
        setSuccessKeys((prev) => prev + key);
      }

      const finalWord = newWord.join("");

      if (finalWord === originalWord) {
        setGameState("won");

        // <-- ADDED LOGIC: Save the won word to localStorage and update state
        setAlrUsedWords((prevUsedWords: string[]) => {
          const newUsedWords = [originalWord, ...prevUsedWords];
          localStorage.setItem(USED_WORDS_KEY, JSON.stringify(newUsedWords));
          return newUsedWords;
        });
        // <-- END OF ADDED LOGIC
      }

      return finalWord;
    });
  }

  /**
   * Handles the restart button click event.
   */
  function handleRestart() {
    setGameState("waiting");

    if (gameState === "lost") {
      setLevel(1);
      setWordBatch([]);
      fetchNewWordBatch();
      return;
    }

    setLevel((currentLevel) => currentLevel + 1);
  }

  function handleSaveClick() {
    if (!isSaved) {
      setIsSaved(true);
      const savedInstructions: string[] = JSON.parse(
        localStorage.getItem(INSTRUCTIONS_FAVORITES_KEY) || "[]"
      );
      if (instructions && !savedInstructions.includes(instructions)) {
        localStorage.setItem(
          INSTRUCTIONS_FAVORITES_KEY,
          JSON.stringify([instructions, ...savedInstructions])
        );
      }
    } else {
      setIsSaved(false);
      const savedInstructions: string[] = JSON.parse(
        localStorage.getItem(INSTRUCTIONS_FAVORITES_KEY) || "[]"
      );
      if (instructions && savedInstructions.includes(instructions)) {
        const updatedInstructions = savedInstructions.filter(
          (item) => item !== instructions
        );
        localStorage.setItem(
          INSTRUCTIONS_FAVORITES_KEY,
          JSON.stringify(updatedInstructions)
        );
      }
    }
  }

  /**
   * Component that displays the decoded word.
   */
  function Output() {
    const wordSegments = originalWord.split(" ");
    const decodedSegments = decodedWord.split(" ");

    return (
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-4">
        {wordSegments.map((_originalSegment, segmentIndex) => {
          const decodedSegment = decodedSegments[segmentIndex] || "";
          return (
            <div key={`segment-${segmentIndex}`} className="flex gap-1">
              {decodedSegment.split("").map((letter, letterIndex) => (
                <div
                  key={`segment-${segmentIndex}-letter-${letterIndex}`}
                  className={cn(
                    "flex border-b-2 border-primary font-mono px-2 items-center justify-center w-6 h-6 text-xl"
                  )}
                >
                  {letter !== "_" && letter}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    );
  }

  if (isLoading || originalWord === "") {
    return (
      <div className="w-screen h-screen flex flex-col justify-center items-center">
        <Loader2 className="animate-spin mb-8 text-primary" />
        <div className="text-xl font-bold">
          Generating a fresh batch of words...
        </div>
        <div className="text-sm text-muted-foreground">
          {isAdvanceAI
            ? "Advance AI takes longer. Have patience."
            : "This may take a moment."}
        </div>
        <ModeToggle />
      </div>
    );
  }

  return (
    <>
      <Link to="/" className="fixed top-4 left-4">
        <Button variant={"ghost"} size={"icon"}>
          <ArrowLeft />
        </Button>
      </Link>
      <div className="w-screen h-screen p-8 max-md:pt-6 flex flex-col justify-center max-md:justify-start items-center gap-8 *:select-none">
        <div className="font-bold text-2xl text-center">Level {level}</div>
        <div className="flex gap-8 items-center justify-center md:justify-center md:flex-row-reverse flex-col w-full h-full">
          <Hangman className="max-md:max-h-64" hiddenParts={hiddenParts} />
          <div className="flex flex-col gap-8 max-md:pb-8 items-center md:justify-center justify-start w-full md:w-md">
            <div className="capitalize text-2xl font-bold">
              {category.replaceAll("_", " ")}
            </div>
            <div className="text-sm text-muted-foreground font-mono -mt-6 text-center">
              {hint}
            </div>
            <Output />
            {gameState === "playing" || gameState === "waiting" ? (
              <Keyboard
                dangerKeys={dangerKeys}
                successKeys={successKeys}
                onClick={handleKeyClick}
              />
            ) : gameState === "won" ? (
              <div className="flex flex-col gap-4 items-center justify-center">
                <div className="text-4xl max-md:text-3xl font-bold uppercase">
                  YOU GUESSED IT! 🎉
                </div>
                <Button onClick={handleRestart}>Next Word</Button>
              </div>
            ) : (
              gameState === "lost" && (
                <div className="flex flex-col gap-4 items-center justify-center">
                  <div className="text-4xl max-md:text-3xl font-bold uppercase">
                    GAME OVER! 💀
                  </div>
                  <div>
                    The word was:{" "}
                    <span className="font-bold">{originalWord}</span>
                  </div>
                  <div className="flex gap-4">
                    <Link to="/">
                      <Button>
                        <Home /> Back to Home
                      </Button>
                    </Link>
                    <Button variant={"secondary"} onClick={handleRestart}>
                      <RotateCcw /> Restart
                    </Button>
                  </div>
                </div>
              )
            )}
          </div>
        </div>

        <Button
          size={"icon"}
          variant={isSaved ? "default" : "secondary"}
          className={cn("fixed bottom-4 right-4", !instructions && "hidden")}
          onClick={handleSaveClick}
        >
          <Star />
        </Button>
        <ModeToggle />
      </div>
    </>
  );
}
