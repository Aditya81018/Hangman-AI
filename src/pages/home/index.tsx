import { ModeToggle } from "@/components/mode-toggle";
import { Button } from "@/components/ui/button";
import { Link } from "react-router";

export default function HomePage() {
  return (
    <div className="flex flex-col gap-8 w-screen h-screen items-center justify-center">
      <div className="text-4xl">Hangman</div>

      <div className="flex gap-4 max-md:flex-col">
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
      <ModeToggle />
    </div>
  );
}
