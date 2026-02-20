# Developer Guide (Quick)

This guide helps orientate new developers to the project.

## 1) What we use in this project

- Next.js (Pages Router): Web framework and routing.
- React: UI rendering and component model.
- tRPC: Typesafe API layer between client and server.
- @tanstack/react-query: Client data fetching, caching, and mutations.
- Supabase Auth: Authentication and session cookies.
- Drizzle ORM: Typesafe database queries and schema.
- Zod: Runtime input validation for API procedures.
- Tailwind CSS: Utility-first styling.
- superjson: Data transformer for non-JSON types in tRPC.
- react-hook-form: Form state management.

## 2) Quick start (local)

- Follow the step-by-step instructions in README.
- Key commands:
  - Install: `pnpm i`
  - Start Supabase: `supabase start`
  - Run dev server: `pnpm dev`
   - See script details in [Appendix A: package.json scripts](#appendix-a-packagejson-scripts).

See [README.md](../README.md) for full details and local credentials.

## 3) Project layout

```
project-sabai/
|-- src/
|   |-- pages/                 # Next.js routes
|   |   |-- api/
|   |   |   |-- trpc/
|   |   |   |   |-- [trpc].ts   # tRPC API handler
|   |   |-- index.tsx          # Home page
|   |-- components/            # Shared UI components
|   |   |-- inputs/            # RHF input components
|   |-- server/
|   |   |-- context.ts         # tRPC context (auth)
|   |   |-- trpc.ts            # tRPC setup + procedures
|   |   |-- routers/           # Feature routers
|   |   |   |-- _app.ts        # Root router
|   |   |   |-- villageCodeRouters.ts
|   |-- utils/
|   |   |-- trpc.ts            # tRPC React hooks
|   |   |-- transformer.ts     # superjson transformer
|   |-- db/
|   |   |-- schema.ts          # Drizzle schema
|   |   |-- drizzle.ts         # Drizzle client
|-- supabase/
|   |-- migrations/            # SQL migrations
|-- docs/
|   |-- developer-guide.md
|   |-- trpc.md
|   |-- orm.md
```

Quick pointers:

- New page: add a file in [src/pages](../src/pages).
- New UI component: add to [src/components](../src/components).
- New API procedure: add to a router in [src/server/routers](../src/server/routers) and mount in [src/server/routers/\_app.ts](../src/server/routers/_app.ts).
- New DB table/column: edit [src/db/schema.ts](../src/db/schema.ts) and create a migration in [supabase/migrations](../supabase/migrations).

## 4) Common tasks

### Add a new page that calls the backend

1. Add or update a tRPC procedure
   - Create or update a router in [src/server/routers](../src/server/routers).
   - Use `publicProcedure` (no auth) or `protectedProcedure` (auth required).
   - Example reference: [src/server/routers/villageCodeRouters.ts](../src/server/routers/villageCodeRouters.ts)

2. Ensure the router is mounted
   - Add it to the root router in [src/server/routers/\_app.ts](../src/server/routers/_app.ts).

3. Create the page
   - Add `src/pages/my-page.tsx`.

4. Call the procedure from the page
   - Use hooks from [src/utils/trpc.ts](../src/utils/trpc.ts).

See [docs/trpc.md](./trpc.md) for a full walkthrough.

### Add a new table or column

1. Update Drizzle schema in [src/db/schema.ts](../src/db/schema.ts).
2. Generate a migration with Drizzle Kit.
3. Apply the migration to local Supabase.

See [docs/orm.md](./orm.md) for details and commands.

### Add a new UI component

- Place shared components in [src/components](../src/components).

## 5) Auth model (short)

- Login sets HttpOnly cookies via Supabase.
- `createContext` reads cookies and provides `ctx.user`.
- `protectedProcedure` blocks requests without a user.

See [docs/trpc.md](./trpc.md) for the full flow.

## 6) Tips

- Validate inputs with Zod in each procedure.
- Keep router files focused by feature (one router per feature domain).
- List of React-Icons that can be imported in this project: [Font Awesome 5 React Icons](https://react-icons.github.io/react-icons/icons/fa/)

## Appendix A: package.json scripts

Use these commands from the project root:

| Script | What it does | When to use |
|---|---|---|
| `pnpm dev` | Starts Next.js in development mode. | Day-to-day local development. |
| `pnpm build` | Builds the production bundle. | Before deploy checks and CI validation. |
| `pnpm start` | Runs the production build. | Local production-like smoke testing after `pnpm build`. |
| `pnpm lint` | Runs ESLint checks. | Runs before push. Note: It checks the current codebase, including uncommited changes |
| `pnpm format` | Formats source files with Prettier. | Runs before every commit. |
| `pnpm seed:db` | Resets local Supabase DB and reapplies migrations/seeds. | When you need a clean local database state. |
| `pnpm seed:users` | Seeds auth users from `supabase/scripts/seed-users.ts`. | When test users are missing locally. |
| `pnpm seed:all` | Runs DB reset/seed, then user seeding. | Full local environment reset. |

> ⚠️ `pnpm seed:db` is destructive! 
