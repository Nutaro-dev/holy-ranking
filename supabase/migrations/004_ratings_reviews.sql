-- 1-10 ratings, optional reviews, anonymous posting, user profiles

ALTER TABLE user_rankings
  ADD COLUMN IF NOT EXISTS score int CHECK (score >= 1 AND score <= 10),
  ADD COLUMN IF NOT EXISTS is_anonymous boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

-- Backfill created_at from updated_at
UPDATE user_rankings SET created_at = updated_at WHERE created_at IS NULL;

CREATE TABLE IF NOT EXISTS user_profiles (
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  display_name text,
  default_anonymous boolean NOT NULL DEFAULT false,
  bio text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_rankings_score ON user_rankings(product_id, score);
CREATE INDEX IF NOT EXISTS idx_user_rankings_product_reviews ON user_rankings(product_id)
  WHERE review_text IS NOT NULL AND length(trim(review_text)) > 0;

-- Display name for reviews (never leaks email)
CREATE OR REPLACE FUNCTION review_author_name(p_user_id uuid, p_is_anonymous boolean)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN p_is_anonymous THEN 'Anonym'
    ELSE COALESCE(
      NULLIF(trim((SELECT display_name FROM user_profiles WHERE user_id = p_user_id)), ''),
      'Holy Fan'
    )
  END;
$$;

-- Public reviews (score and/or text)
CREATE OR REPLACE VIEW product_reviews AS
SELECT
  ur.id,
  ur.product_id,
  ur.user_id,
  ur.score,
  ur.review_text,
  ur.is_anonymous,
  ur.created_at,
  ur.updated_at,
  review_author_name(ur.user_id, ur.is_anonymous) AS author_name
FROM user_rankings ur
WHERE ur.score IS NOT NULL
   OR (ur.review_text IS NOT NULL AND length(trim(ur.review_text)) > 0);

-- Score histogram for a product
CREATE OR REPLACE FUNCTION get_score_distribution(p_product_id uuid)
RETURNS TABLE(score int, count bigint)
LANGUAGE sql
STABLE
AS $$
  SELECT s.score, COUNT(ur.*)::bigint
  FROM generate_series(1, 10) AS s(score)
  LEFT JOIN user_rankings ur ON ur.product_id = p_product_id AND ur.score = s.score
  GROUP BY s.score
  ORDER BY s.score;
$$;

GRANT EXECUTE ON FUNCTION get_score_distribution(uuid) TO anon, authenticated;
GRANT SELECT ON product_reviews TO anon, authenticated;

-- user_profiles RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_profiles_select_public" ON user_profiles;
CREATE POLICY "user_profiles_select_public"
  ON user_profiles FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "user_profiles_insert_own" ON user_profiles;
CREATE POLICY "user_profiles_insert_own"
  ON user_profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_profiles_update_own" ON user_profiles;
CREATE POLICY "user_profiles_update_own"
  ON user_profiles FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
