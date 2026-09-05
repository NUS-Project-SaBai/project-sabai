-- Custom SQL migration file, put your code below! 
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

CREATE OR REPLACE FUNCTION log_medication_stock_changes()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id UUID;
  v_bypass TEXT;
BEGIN
  -- The bypass is used for seeding data in supabase/seeds
  v_bypass := current_setting('app.bypass_triggers', true);
  IF v_bypass = 'true' THEN
    RETURN NEW;
  END IF;

  v_user_id := get_current_user_id();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Action forbidden: User ID not found in auth.uid() or app.current_user_id variable.';
  END IF;

  -- HANDLE INSERT
  IF (TG_OP = 'INSERT') THEN
    INSERT INTO stock_changes (stock_id, field, previous_value, new_value, user_id, created_at)
    VALUES (NEW.id, 'quantity', '0', NEW.quantity::text, v_user_id, NOW());

    IF NEW.location IS NOT NULL AND NEW.location <> '' THEN
      INSERT INTO stock_changes (stock_id, field, previous_value, new_value, user_id, created_at)
      VALUES (NEW.id, 'location', '', NEW.location, v_user_id, NOW());
    END IF;

    IF NEW.stock_status IS NOT NULL THEN
      INSERT INTO stock_changes (stock_id, field, previous_value, new_value, user_id, created_at)
      VALUES (NEW.id, 'stock_status', '', NEW.stock_status::text, v_user_id, NOW());
    END IF;

    IF NEW.remarks IS NOT NULL AND NEW.remarks <> '' THEN
      INSERT INTO stock_changes (stock_id, field, previous_value, new_value, user_id, created_at)
      VALUES (NEW.id, 'remarks', '', NEW.remarks, v_user_id, NOW());
    END IF;

    RETURN NEW;
  END IF;

  -- HANDLE UPDATE
  IF (TG_OP = 'UPDATE') THEN
    IF OLD.location IS DISTINCT FROM NEW.location THEN
      INSERT INTO stock_changes (stock_id, field, previous_value, new_value, user_id, created_at)
      VALUES (NEW.id, 'location', COALESCE(OLD.location, ''), COALESCE(NEW.location, ''), v_user_id, NOW());
    END IF;

    IF OLD.quantity IS DISTINCT FROM NEW.quantity THEN
      INSERT INTO stock_changes (stock_id, field, previous_value, new_value, user_id, created_at)
      VALUES (NEW.id, 'quantity', OLD.quantity::text, NEW.quantity::text, v_user_id, NOW());
    END IF;

    IF OLD.stock_status IS DISTINCT FROM NEW.stock_status THEN
      INSERT INTO stock_changes (stock_id, field, previous_value, new_value, user_id, created_at)
      VALUES (NEW.id, 'stock_status', OLD.stock_status::text, NEW.stock_status::text, v_user_id, NOW());
    END IF;

    IF OLD.remarks IS DISTINCT FROM NEW.remarks THEN
      INSERT INTO stock_changes (stock_id, field, previous_value, new_value, user_id, created_at)
      VALUES (NEW.id, 'remarks', COALESCE(OLD.remarks, ''), COALESCE(NEW.remarks, ''), v_user_id, NOW());
    END IF;

    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_log_medication_stock_changes ON medication_stock;

CREATE TRIGGER trigger_log_medication_stock_changes
AFTER INSERT OR UPDATE ON medication_stock
FOR EACH ROW
EXECUTE FUNCTION log_medication_stock_changes();


