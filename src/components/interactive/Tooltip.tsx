import { PointerEvent, ReactNode, useEffect, useRef, useState } from "react";

/** How long a tooltip opened by a tap stays up before hiding on its own. */
export const TOUCH_DISPLAY_MS = 4000;

/**
 * Shows `content` in a bubble above `children`.
 *
 * - Mouse: shown while the pointer is over the wrapper.
 * - Touch/pen: a tap shows it for `TOUCH_DISPLAY_MS`, or until the user taps
 *   somewhere else. Touch has no real hover, and the hover browsers emulate
 *   after a tap ends at different times, so it is not relied on.
 * - Keyboard: shown while focus is inside the wrapper.
 *
 * Pointer events are tracked on a wrapper, so it also works around disabled
 * inputs, which do not fire mouse events themselves.
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
  const wrapperRef = useRef<HTMLSpanElement>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  function show() {
    clearTimeout(hideTimer.current);
    setIsOpen(true);
  }

  function hide() {
    clearTimeout(hideTimer.current);
    setIsOpen(false);
  }

  function handlePointerEnter(event: PointerEvent) {
    if (event.pointerType === "mouse") show();
  }

  function handlePointerLeave(event: PointerEvent) {
    if (event.pointerType === "mouse") hide();
  }

  function handlePointerDown(event: PointerEvent) {
    if (event.pointerType === "mouse") return;
    show();
    hideTimer.current = setTimeout(() => setIsOpen(false), TOUCH_DISPLAY_MS);
  }

  // While open, a tap or click anywhere outside the wrapper dismisses it.
  useEffect(() => {
    if (!isOpen) return;
    function handleOutsidePointerDown(event: globalThis.PointerEvent) {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        clearTimeout(hideTimer.current);
        setIsOpen(false);
      }
    }
    document.addEventListener("pointerdown", handleOutsidePointerDown);
    return () =>
      document.removeEventListener("pointerdown", handleOutsidePointerDown);
  }, [isOpen]);

  // Don't leave a pending hide running after unmount.
  useEffect(() => () => clearTimeout(hideTimer.current), []);

  return (
    <span
      ref={wrapperRef}
      className="relative inline-flex"
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      onPointerDown={handlePointerDown}
      // Focus never sets a timer, so a tap that also focuses the control
      // keeps the tap's timeout.
      onFocus={() => setIsOpen(true)}
      onBlur={hide}
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
