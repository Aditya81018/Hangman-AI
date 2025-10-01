export type Parts =
  | "rope"
  | "face"
  | "body"
  | "left-arm"
  | "right-arm"
  | "left-leg"
  | "right-leg";

interface HangmanProps {
  hiddenParts?: Array<Parts>;
}

export default function Hangman({ hiddenParts }: HangmanProps) {
  // Helper function to check if a part should be visible
  const isVisible = (id: string): boolean =>
    !hiddenParts?.includes(id as Parts);

  return (
    <>
      <svg
        width="261"
        height="399"
        viewBox="0 0 261 399"
        // Note: I've added 'stroke-2' for better visibility on some parts that were otherwise hard to see
        className="stroke-primary fill-none"
        strokeWidth="8"
        strokeLinecap="round"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g id="gallows">
          {/* Base structure (usually always visible) */}
          <line id="base-1" x1="14" y1="385" x2="106" y2="385" />
          <path id="base-2" d="M60 383L60 13" />
          <path id="base-3" d="M60 13L194 13" />
          <line
            id="base-4"
            x1="60.4961"
            y1="74.3656"
            x2="111.366"
            y2="13.5039"
          />
        </g>

        {/* The hangman figure parts are conditionally rendered */}
        <g id="figure">
          {isVisible("rope") && (
            <line id="rope" x1="194" y1="14" x2="194" y2="66" />
          )}

          {isVisible("face") && <circle id="face" cx="194" cy="100" r="30" />}

          {isVisible("body") && <path id="body" d="M194 130L194 270" />}

          {isVisible("right-arm") && (
            <path id="right-arm" d="M137 186.569L193.569 130" />
          )}

          {isVisible("left-arm") && (
            <path id="left-arm" d="M194 130L250.569 186.569" />
          )}

          {isVisible("left-leg") && (
            <path id="right-leg" d="M137 326.569L193.569 270" />
          )}

          {isVisible("right-leg") && (
            <path id="left-leg" d="M194 270L250.569 326.569" />
          )}
        </g>
      </svg>
    </>
  );
}
