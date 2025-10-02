import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function NotFoundPage() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate("/");
  }, []);

  return (
    <div className="w-screen h-screen grid place-items-center absolute top-0 left-0">
      <Loader2 className="animate-spin" />
    </div>
  );
}
