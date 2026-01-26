# tRPC Setup Documentation

This document explains how tRPC is configured in this project, including authentication via Supabase and the data flow between client and server.

## Table of Contents

1. [Setup Overview](#1-setup-overview)
2. [Context Flow (Authentication)](#2-context-flow-authentication)
3. [Auth Middleware](#3-auth-middleware)
4. [Usage Examples](#4-usage-examples)
5. [Environment Variables](#5-environment-variables)
6. [Troubleshooting](#6-troubleshooting)

---

## 1. Setup Overview

### Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14+ (Pages Router) |
| API Layer | tRPC v11 |
| Auth | Supabase Auth (HttpOnly cookies via `@supabase/ssr`) |
| Database | Supabase Postgres + Drizzle ORM |
| Validation | Zod |

### Folder Structure

```
src/
├── lib/
│   └── supabaseClient.ts      # Browser-side Supabase client
├── middleware.ts              # Next.js middleware for session refresh
├── pages/
│   └── api/
│       └── trpc/
│           └── [trpc].ts      # tRPC API handler (catch-all route)
├── server/
│   ├── context.ts             # Creates tRPC context with user from cookies
│   ├── trpc.ts                # tRPC initialization, procedures, middleware
│   └── routers/
│       ├── _app.ts            # Root router (merges all sub-routers)
│       └── villageCodeRouters.ts  # Example feature router
└── utils/
    ├── trpc.ts                # tRPC React client hooks
    └── transformer.ts         # SuperJSON transformer for Date/Map/Set
```

### How Client and Server Connect

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              BROWSER                                    │
├─────────────────────────────────────────────────────────────────────────┤
│  React Component                                                        │
│       │                                                                 │
│       ▼                                                                 │
│  trpc.villageCodeRouter.list.useQuery()   (from utils/trpc.ts)         │
│       │                                                                 │
│       ▼                                                                 │
│  httpBatchStreamLink → POST /api/trpc/villageCodeRouter.list           │
│       │                          (cookies sent automatically)           │
└───────┼─────────────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           NEXT.JS SERVER                                │
├─────────────────────────────────────────────────────────────────────────┤
│  middleware.ts                                                          │
│       │  (refreshes expired Supabase tokens, sets new cookies)          │
│       ▼                                                                 │
│  pages/api/trpc/[trpc].ts                                              │
│       │                                                                 │
│       ▼                                                                 │
│  createContext({ req, res })   →   ctx.user (from Supabase)            │
│       │                                                                 │
│       ▼                                                                 │
│  appRouter → villageCodeRouter.list   (procedure executes)             │
│       │                                                                 │
│       ▼                                                                 │
│  Response (JSON) ─────────────────────────────────────────────────────▶│
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Context Flow (Authentication)

This project uses **HttpOnly cookies** for authentication, which is more secure than storing tokens in JavaScript-accessible storage.

### Step-by-Step Flow

#### 1. User Logs In (Browser)

```typescript
// lib/supabaseClient.ts - uses createBrowserClient from @supabase/ssr
import { createBrowserClient } from "@supabase/ssr";

export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
);

// Login triggers Supabase to set HttpOnly cookies automatically
await supabase.auth.signInWithPassword({ email, password });
```

When a user logs in, Supabase sets several HttpOnly cookies:
- `sb-<project-ref>-auth-token` — Contains the access token and refresh token

#### 2. Browser Makes tRPC Request

```typescript
// utils/trpc.ts - cookies are sent automatically
httpBatchStreamLink({
  url: `${getBaseUrl()}/api/trpc`,
  // No manual Authorization header needed!
  // Cookies are attached automatically by the browser.
  transformer,
}),
```

#### 3. Middleware Refreshes Session

```typescript
// middleware.ts - runs BEFORE API routes
export async function middleware(request: NextRequest) {
  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        // Update cookies on request (for downstream handlers)
        // Update cookies on response (for browser)
      },
    },
  });

  // This refreshes expired tokens automatically
  await supabase.auth.getUser();

  return supabaseResponse;
}
```

#### 4. Context Extracts User from Cookies

```typescript
// server/context.ts
export const createContext = async ({ req, res }: CreateNextContextOptions) => {
  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        // Parse cookies from the raw header string
        return parseCookieHeader(req.headers.cookie ?? "").filter(
          (cookie): cookie is { name: string; value: string } =>
            cookie.value !== undefined
        );
      },
      setAll(cookiesToSet) {
        // Write refreshed cookies back to the response
        cookiesToSet.forEach(({ name, value, options }) => {
          res.appendHeader("Set-Cookie", serializeCookieHeader(name, value, options));
        });
      },
    },
  });

  // Validate the session and get the user
  const { data: { user } } = await supabase.auth.getUser();

  return {
    req,
    res,
    user, // null if not authenticated
  };
};
```

#### 5. Procedure Accesses `ctx.user`

```typescript
// server/routers/villageCodeRouters.ts
list: protectedProcedure
  .input(z.object({ includeHidden: z.boolean().default(false) }))
  .query(async ({ ctx, input }) => {
    // ctx.user is guaranteed to be non-null in protectedProcedure
    console.log("Request by:", ctx.user.email);
    
    return await db.query.villageCodes.findMany({...});
  }),
```

---

## 3. Auth Middleware

### Procedure Types

The tRPC server defines two procedure types in `server/trpc.ts`:

#### `publicProcedure`

Anyone can call this, even unauthenticated users.

```typescript
export const publicProcedure = t.procedure;
```

#### `protectedProcedure`

Only authenticated users can call this. Throws `UNAUTHORIZED` if `ctx.user` is null.

```typescript
const isAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({
    ctx: {
      ...ctx,
      // TypeScript now knows `user` is non-nullable
      user: ctx.user,
    },
  });
});

export const protectedProcedure = t.procedure.use(isAuthed);
```

### How It Works

1. Every request goes through `createContext()`, which sets `ctx.user` (or `null`).
2. `protectedProcedure` adds a middleware that checks `ctx.user`.
3. If `ctx.user` is `null`, it throws a `TRPCError` with code `UNAUTHORIZED`.
4. The client receives a 401 response.

---

## 4. Usage Examples

### Defining Routes

#### Public Route (No Auth Required)

```typescript
// server/routers/_app.ts
import { publicProcedure, router } from '../trpc';

export const appRouter = router({
  healthcheck: publicProcedure.query(() => 'yay!'),
});
```

#### Protected Route (Auth Required)

```typescript
// server/routers/villageCodeRouters.ts
import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { db } from "@/db/drizzle";
import { villageCodes } from "@/db/schema";

export const villageCodeRouter = router({
  list: protectedProcedure
    .input(z.object({ includeHidden: z.boolean().default(false) }))
    .query(async ({ ctx, input }) => {
      // ctx.user is typed as non-nullable here
      return await db.query.villageCodes.findMany({
        where: input.includeHidden ? undefined : eq(villageCodes.isVisible, true),
      });
    }),

  create: protectedProcedure
    .input(z.object({
      code: z.string().min(1),
      name: z.string().min(1),
      colorHex: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/),
    }))
    .mutation(async ({ input }) => {
      const [newCode] = await db.insert(villageCodes).values(input).returning();
      return newCode;
    }),
});
```

### Calling from React Components

#### Query (Fetching Data)

```tsx
import { trpc } from "@/utils/trpc";

function VillageCodeList() {
  const { data, isLoading, error } = trpc.villageCodeRouter.list.useQuery({
    includeHidden: false,
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <ul>
      {data?.map((code) => (
        <li key={code.id}>{code.name}</li>
      ))}
    </ul>
  );
}
```

#### Mutation (Creating/Updating Data)

```tsx
import { trpc } from "@/utils/trpc";

function CreateVillageCode() {
  const utils = trpc.useUtils();
  
  const createMutation = trpc.villageCodeRouter.create.useMutation({
    onSuccess: () => {
      // Invalidate and refetch the list
      utils.villageCodeRouter.list.invalidate();
    },
    onError: (error) => {
      if (error.data?.code === "UNAUTHORIZED") {
        alert("Please log in to create village codes");
      }
    },
  });

  const handleSubmit = (formData: FormData) => {
    createMutation.mutate({
      code: formData.get("code") as string,
      name: formData.get("name") as string,
      colorHex: "#3b82f6",
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* form fields */}
      <button disabled={createMutation.isLoading}>
        {createMutation.isLoading ? "Creating..." : "Create"}
      </button>
    </form>
  );
}
```

#### Error Handling

```tsx
const { data, error } = trpc.villageCodeRouter.list.useQuery({ includeHidden: false });

if (error) {
  switch (error.data?.code) {
    case "UNAUTHORIZED":
      return <RedirectToLogin />;
    case "NOT_FOUND":
      return <NotFoundMessage />;
    case "INTERNAL_SERVER_ERROR":
      return <GenericError />;
    default:
      return <div>Something went wrong</div>;
  }
}
```

---

## 5. Environment Variables

Create a `.env` file in the project root:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key-here

# Optional: For server-side admin operations (NEVER expose to browser)
# SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Variable Descriptions

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | ✅ | The **publishable** (public) key. Safe for browser. Used for auth flows. |
| `SUPABASE_SERVICE_ROLE_KEY` | ❌ | Admin key. **Never expose to browser.** Only use in server-side code for admin operations. |

> ⚠️ **Security Note**: Variables prefixed with `NEXT_PUBLIC_` are bundled into the client JavaScript. Never put sensitive keys there.

---

## 6. Troubleshooting

### Problem: `ctx.user` is always `null`

**Possible Causes & Fixes:**

1. **Cookies not being sent**
   - Check browser DevTools → Network tab → Request Headers → `Cookie`
   - Ensure `middleware.ts` is in `src/` (not `src/pages/`)
   - Verify the middleware matcher isn't excluding `/api/trpc`

2. **Middleware not running**
   - Add a `console.log` at the top of `middleware.ts` to verify it executes
   - Check `matcher` config isn't too restrictive

3. **Cookie parsing error**
   - Ensure `parseCookieHeader` is imported from `@supabase/ssr`
   - Check that `req.headers.cookie` isn't malformed

4. **Session expired and not refreshed**
   - The middleware should call `await supabase.auth.getUser()` to trigger refresh
   - Verify `setAll` correctly writes cookies to the response

**Debug Snippet:**

```typescript
// Add to server/context.ts temporarily
export const createContext = async ({ req, res }: CreateNextContextOptions) => {
  console.log("Raw cookies:", req.headers.cookie);
  
  const supabase = createServerClient(/* ... */);
  
  const { data: { user }, error } = await supabase.auth.getUser();
  console.log("User:", user?.email ?? "null");
  console.log("Error:", error?.message ?? "none");
  
  return { req, res, user };
};
```

### Problem: 404 on tRPC routes

**Cause:** The API route file is in the wrong location.

**Fix:** Ensure the file is at:
```
src/pages/api/trpc/[trpc].ts
```

Not at:
```
src/pages/api/[trpc].ts  ❌
```

The URL path is `/api/trpc/procedureName`, so the file must be in a `trpc/` folder.

### Problem: Type errors with `ctx.user`

**Cause:** TypeScript doesn't know `user` is non-null in `protectedProcedure`.

**Fix:** The `isAuthed` middleware should narrow the type:

```typescript
const isAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user, // This narrows the type
    },
  });
});
```

### Problem: CORS errors in development

**Cause:** Making requests to the wrong origin.

**Fix:** Ensure `getBaseUrl()` returns an empty string on the client:

```typescript
function getBaseUrl() {
  if (typeof window !== "undefined") return ""; // Relative URL
  // ... server-side logic
}
```

### Problem: Stale data after mutations

**Fix:** Invalidate queries after mutations:

```typescript
const utils = trpc.useUtils();

const mutation = trpc.villageCodeRouter.create.useMutation({
  onSuccess: () => {
    utils.villageCodeRouter.list.invalidate();
  },
});
```

### Problem: `superjson` transformer errors

**Cause:** Mismatched transformers between client and server.

**Fix:** Ensure both use the same transformer:

```typescript
// utils/transformer.ts
import superjson from "superjson";
export const transformer = superjson;

// server/trpc.ts
import { transformer } from "@/utils/transformer";
const t = initTRPC.context<Context>().create({ transformer });

// utils/trpc.ts
import { transformer } from "./transformer";
export const trpc = createTRPCNext<AppRouter>({
  config() {
    return {
      links: [httpBatchStreamLink({ transformer, /* ... */ })],
    };
  },
  transformer,
});
```

---

## Quick Reference

### Creating a New Router

1. Create `src/server/routers/myFeatureRouter.ts`
2. Define procedures using `publicProcedure` or `protectedProcedure`
3. Register in `src/server/routers/_app.ts`:

```typescript
import { myFeatureRouter } from './myFeatureRouter';

export const appRouter = router({
  myFeature: myFeatureRouter,
});
```

### Accessing the User in Procedures

```typescript
// In protectedProcedure, ctx.user is guaranteed non-null
myProcedure: protectedProcedure.query(({ ctx }) => {
  const userId = ctx.user.id;
  const email = ctx.user.email;
  // ...
});
```

### Typed Inputs/Outputs

```typescript
// Get input/output types for any procedure
import type { RouterInput, RouterOutput } from "@/utils/trpc";

type ListInput = RouterInput["villageCodeRouter"]["list"];
// { includeHidden: boolean }

type ListOutput = RouterOutput["villageCodeRouter"]["list"];
// VillageCode[]
```
