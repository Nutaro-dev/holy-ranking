-- Wilson-Score lower bound (95% confidence) + normalized rank position
-- final_score = 0.6 * wilson + 0.4 * normalized_rank_score

CREATE OR REPLACE FUNCTION wilson_lower_bound(likes bigint, dislikes bigint)
RETURNS numeric
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN (likes + dislikes) = 0 THEN 0.5
    ELSE (
      WITH stats AS (
        SELECT
          likes::numeric AS p,
          (likes + dislikes)::numeric AS n,
          1.96 AS z
      )
      SELECT
        (
          p + (z * z) / (2 * n) - z * sqrt((p * (1 - p) + (z * z) / (4 * n)) / n)
        ) / (1 + (z * z) / n)
      FROM stats
    )
  END;
$$;

CREATE OR REPLACE VIEW global_rankings AS
WITH reaction_stats AS (
  SELECT
    product_id,
    COUNT(*) FILTER (WHERE reaction = 'like') AS likes,
    COUNT(*) FILTER (WHERE reaction = 'dislike') AS dislikes,
    COUNT(*) AS total_reactions
  FROM reactions
  GROUP BY product_id
),
rank_stats AS (
  SELECT
    product_id,
    AVG(rank_position::numeric) AS avg_rank,
    COUNT(*) AS rank_count
  FROM user_rankings
  GROUP BY product_id
),
combined AS (
  SELECT
    p.id AS product_id,
    p.name,
    p.slug,
    p.description,
    p.image_url,
    p.caffeine_mg,
    p.is_seasonal,
    p.is_active,
    p.created_at,
    pl.id AS product_line_id,
    pl.name AS product_line_name,
    pl.slug AS product_line_slug,
    pl.color_hex AS product_line_color,
    COALESCE(rs.likes, 0) AS likes,
    COALESCE(rs.dislikes, 0) AS dislikes,
    COALESCE(rs.total_reactions, 0) AS total_reactions,
    rk.avg_rank,
    COALESCE(rk.rank_count, 0) AS rank_count
  FROM products p
  JOIN product_lines pl ON pl.id = p.product_line_id
  LEFT JOIN reaction_stats rs ON rs.product_id = p.id
  LEFT JOIN rank_stats rk ON rk.product_id = p.id
  WHERE p.is_active = true
),
scored AS (
  SELECT
    c.*,
    wilson_lower_bound(c.likes, c.dislikes) AS wilson_score,
    CASE
      WHEN c.avg_rank IS NULL THEN 0.5
      ELSE 1.0 - (
        (c.avg_rank - MIN(c.avg_rank) OVER ()) /
        NULLIF(MAX(c.avg_rank) OVER () - MIN(c.avg_rank) OVER (), 0)
      )
    END AS normalized_rank_score
  FROM combined c
)
SELECT
  product_id,
  name,
  slug,
  description,
  image_url,
  caffeine_mg,
  is_seasonal,
  is_active,
  created_at,
  product_line_id,
  product_line_name,
  product_line_slug,
  product_line_color,
  likes,
  dislikes,
  total_reactions,
  avg_rank,
  rank_count,
  wilson_score,
  normalized_rank_score,
  (0.6 * wilson_score + 0.4 * COALESCE(normalized_rank_score, 0.5)) AS final_score,
  ROW_NUMBER() OVER (
    ORDER BY (0.6 * wilson_score + 0.4 * COALESCE(normalized_rank_score, 0.5)) DESC
  )::int AS global_rank
FROM scored;

-- RPC for filtered/sorted rankings
CREATE OR REPLACE FUNCTION get_global_rankings(
  p_sort text DEFAULT 'score',
  p_line_slug text DEFAULT NULL,
  p_search text DEFAULT NULL,
  p_caffeine_free boolean DEFAULT NULL
)
RETURNS SETOF global_rankings
LANGUAGE sql
STABLE
AS $$
  SELECT *
  FROM global_rankings gr
  WHERE
    (p_line_slug IS NULL OR gr.product_line_slug = p_line_slug)
    AND (p_search IS NULL OR gr.name ILIKE '%' || p_search || '%' OR gr.description ILIKE '%' || p_search || '%')
    AND (
      p_caffeine_free IS NULL
      OR (p_caffeine_free = true AND (gr.caffeine_mg IS NULL OR gr.caffeine_mg = 0))
      OR (p_caffeine_free = false AND gr.caffeine_mg IS NOT NULL AND gr.caffeine_mg > 0)
    )
  ORDER BY
    CASE WHEN p_sort = 'score' THEN gr.final_score END DESC NULLS LAST,
    CASE WHEN p_sort = 'product_line' THEN gr.product_line_name END ASC NULLS LAST,
    CASE WHEN p_sort = 'newest' THEN gr.created_at END DESC NULLS LAST,
    CASE WHEN p_sort = 'most_voted' THEN gr.total_reactions END DESC NULLS LAST,
    gr.name ASC;
$$;

GRANT EXECUTE ON FUNCTION get_global_rankings(text, text, text, boolean) TO anon, authenticated;
GRANT SELECT ON global_rankings TO anon, authenticated;
