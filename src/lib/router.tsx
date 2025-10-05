import ErrorPage from "@/pages/error.page";
import GamePage from "@/pages/game";
import HomePage from "@/pages/home";
import NotFoundPage from "@/pages/not-found.page";
import { createBrowserRouter } from "react-router-dom";

const router = createBrowserRouter([
  { path: "/", element: <HomePage />, errorElement: <NotFoundPage /> },
  { path: "/game/", element: <GamePage /> },
  { path: "/game/:difficulty", element: <GamePage /> },
  { path: "error", element: <ErrorPage /> },
]);

export default router;
