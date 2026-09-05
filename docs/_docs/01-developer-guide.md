---
title: Developer Guide
excerpt: Quick orientation to the project
permalink: /docs/developer-guide/
---

This guide helps orientate new developers to the project.

## 1. What we use in this project

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

## 2. Quick start (local)

- Follow the step-by-step instructions in README.
- Key commands:
  - Install: `pnpm i`
  - Start Supabase: `supabase start`
  - Run dev server: `pnpm dev`
  - See script details in [Appendix A: package.json scripts](#appendix-a-packagejson-scripts).

See [README.md](https://github.com/NUS-Project-SaBai/project-sabai/blob/dev/README.md) for full details and local credentials.

## 3. Project layout

```
project-sabai/
|-- src/
|   |-- pages/                 # Next.js routes
|   |   |-- api/
|   |   |   |-- trpc/
|   |   |   |   |-- [trpc].ts   # tRPC API handler (don't need to touch)
|   |   |-- index.tsx          # Home page
|   |-- components/            # Shared UI components
|   |   |-- interactive/RHF/   # RHF input components
|   |
|   |-- server/                # Main backend server
|   |   |-- context.ts         # tRPC context (auth)
|   |   |-- trpc.ts            # tRPC setup + procedures
|   |   |-- routers/           # Feature routers
|   |   |   |-- _app.ts        # Root router
|   |-- utils/
|   |   |-- trpc.ts            # tRPC React hooks
|   |-- db/
|   |   |-- schema/            # Drizzle schema (per-domain files + index.ts)
|   |   |-- drizzle.ts         # Drizzle client
|-- supabase/
|   |-- migrations/            # SQL migrations
|-- docs/                      # Jekyll documentation site
|   |-- _docs/                 # Documentation pages
|   |   |-- 01-developer-guide.md
|   |   |-- 03-drizzle-orm.md
|   |   |-- 04-trpc.md
```

Quick pointers:

- New page: add a file in [src/pages](https://github.com/NUS-Project-SaBai/project-sabai/tree/dev/src/pages).
- New UI component: add to [src/components](https://github.com/NUS-Project-SaBai/project-sabai/tree/dev/src/components).
- New API procedure: add to a router in [src/server/routers](https://github.com/NUS-Project-SaBai/project-sabai/tree/dev/src/server/routers) and mount in [src/server/routers/\_app.ts](https://github.com/NUS-Project-SaBai/project-sabai/blob/dev/src/server/routers/_app.ts).
- New DB table/column: edit the relevant domain file in [src/db/schema/](https://github.com/NUS-Project-SaBai/project-sabai/tree/dev/src/db/schema) and create a migration in [supabase/migrations](https://github.com/NUS-Project-SaBai/project-sabai/tree/dev/supabase/migrations).

## 4. Common tasks

### Add a new table or column

1. Update the Drizzle schema in the relevant domain file under [src/db/schema/](https://github.com/NUS-Project-SaBai/project-sabai/tree/dev/src/db/schema).
2. Generate a migration with Drizzle Kit.
3. Apply the migration to local Supabase.

See [Drizzle ORM docs]({{ '/docs/drizzle-orm/' | relative_url }}) for details and commands.

### Add a new page that calls the backend

1. Add or update a tRPC procedure
   - Create or update a router in [src/server/routers](https://github.com/NUS-Project-SaBai/project-sabai/tree/dev/src/server/routers) folder.
   - Use `publicProcedure` (no auth) or `protectedProcedure` (auth required).
   - Example reference: [src/server/routers/village_codes_router.ts](https://github.com/NUS-Project-SaBai/project-sabai/blob/dev/src/server/routers/village_codes_router.ts)

2. Ensure the router is mounted
   - Add it to the root router in [src/server/routers/\_app.ts](https://github.com/NUS-Project-SaBai/project-sabai/blob/dev/src/server/routers/_app.ts).

3. Create the page
   - Add `src/pages/my-page.tsx`.
   - We are using [hyphens instead of underscores](https://stackoverflow.com/questions/119312/urls-dash-vs-underscore) for spaces in route names

4. Call the procedure from the page
   - Use hooks from [src/utils/trpc.ts](https://github.com/NUS-Project-SaBai/project-sabai/blob/dev/src/utils/trpc.ts).

See [tRPC docs]({{ '/docs/trpc/' | relative_url }}) for a full walkthrough.

### Add a new UI component

- Place shared components in [src/components](https://github.com/NUS-Project-SaBai/project-sabai/tree/dev/src/components).

### Run and open this documentation site

This site is built with Jekyll. To preview it locally, run these commands from
the `docs/` folder:

1. Install the [Jekyll prerequisites](https://jekyllrb.com/docs/installation/) (Ruby + Bundler).
2. `bundle install`
3. `bundle exec jekyll serve`
4. Open <http://localhost:4000> in your browser.

See [Contributing to Documentation]({{ '/docs/contributing-to-documentation/' | relative_url }}) for
how to add new pages and sidebar links.

## 5. Auth model (short)

- Login sets HttpOnly cookies via Supabase.
- `createContext` reads cookies and provides `ctx.user`.
- `protectedProcedure` blocks requests without a user.

See [tRPC docs]({{ '/docs/trpc/' | relative_url }}) for the full flow.

## 6. Tips

- Validate inputs with Zod in each procedure.
- Keep router files focused by feature (one router per feature domain).
- List of React-Icons that can be imported in this project: [Font Awesome 5 React Icons](https://react-icons.github.io/react-icons/icons/fa/)

## Appendix A: package.json scripts

Use these commands from the project root:

| Script            | What it does                                             | When to use                                                                          |
| ----------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `pnpm dev`        | Starts Next.js in development mode.                      | Day-to-day local development.                                                        |
| `pnpm build`      | Builds the production bundle.                            | Before deploy checks and CI validation.                                              |
| `pnpm start`      | Runs the production build.                               | Local production-like smoke testing after `pnpm build`.                              |
| `pnpm lint`       | Runs ESLint checks.                                      | Runs before push. Note: It checks the current codebase, including uncommited changes |
| `pnpm format`     | Formats source files with Prettier.                      | Runs before every commit.                                                            |
| `pnpm seed:db`    | Resets local Supabase DB and reapplies migrations/seeds. | When you need a clean local database state.                                          |
| `pnpm seed:users` | Seeds auth users from `supabase/scripts/seed-users.ts`.  | When test users are missing locally.                                                 |
| `pnpm seed:all`   | Runs DB reset/seed, then user seeding.                   | Full local environment reset.                                                        |

> ⚠️ `pnpm seed:db` is destructive!
