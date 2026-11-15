-- Repoint consults.doctor_id and stock_changes.user_id from auth.users to public.users.
-- Existing values in those columns are auth user IDs, so they are rewritten to the
-- matching public.users IDs between dropping the old FKs and adding the new ones.

-- 1. Ensure every auth user has a linked public.users row. Rows already linked
--    (e.g. by the roster import in supabase/snippets/import_users.sql) are kept;
--    any remaining login gets a placeholder row to be filled in by hand later.
INSERT INTO "public"."users" ("auth_user_id", "name")
SELECT a."id", COALESCE(NULLIF(a."raw_user_meta_data"->>'display_name', ''), a."email", a."id"::text)
FROM "auth"."users" a
WHERE NOT EXISTS (
  SELECT 1 FROM "public"."users" u WHERE u."auth_user_id" = a."id"
);
--> statement-breakpoint
ALTER TABLE "consults" DROP CONSTRAINT "consults_doctor_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "stock_changes" DROP CONSTRAINT "stock_changes_user_id_users_id_fk";
--> statement-breakpoint

-- 2. Rewrite auth user IDs to public.users IDs.
UPDATE "consults" c
SET "doctor_id" = u."id"
FROM "public"."users" u
WHERE u."auth_user_id" = c."doctor_id";
--> statement-breakpoint
UPDATE "stock_changes" s
SET "user_id" = u."id"
FROM "public"."users" u
WHERE u."auth_user_id" = s."user_id";
--> statement-breakpoint

-- 3. Add the new FKs.
ALTER TABLE "consults" ADD CONSTRAINT "consults_doctor_id_users_id_fk" FOREIGN KEY ("doctor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_changes" ADD CONSTRAINT "stock_changes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint

-- 4. get_current_user_id() now returns a public.users ID.
--    - Authenticated requests: the public.users row linked to auth.uid(), or NULL
--      if the login has not been linked to a user yet.
--    - No auth.uid() (scripts, tests): app.current_user_id, which must hold a
--      public.users ID. This allows acting as users without a login.
CREATE OR REPLACE FUNCTION public.get_current_user_id()
RETURNS UUID AS $$
DECLARE
  v_auth_id UUID;
  v_user_id UUID;
BEGIN
  v_auth_id := auth.uid();

  IF v_auth_id IS NOT NULL THEN
    SELECT u.id INTO v_user_id
    FROM public.users u
    WHERE u.auth_user_id = v_auth_id;

    RETURN v_user_id;
  END IF;

  BEGIN
    v_user_id := NULLIF(current_setting('app.current_user_id', true), '')::UUID;
  EXCEPTION WHEN OTHERS THEN
    v_user_id := NULL;
  END;

  RETURN v_user_id;
END;
$$ LANGUAGE plpgsql STABLE SET search_path = '';
