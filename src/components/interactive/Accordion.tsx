import { ReactNode, useId, useState } from "react";
import { HiChevronDown } from "react-icons/hi2";

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
          className="flex w-full items-center justify-between gap-4 px-6 py-4 text-left text-base font-semibold text-slate-900 transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-400"
        >
          {title}
          <HiChevronDown
            aria-hidden="true"
            className={`h-5 w-5 shrink-0 text-slate-500 transition-transform ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </button>
      </h2>
      <div
        id={panelId}
        role="region"
        aria-labelledby={buttonId}
        hidden={!isOpen}
        className="border-t border-slate-100 px-6 pb-6"
      >
        {children}
      </div>
    </section>
  );
}
