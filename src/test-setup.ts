import "@testing-library/jest-dom";

// Workaround for vitest - mock HTMLDialogElement methods
// https://github.com/jsdom/jsdom/issues/3294
beforeAll(() => {
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
