import { cn } from "@/lib/utils";
import Keyboard from "./keyboard";
import { useEffect, useState } from "react";
import Hangman, { type Parts } from "./hangman";
import { ModeToggle } from "@/components/mode-toggle";
import { Button } from "@/components/ui/button";
import { getRandom } from "@/lib/helper";
import words from "@/data/words.json";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router";

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

  const [originalWord, setOriginalWord] = useState(
    getRandom(words).toUpperCase()
  );
  const [decodedWord, setDecodedWord] = useState("");
  const [disabledKeys, setDisabledKeys] = useState("");
  const [lives, setLives] = useState(parts.length);
  const [hiddenParts, setHiddenParts] = useState<Parts[]>([]);
  const [gameState, setGameState] = useState<"playing" | "won" | "lost">(
    "playing"
  );
  const [streak, setStreak] = useState(0);

  // Reset the decoded word when original word changes
  useEffect(() => {
    console.log(originalWord);
    setDecodedWord(
      originalWord
        .split("")
        .map((letter: string) => (letter === " " ? " " : "_"))
        .join("")
    );
  }, [originalWord]);

  useEffect(() => {
    setHiddenParts(parts.slice(parts.length - lives, parts.length));
    if (lives === 0) {
      setGameState("lost");
    }
  }, [lives]);

  /**
   * Handles a key click event.
   * Updates the disabled keys state with the pressed key.
   * Updates the decoded word state by replacing the corresponding underscore with the pressed key.
   * @param {string} key - The pressed key.
   */
  function handleKeyClick(key: string) {
    setDisabledKeys((prev) => prev + key);
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
      }

      if (newWord.join("") === originalWord) {
        setGameState("won");
        setStreak((streak) => streak + 1);
      }

      return newWord.join("");
    });
  }

  function handleRestart() {
    let newWord = getRandom(words).toUpperCase();
    while (newWord === originalWord) {
      newWord = getRandom(words).toUpperCase();
    }
    setOriginalWord(newWord);
    setDisabledKeys("");
    setLives(parts.length);
    setGameState("playing");

    if (gameState === "lost") setStreak(0);
  }

  /**
   * Component that displays the decoded word.
   *
   * It takes the decoded word and splits it into individual letters.
   * For each letter, it renders a div with the letter inside.
   * If the letter is an underscore, it renders an invisible div with no letter.
   */
  function Output() {
    return (
      <div className="flex gap-1">
        {decodedWord.split("").map((letter, i) => (
          <div
            key={i}
            className={cn(
              "flex border-b-2 font-mono px-2 pb-2 items-center justify-center w-4 h-4",
              letter === " " && "invisible"
            )}
          >
            {letter !== "_" && letter}
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      <Link to="/" className="absolute top-4 left-4">
        <Button variant={"ghost"} size={"icon"}>
          <ArrowLeft />
        </Button>
      </Link>
      <div className="w-screen h-screen px-8 flex flex-col justify-center items-center gap-8">
        <div className="absolute right-8 bottom-4">Streak: {streak}</div>
        <Hangman hiddenParts={hiddenParts} />
        <Output />
        {gameState === "playing" ? (
          <Keyboard disabledKeys={disabledKeys} onClick={handleKeyClick} />
        ) : gameState === "won" ? (
          <div className="flex flex-col gap-4 items-center justify-center">
            <div className="text-4xl font-bold uppercase">YOU WON</div>
            <Button onClick={handleRestart}>Next Word</Button>
          </div>
        ) : (
          <div className="flex flex-col gap-4 items-center justify-center">
            <div className="text-4xl font-bold uppercase">GAME OVER</div>
            <div>
              The word was: <span className="font-bold">{originalWord}</span>
            </div>
            <Button onClick={handleRestart}>Restart</Button>
          </div>
        )}
        <ModeToggle />
      </div>
    </>
  );
}
