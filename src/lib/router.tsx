import GamePage from "@/pages/game";
import HomePage from "@/pages/home";
import NotFoundPage from "@/pages/not-found.page";
import { createBrowserRouter } from "react-router";

const router = createBrowserRouter([
  { path: "/", element: <HomePage />, errorElement: <NotFoundPage /> },
  { path: "/game/:difficulty", element: <GamePage /> },
]);

export default router;
