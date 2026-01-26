# Project Sa'bai

This is a local-first monorepo for "Project Sa'bai". This guide focuses on getting your local development environment running.

---

## 🛠 Prerequisites

Before you begin, ensure you have the following installed:

1.  **Node.js 20+**: [Download Link](https://nodejs.org/)
2.  **pnpm**: Recommended package manager.
    ```bash
    npm install -g pnpm
    ```
3.  **Docker Desktop**: Required for running the local Supabase instance. [Download Link](https://www.docker.com/products/docker-desktop/)
4.  **Supabase CLI**: Required to manage the local database.
    ```bash
    brew install supabase/tap/supabase  # macOS
    ```
    *   *Alternative:* You can use `npx supabase` via Node.js, but remember to prefix commands with `npx`.
    *   For other OS instructions, see the [Supabase CLI Installation Guide](https://supabase.com/docs/guides/local-development/cli/getting-started?queryGroups=platform&platform=macos#installing-the-supabase-cli).

---

## 🚀 Quick Start (Local Development)

Follow these steps in order to start developing.

### 1. Clone & Install Dependencies
Clone the repository and install the Node modules.

```bash
git clone <repository_url>
cd project-sabai
pnpm i
```

### 2. Start Local Supabase
Ensure Docker is running, then start the local Supabase stack. This spins up a full Postgres database, Auth server, and API gateway on your machine.

```bash
supabase start
```

> **Note:** The first time you run this, it may take a few minutes to download the Docker images.

### 3. Setup Environment Variables
Copy the example environment file.

```bash
cp .env.example .env
```

Now, populate `.env` with the values from your **local** Supabase instance.
Running `supabase status` will output the API URL and keys.

```bash
supabase status
```

Copy the output values into `.env`:

*   `APIs > Project URL` -> `NEXT_PUBLIC_SUPABASE_URL`
*   `Authentication Keys > Publishable` -> `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

Example `.env`:
```env
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_secret_PUBLISHABLE_KEY_HERE...
```

### 4. Run the Dev Server
Start the Next.js development server.

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🔐 Local Development Accounts

Sign in using the app's login page on your local development server (http://localhost:3000).

| Role | Email | Password |
|---|---|---|
| User | `user@test.com` | `password123` |
| Admin | `admin@test.com` | `password123` |

---

## 🛑 Stopping & Resetting

To stop the Supabase containers to save battery/memory:
```bash
supabase stop
```

To **completely wipe** the database and restart:
```bash
supabase db reset
```
