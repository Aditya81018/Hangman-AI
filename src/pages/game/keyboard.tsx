interface KeyboardProps {
  disabledKeys?: string;
  onClick?: (key: string) => void;
}

const keysMatrix = "QWERTYUIOP\nASDFGHJKL\nZXCVBNM"
  .split("\n")
  .map((row) => row.split(""));

export default function Keyboard({ disabledKeys, onClick }: KeyboardProps) {
  return (
    <div className="flex flex-col gap-2 justify-center items-center">
      {keysMatrix.map((rows, i) => (
        <div key={i} className="flex gap-2">
          {rows.map((key) => (
            <button
              onClick={() => onClick?.(key)}
              disabled={disabledKeys?.includes(key)}
              key={key}
              className="text-2xl w-6 font-black font-mono disabled:text-muted-foreground"
            >
              {key}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}
