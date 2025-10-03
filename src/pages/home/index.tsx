import { ModeToggle } from "@/components/mode-toggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { Link } from "react-router-dom";

export default function HomePage() {
  const [instructions, setInstructions] = useState("");
  return (
    <div className="flex flex-col gap-8 w-screen h-screen items-center justify-center">
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
        placeholder="Enter custom instructions here..."
        onChange={(e) => setInstructions(e.target.value)}
        value={instructions}
      />

      <Link to={`/game/custom?instructions=${instructions}`}>
        <Button size="lg" className="px-16">
          Custom
        </Button>
      </Link>

      <ModeToggle />
    </div>
  );
}
