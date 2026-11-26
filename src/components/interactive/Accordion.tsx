import { ReactNode, useId, useState } from "react";
import { HiChevronDown } from "react-icons/hi2";
import { clsx } from "clsx";

/**
 * One collapsible section of an accordion. Sections open and close
 * independently, so several can be open at once. Stack them in a parent with
 * a border/divider to form the accordion.
 * @param title - Text shown in the always-visible header button.
 * @param defaultOpen - Whether the section starts expanded. Defaults to false.
 */
export function AccordionSection({
  title,
  defaultOpen = false,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const id = useId();
  const buttonId = `${id}-button`;
  const panelId = `${id}-panel`;

  return (
    <section>
      <h2>
        <button
          type="button"
          id={buttonId}
          aria-expanded={isOpen}
          aria-controls={panelId}
          onClick={() => setIsOpen((open) => !open)}
          className={clsx(
            "flex w-full items-center justify-between gap-4 border-l-4 px-5 py-4 text-left text-lg font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-400",
            isOpen
              ? "border-indigo-500 bg-indigo-50 text-indigo-900 hover:bg-indigo-100"
              : "border-transparent bg-slate-100 text-slate-900 hover:bg-slate-200",
          )}
        >
          {title}
          <HiChevronDown
            aria-hidden="true"
            className={clsx(
              "h-5 w-5 shrink-0 transition-transform",
              isOpen ? "rotate-180 text-indigo-700" : "text-slate-600",
            )}
          />
        </button>
      </h2>
      <div
        id={panelId}
        role="region"
        aria-labelledby={buttonId}
        hidden={!isOpen}
        className="border-t border-slate-200 bg-white px-6 pb-6"
      >
        {children}
      </div>
    </section>
  );
}
