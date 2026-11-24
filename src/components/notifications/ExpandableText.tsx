import { useState } from "react";
import { clsx } from "clsx";

// Long text starts collapsed so one broadcast can't push the rest off screen.
const COLLAPSE_AFTER_CHARS = 200;
const COLLAPSE_AFTER_LINES = 3;

function isLongText(text: string) {
  return (
    text.length > COLLAPSE_AFTER_CHARS ||
    text.split("\n").length > COLLAPSE_AFTER_LINES
  );
}

export default function ExpandableText({
  text,
  className = "",
}: {
  text: string;
  className?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const isLong = isLongText(text);

  return (
    <div className={className}>
      <p
        className={clsx(
          "whitespace-pre-line break-words",
          isLong && !expanded && "line-clamp-3",
        )}
      >
        {text}
      </p>
      {isLong && (
        <button
          type="button"
          aria-expanded={expanded}
          className="mt-1 text-xs font-medium text-blue-600 hover:cursor-pointer hover:underline"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? "Show less" : "Show more"}
        </button>
      )}
    </div>
  );
}
