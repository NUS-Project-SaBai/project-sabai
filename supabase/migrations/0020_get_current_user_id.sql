-- Custom SQL migration file, put your code below! --
CREATE OR REPLACE FUNCTION get_current_user_id()
RETURNS UUID AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Check Supabase JWT claims context (set via request.jwt.claims)
  v_user_id := auth.uid();

  -- Fallback to app.current_user_id session variable
  IF v_user_id IS NULL THEN
    BEGIN
      v_user_id := NULLIF(current_setting('app.current_user_id', true), '')::UUID;
    EXCEPTION WHEN OTHERS THEN
      v_user_id := NULL;
    END;
  END IF;

  RETURN v_user_id;
END;
$$ LANGUAGE plpgsql STABLE;
