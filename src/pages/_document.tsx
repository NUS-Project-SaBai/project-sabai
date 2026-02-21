import { Html, Head, Main, NextScript } from "next/document";

/**
 * Custom Next.js Document component that overrides the default HTML document structure.
 *
 * This component is used to customize the HTML document that wraps every page in the application.
 * It runs on the server-side and is used to modify the initial HTML markup before it's sent to the browser.
 *
 * Key features:
 * - Sets the document language to English for accessibility and SEO
 * - Configures the document title for the Sa'Bai Biometrics application
 * - Applies antialiasing CSS class to improve text rendering
 * - Provides the foundation HTML structure for all pages
 *
 * Note: This is different from _app.tsx - while _app.tsx wraps the page component,
 * _document.tsx wraps the entire HTML document and only runs on the server.
 *
 * @returns {JSX.Element} The HTML document structure with custom settings
 * @see {@link https://nextjs.org/docs/advanced-features/custom-document} Next.js Custom Document documentation
 */
export default function Document() {
  return (
    <Html lang="en">
      <Head title="Sa'Bai Biometrics" />
      <body className="antialiased">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
