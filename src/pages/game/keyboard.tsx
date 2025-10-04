import { cn } from "@/lib/utils";

interface KeyboardProps {
  dangerKeys?: string;
  successKeys?: string;
  onClick?: (key: string) => void;
}

const keysMatrix = "1234567890\nQWERTYUIOP\nASDFGHJKL\nZXCVBNM"
  .split("\n")
  .map((row) => row.split(""));

export default function Keyboard({
  dangerKeys,
  successKeys,
  onClick,
}: KeyboardProps) {
  return (
    <div className="flex flex-col gap-2 justify-center items-center">
      {keysMatrix.map((rows, i) => (
        <div key={i} className="flex gap-2">
          {rows.map((key) => (
            <button
              onClick={() => onClick?.(key)}
              disabled={dangerKeys?.includes(key) || successKeys?.includes(key)}
              key={key}
              className={cn(
                "text-2xl w-6 font-black font-mono disabled:opacity-50 disabled:cursor-not-allowed",
                dangerKeys?.includes(key) && "text-destructive",
                successKeys?.includes(key) && "text-success"
              )}
            >
              {key}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}
