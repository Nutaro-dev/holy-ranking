-- Global rankings: incorporate 1-10 avg score into final_score

DROP VIEW IF EXISTS global_rankings CASCADE;

CREATE VIEW global_rankings AS
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
  WHERE rank_position IS NOT NULL
  GROUP BY product_id
),
score_stats AS (
  SELECT
    product_id,
    AVG(score::numeric) AS avg_score,
    COUNT(*) FILTER (WHERE score IS NOT NULL) AS score_count,
    COUNT(*) FILTER (WHERE review_text IS NOT NULL AND length(trim(review_text)) > 0) AS review_count
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
    COALESCE(rk.rank_count, 0) AS rank_count,
    ss.avg_score,
    COALESCE(ss.score_count, 0) AS score_count,
    COALESCE(ss.review_count, 0) AS review_count
  FROM products p
  JOIN product_lines pl ON pl.id = p.product_line_id
  LEFT JOIN reaction_stats rs ON rs.product_id = p.id
  LEFT JOIN rank_stats rk ON rk.product_id = p.id
  LEFT JOIN score_stats ss ON ss.product_id = p.id
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
    END AS normalized_rank_score,
    CASE
      WHEN c.avg_score IS NULL THEN 0.5
      ELSE (c.avg_score - 1.0) / 9.0
    END AS normalized_avg_score
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
  avg_score,
  score_count,
  review_count,
  wilson_score,
  normalized_rank_score,
  normalized_avg_score,
  (
    0.35 * wilson_score
    + 0.45 * COALESCE(normalized_avg_score, 0.5)
    + 0.20 * COALESCE(normalized_rank_score, 0.5)
  ) AS final_score,
  ROW_NUMBER() OVER (
    ORDER BY (
      0.35 * wilson_score
      + 0.45 * COALESCE(normalized_avg_score, 0.5)
      + 0.20 * COALESCE(normalized_rank_score, 0.5)
    ) DESC
  )::int AS global_rank
FROM scored;

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
    CASE WHEN p_sort = 'rating' THEN gr.avg_score END DESC NULLS LAST,
    CASE WHEN p_sort = 'product_line' THEN gr.product_line_name END ASC NULLS LAST,
    CASE WHEN p_sort = 'newest' THEN gr.created_at END DESC NULLS LAST,
    CASE WHEN p_sort = 'most_voted' THEN gr.total_reactions END DESC NULLS LAST,
    CASE WHEN p_sort = 'most_reviews' THEN gr.review_count END DESC NULLS LAST,
    gr.name ASC;
$$;

GRANT EXECUTE ON FUNCTION get_global_rankings(text, text, text, boolean) TO anon, authenticated;
GRANT SELECT ON global_rankings TO anon, authenticated;
