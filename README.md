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
# Seed domain data (patients, etc.)
pnpm seed:db

# Seed auth users (user@test.com / admin@test.com, password: password123)
pnpm seed:users
```

**Or run both:**
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

---

### 2. tRPC Endpoint Structure

All API logic is exposed via [tRPC](https://trpc.io/) under `/api/trpc/`.

#### Queries (GET)

```
GET /api/trpc/<router>.<procedure>?batch=1&input=<URL-encoded JSON>
```

The `batch=1` parameter indicates a single-procedure call. The `input` query param is a URL-encoded JSON object with the shape:

```json
{"0": {"json": <your input object>}}
```

**Example — `villageCodesRouter.list`:**
```
http://localhost:3000/api/trpc/villageCodesRouter.list?batch=1&input=%7B%220%22%3A%7B%22json%22%3A%7B%22includeHidden%22%3Afalse%7D%7D%7D
```

Decoded `input`:
```json
{"0": {"json": {"includeHidden": false}}}
```

#### Mutations — JSON body (POST)

Used for mutations that **do not** involve file uploads.

| | |
|---|---|
| **Method** | `POST` |
| **URL** | `http://localhost:3000/api/trpc/<router>.<procedure>` |
| **Content-Type** | `application/json` |

**Body (raw JSON):**
```json
[{"json": <your input object>}]
```

**Example — `villageCodesRouter.delete`:**
```json
[{"json": {"id": 1}}]
```

#### Mutations — form-data (POST)

Used for mutations that carry **file uploads** (e.g. `patientsRouter.create`, `patientsRouter.update`). Set the body type to `form-data` in Postman — do **not** set `Content-Type` manually, as Postman will add the correct `multipart/form-data` boundary automatically.

| | |
|---|---|
| **Method** | `POST` |
| **URL** | `http://localhost:3000/api/trpc/<router>.<procedure>` |
| **Body type** | `form-data` |

**Example — `patientsRouter.create` form fields:**

| Key | Type | Example Value |
|---|---|---|
| `name` | Text | `Jane Doe` |
| `identificationNumber` | Text | `123456789` |
| `gender` | Text | `female` |
| `dateOfBirth` | Text | `1990-01-15` |
| `drugAllergy` | Text | `penicillin` |
| `hasPoorCard` | Text | `true` |
| `hasBS2Card` | Text | `false` |
| `hasSabaiCard` | Text | `false` |
| `patientImage` | File | _(select a file)_ |
