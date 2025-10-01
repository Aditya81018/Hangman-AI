import { ModeToggle } from "@/components/mode-toggle";
import { Button } from "@/components/ui/button";
import { Link } from "react-router";

export default function HomePage() {
  return (
    <div className="flex flex-col gap-8 w-screen h-screen items-center justify-center">
      <div className="text-4xl">Hangman</div>

      <Link to={"/game"}>
        <Button size="lg" className="px-16">
          Play
        </Button>
      </Link>
      <ModeToggle />
    </div>
  );
}
