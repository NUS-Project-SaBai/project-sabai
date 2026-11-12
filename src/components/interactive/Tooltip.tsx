import { ReactNode, useState } from "react";

/**
 * Shows `content` in a bubble above `children` while the pointer is over them
 * or focus is inside them. The hover is tracked on a wrapper, so it also works
 * around disabled inputs, which do not fire mouse events themselves.
 *
 * The bubble stays in the DOM (hidden) so the wrapped control can point
 * `aria-describedby` at `id` and screen readers still get the text.
 * @param id - id for the tooltip element, for `aria-describedby` on the control.
 * @param content - Text shown in the tooltip.
 */
export function Tooltip({
  id,
  content,
  children,
}: {
  id: string;
  content: string;
  children: ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
      onFocus={() => setIsOpen(true)}
      onBlur={() => setIsOpen(false)}
    >
      {children}
      <span
        id={id}
        role="tooltip"
        hidden={!isOpen}
        className="absolute bottom-full left-0 z-10 mb-2 w-max max-w-xs rounded-md bg-slate-800 px-3 py-2 text-xs font-normal text-white shadow-lg"
      >
        {content}
      </span>
    </span>
  );
}
