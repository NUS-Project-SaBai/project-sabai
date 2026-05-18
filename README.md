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
*   `Authentication Keys > Secret` -> `SUPABASE_SECRET_KEY`
*   `Database > URL` -> `DATABASE_URL`

Add the other envars from our project. Reference the [.env.example](./.env.example) file

### 4. Seed Test Data
Seed your database and auth users.

```bash
# Seed domain data (village codes, patients, etc.)
pnpm seed:db

# Seed auth users (user@test.com / admin@test.com, password: password123)
pnpm seed:users

# Seed visits data
pnpm seed:visits
```

**Or run all:**
```bash
pnpm seed:all
```

### 5. Run the Dev Server
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

---

## 🧪 Testing the Backend API with Postman

### Prerequisites
- The dev server is running (`pnpm dev`)
- Postman has **"Automatically follow redirects"** enabled and the **cookie jar** active (on by default). This is required because the login response sets HttpOnly `sb-*` session cookies that Postman must store and replay automatically on all subsequent requests.

---

### 1. Login

Send a `POST` request to obtain a session:

| | |
|---|---|
| **Method** | `POST` |
| **URL** | `http://localhost:3000/api/login` |
| **Content-Type** | `application/json` |

**Body (raw JSON):**
```json
{
    "email": "user@test.com",
    "password": "password123"
}
```

A successful response returns HTTP 200 with the Supabase user object and sets `sb-*` session cookies in Postman's cookie jar. All protected endpoints below will use these cookies automatically.

For additional notes on tRPC API endpoint structure [see our tRPC documentation](docs/_docs/04-trpc.md#6-api-structure)

