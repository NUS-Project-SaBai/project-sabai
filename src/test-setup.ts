import "@testing-library/jest-dom";
// Load .env into process.env so server/router integration tests (node
// environment) can read DATABASE_URL and the other server-only vars validated
// by src/lib/envVariables.ts. Harmless for jsdom component tests.
import "dotenv/config";
import { isDatabaseLocal } from "@/lib/environmentUtils";

// Guard: refuse to run node-environment (server/integration) tests against a
// non-local database. This prevents accidental data loss if someone has
// dev/production credentials in their .env and runs the test suite.
if (typeof window === "undefined" && !isDatabaseLocal()) {
  throw new Error(
    `Integration tests refused: DATABASE_URL does not point to localhost.\n` +
      `Run \`supabase start\` and ensure .env points to the local instance.`,
  );
}

// Workaround for vitest - mock HTMLDialogElement methods
// https://github.com/jsdom/jsdom/issues/3294
beforeAll(() => {
  // Server/router integration tests run with `@vitest-environment node`, where window is undefined.
  if (typeof window === "undefined") return;

  HTMLDialogElement.prototype.show = vi.fn(function (this: HTMLDialogElement) {
    this.setAttribute("open", "");
  });
  HTMLDialogElement.prototype.showModal = vi.fn(function (
    this: HTMLDialogElement,
  ) {
    this.setAttribute("open", "");
  });
  HTMLDialogElement.prototype.close = vi.fn(function (this: HTMLDialogElement) {
    this.removeAttribute("open");
  });

  // Jsdom does not implement window.matchMedia by default, see below website for explanation:
  // https://rebeccamdeprey.com/blog/mock-windowmatchmedia-in-vitest
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(), // deprecated
      removeListener: vi.fn(), // deprecated
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
});
