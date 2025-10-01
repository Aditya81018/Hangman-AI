import GamePage from "@/pages/game";
import HomePage from "@/pages/home";
import { createBrowserRouter } from "react-router";

const router = createBrowserRouter([
  { path: "/", element: <HomePage /> },
  { path: "/game", element: <GamePage /> },
]);

export default router;
