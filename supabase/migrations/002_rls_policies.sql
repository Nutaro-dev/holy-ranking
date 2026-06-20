-- Row Level Security policies

ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_rankings ENABLE ROW LEVEL SECURITY;
ALTER TABLE reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tried_status ENABLE ROW LEVEL SECURITY;

-- Helper: check if current user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM admin_users WHERE user_id = auth.uid()
  );
$$;

-- admin_users: users can read their own row
CREATE POLICY "admin_users_select_own"
  ON admin_users FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- product_lines: public read, admin write
CREATE POLICY "product_lines_select_all"
  ON product_lines FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "product_lines_insert_admin"
  ON product_lines FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "product_lines_update_admin"
  ON product_lines FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "product_lines_delete_admin"
  ON product_lines FOR DELETE
  TO authenticated
  USING (is_admin());

-- products: public read, admin write
CREATE POLICY "products_select_all"
  ON products FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "products_insert_admin"
  ON products FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "products_update_admin"
  ON products FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "products_delete_admin"
  ON products FOR DELETE
  TO authenticated
  USING (is_admin());

-- user_rankings: public read, own write
CREATE POLICY "user_rankings_select_all"
  ON user_rankings FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "user_rankings_insert_own"
  ON user_rankings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_rankings_update_own"
  ON user_rankings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_rankings_delete_own"
  ON user_rankings FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- reactions: public read, own write
CREATE POLICY "reactions_select_all"
  ON reactions FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "reactions_insert_own"
  ON reactions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "reactions_update_own"
  ON reactions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "reactions_delete_own"
  ON reactions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- tried_status: public read, own write
CREATE POLICY "tried_status_select_all"
  ON tried_status FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "tried_status_insert_own"
  ON tried_status FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "tried_status_update_own"
  ON tried_status FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "tried_status_delete_own"
  ON tried_status FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
