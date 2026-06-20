-- Holy Ranking — full cloud setup (paste into Supabase Dashboard → SQL Editor)
-- Safe to re-run: uses IF NOT EXISTS where possible.

-- ========== 001_schema.sql ==========
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS admin_users (
  user_id uuid REFERENCES auth.users(id) PRIMARY KEY
);

CREATE TABLE IF NOT EXISTS product_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  color_hex text,
  caffeine_typical boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_line_id uuid REFERENCES product_lines(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  image_url text,
  caffeine_mg int,
  is_seasonal boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_rankings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  product_id uuid REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  rank_position int NOT NULL,
  star_rating numeric(2,1),
  review_text text,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, product_id)
);

CREATE TABLE IF NOT EXISTS reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  product_id uuid REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  reaction text CHECK (reaction IN ('like', 'dislike')) NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, product_id)
);

CREATE TABLE IF NOT EXISTS tried_status (
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  product_id uuid REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  tried boolean DEFAULT true,
  updated_at timestamptz DEFAULT now(),
  PRIMARY KEY (user_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_line ON products(product_line_id);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_user_rankings_user ON user_rankings(user_id, rank_position);
CREATE INDEX IF NOT EXISTS idx_reactions_product ON reactions(product_id);
CREATE INDEX IF NOT EXISTS idx_tried_status_user ON tried_status(user_id);

-- ========== 002_rls_policies.sql ==========
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_rankings ENABLE ROW LEVEL SECURITY;
ALTER TABLE reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tried_status ENABLE ROW LEVEL SECURITY;

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

DROP POLICY IF EXISTS "admin_users_select_own" ON admin_users;
CREATE POLICY "admin_users_select_own"
  ON admin_users FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "product_lines_select_all" ON product_lines;
CREATE POLICY "product_lines_select_all"
  ON product_lines FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "product_lines_insert_admin" ON product_lines;
CREATE POLICY "product_lines_insert_admin"
  ON product_lines FOR INSERT TO authenticated WITH CHECK (is_admin());

DROP POLICY IF EXISTS "product_lines_update_admin" ON product_lines;
CREATE POLICY "product_lines_update_admin"
  ON product_lines FOR UPDATE TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "product_lines_delete_admin" ON product_lines;
CREATE POLICY "product_lines_delete_admin"
  ON product_lines FOR DELETE TO authenticated USING (is_admin());

DROP POLICY IF EXISTS "products_select_all" ON products;
CREATE POLICY "products_select_all"
  ON products FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "products_insert_admin" ON products;
CREATE POLICY "products_insert_admin"
  ON products FOR INSERT TO authenticated WITH CHECK (is_admin());

DROP POLICY IF EXISTS "products_update_admin" ON products;
CREATE POLICY "products_update_admin"
  ON products FOR UPDATE TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "products_delete_admin" ON products;
CREATE POLICY "products_delete_admin"
  ON products FOR DELETE TO authenticated USING (is_admin());

DROP POLICY IF EXISTS "user_rankings_select_all" ON user_rankings;
CREATE POLICY "user_rankings_select_all"
  ON user_rankings FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "user_rankings_insert_own" ON user_rankings;
CREATE POLICY "user_rankings_insert_own"
  ON user_rankings FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_rankings_update_own" ON user_rankings;
CREATE POLICY "user_rankings_update_own"
  ON user_rankings FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_rankings_delete_own" ON user_rankings;
CREATE POLICY "user_rankings_delete_own"
  ON user_rankings FOR DELETE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "reactions_select_all" ON reactions;
CREATE POLICY "reactions_select_all"
  ON reactions FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "reactions_insert_own" ON reactions;
CREATE POLICY "reactions_insert_own"
  ON reactions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "reactions_update_own" ON reactions;
CREATE POLICY "reactions_update_own"
  ON reactions FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "reactions_delete_own" ON reactions;
CREATE POLICY "reactions_delete_own"
  ON reactions FOR DELETE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "tried_status_select_all" ON tried_status;
CREATE POLICY "tried_status_select_all"
  ON tried_status FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "tried_status_insert_own" ON tried_status;
CREATE POLICY "tried_status_insert_own"
  ON tried_status FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "tried_status_update_own" ON tried_status;
CREATE POLICY "tried_status_update_own"
  ON tried_status FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "tried_status_delete_own" ON tried_status;
CREATE POLICY "tried_status_delete_own"
  ON tried_status FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ========== 003_ranking_function.sql ==========
CREATE OR REPLACE FUNCTION wilson_lower_bound(likes bigint, dislikes bigint)
RETURNS numeric
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN (likes + dislikes) = 0 THEN 0.5
    ELSE (
      WITH stats AS (
        SELECT likes::numeric AS p, (likes + dislikes)::numeric AS n, 1.96 AS z
      )
      SELECT (
        p + (z * z) / (2 * n) - z * sqrt((p * (1 - p) + (z * z) / (4 * n)) / n)
      ) / (1 + (z * z) / n)
      FROM stats
    )
  END;
$$;

CREATE OR REPLACE VIEW global_rankings AS
WITH reaction_stats AS (
  SELECT product_id,
    COUNT(*) FILTER (WHERE reaction = 'like') AS likes,
    COUNT(*) FILTER (WHERE reaction = 'dislike') AS dislikes,
    COUNT(*) AS total_reactions
  FROM reactions GROUP BY product_id
),
rank_stats AS (
  SELECT product_id, AVG(rank_position::numeric) AS avg_rank, COUNT(*) AS rank_count
  FROM user_rankings GROUP BY product_id
),
combined AS (
  SELECT p.id AS product_id, p.name, p.slug, p.description, p.image_url, p.caffeine_mg,
    p.is_seasonal, p.is_active, p.created_at, pl.id AS product_line_id, pl.name AS product_line_name,
    pl.slug AS product_line_slug, pl.color_hex AS product_line_color,
    COALESCE(rs.likes, 0) AS likes, COALESCE(rs.dislikes, 0) AS dislikes,
    COALESCE(rs.total_reactions, 0) AS total_reactions, rk.avg_rank, COALESCE(rk.rank_count, 0) AS rank_count
  FROM products p
  JOIN product_lines pl ON pl.id = p.product_line_id
  LEFT JOIN reaction_stats rs ON rs.product_id = p.id
  LEFT JOIN rank_stats rk ON rk.product_id = p.id
  WHERE p.is_active = true
),
scored AS (
  SELECT c.*, wilson_lower_bound(c.likes, c.dislikes) AS wilson_score,
    CASE WHEN c.avg_rank IS NULL THEN 0.5
    ELSE 1.0 - ((c.avg_rank - MIN(c.avg_rank) OVER ()) /
      NULLIF(MAX(c.avg_rank) OVER () - MIN(c.avg_rank) OVER (), 0))
    END AS normalized_rank_score
  FROM combined c
)
SELECT product_id, name, slug, description, image_url, caffeine_mg, is_seasonal, is_active, created_at,
  product_line_id, product_line_name, product_line_slug, product_line_color,
  likes, dislikes, total_reactions, avg_rank, rank_count, wilson_score, normalized_rank_score,
  (0.6 * wilson_score + 0.4 * COALESCE(normalized_rank_score, 0.5)) AS final_score,
  ROW_NUMBER() OVER (ORDER BY (0.6 * wilson_score + 0.4 * COALESCE(normalized_rank_score, 0.5)) DESC)::int AS global_rank
FROM scored;

CREATE OR REPLACE FUNCTION get_global_rankings(
  p_sort text DEFAULT 'score',
  p_line_slug text DEFAULT NULL,
  p_search text DEFAULT NULL,
  p_caffeine_free boolean DEFAULT NULL
)
RETURNS SETOF global_rankings
LANGUAGE sql STABLE
AS $$
  SELECT * FROM global_rankings gr
  WHERE (p_line_slug IS NULL OR gr.product_line_slug = p_line_slug)
    AND (p_search IS NULL OR gr.name ILIKE '%' || p_search || '%' OR gr.description ILIKE '%' || p_search || '%')
    AND (p_caffeine_free IS NULL
      OR (p_caffeine_free = true AND (gr.caffeine_mg IS NULL OR gr.caffeine_mg = 0))
      OR (p_caffeine_free = false AND gr.caffeine_mg IS NOT NULL AND gr.caffeine_mg > 0))
  ORDER BY
    CASE WHEN p_sort = 'score' THEN gr.final_score END DESC NULLS LAST,
    CASE WHEN p_sort = 'product_line' THEN gr.product_line_name END ASC NULLS LAST,
    CASE WHEN p_sort = 'newest' THEN gr.created_at END DESC NULLS LAST,
    CASE WHEN p_sort = 'most_voted' THEN gr.total_reactions END DESC NULLS LAST,
    gr.name ASC;
$$;

GRANT EXECUTE ON FUNCTION get_global_rankings(text, text, text, boolean) TO anon, authenticated;
GRANT SELECT ON global_rankings TO anon, authenticated;
