-- One-off import of the member roster into public.users, linking each member to
-- their Supabase login by email. The email is only used for matching here and is
-- not stored in public.users (auth.users stays the single source of truth).
--
-- Do NOT commit the roster CSV: it contains members' personal data.
--
-- Usage (psql, not the Supabase SQL editor, since \copy is a psql command):
--   1. Edit the CSV path in the \copy line below.
--      CSV header: name,email,year,team,role,remarks
--      Leave email empty for members without a login.
--   2. psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/snippets/import_users.sql
--
-- Safe to run before or after migration 0026: if 0026 already created a
-- placeholder row for a login, that row is updated in place (keeping its ID, so
-- existing consults / stock_changes references stay valid).

\set ON_ERROR_STOP on

BEGIN;

CREATE TEMP TABLE users_import (LIKE public.users INCLUDING DEFAULTS) ON COMMIT DROP;
ALTER TABLE users_import ADD COLUMN email text;

\copy users_import (name, email, year, team, role, remarks) FROM 'path/to/roster.csv' WITH (FORMAT csv, HEADER true)

-- Emails that did not match any login. These members are still imported, but
-- with no login linked. Check for typos before committing.
SELECT i.name, i.email AS unmatched_email
FROM users_import i
WHERE NULLIF(trim(i.email), '') IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM auth.users a WHERE lower(a.email) = lower(trim(i.email))
  );

-- A duplicate email in the roster makes this fail ("cannot affect row a second
-- time" / unique violation) instead of linking two members to one login.
INSERT INTO public.users (name, year, team, role, remarks, auth_user_id)
SELECT i.name, i.year, i.team, i.role, i.remarks, a.id
FROM users_import i
LEFT JOIN auth.users a ON lower(a.email) = lower(trim(i.email))
ON CONFLICT (auth_user_id) DO UPDATE
SET name = EXCLUDED.name,
    year = EXCLUDED.year,
    team = EXCLUDED.team,
    role = EXCLUDED.role,
    remarks = EXCLUDED.remarks,
    updated_at = now();

COMMIT;
