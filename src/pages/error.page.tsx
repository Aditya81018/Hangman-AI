import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";
import { Link } from "react-router-dom";

export default function ErrorPage() {
  return (
    <div className="w-screen h-screen flex flex-col justify-center items-center gap-8">
      <div className="text-9xl max-md:text-6xl font-bold">Oops!</div>
      <div className="text-3xl max-md:text-xl text-muted-foreground">
        Something went wrong
      </div>
      <Link to="/">
        <Button>
          <Home /> Back to Home
        </Button>
      </Link>
    </div>
  );
}
