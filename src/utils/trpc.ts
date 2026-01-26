import { httpBatchStreamLink, loggerLink } from "@trpc/client";
import { createTRPCNext } from "@trpc/next";
import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "../server/routers/_app";
import { transformer } from "./transformer";

function getBaseUrl() {
  if (typeof window !== "undefined")
    // browser should use relative path
    return "";
  if (process.env.VERCEL_URL)
    // reference for vercel.com
    return `https://${process.env.VERCEL_URL}`;
  if (process.env.RENDER_INTERNAL_HOSTNAME)
    // reference for render.com
    return `http://${process.env.RENDER_INTERNAL_HOSTNAME}:${process.env.PORT}`;
  // assume localhost
  return `http://localhost:${process.env.PORT ?? 3000}`;
}

/**
 * A set of strongly-typed React hooks from your `AppRouter` type signature with `createReactQueryHooks`.
 * @see https://trpc.io/docs/v11/react#3-create-trpc-hooks
 */
export const trpc = createTRPCNext<AppRouter>({
  config() {
    /**
     * If you want to use SSR, you need to use the server's full URL
     * @see https://trpc.io/docs/v11/ssr
     */
    return {
      /**
       * @see https://trpc.io/docs/v11/client/links
       */
      links: [
        // adds pretty logs to your console in development and logs errors in production
        loggerLink({
          enabled: (opts) =>
            process.env.NODE_ENV === "development" ||
            (opts.direction === "down" && opts.result instanceof Error),
        }),
        httpBatchStreamLink({
          url: `${getBaseUrl()}/api/trpc`,
          /**
           * Cookies are sent automatically by the browser.
           * No need to manually attach Authorization headers.
           */
          transformer,
        }),
      ],
      /**
       * @see https://tanstack.com/query/v5/docs/reference/QueryClient
       */
      // queryClientConfig: { defaultOptions: { queries: { staleTime: 60 } } },
    };
  },
  /**
   * @see https://trpc.io/docs/v11/ssr
   */
  ssr: false,
  /**
   * @see https://trpc.io/docs/v11/data-transformers
   */
  transformer,
});

export type RouterInput = inferRouterInputs<AppRouter>;
export type RouterOutput = inferRouterOutputs<AppRouter>;
