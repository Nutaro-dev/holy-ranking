export type ProductLine = {
  id: string;
  name: string;
  slug: string;
  color_hex: string | null;
  caffeine_typical: boolean;
  created_at?: string;
};

export type Product = {
  id: string;
  product_line_id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  caffeine_mg: number | null;
  is_seasonal: boolean;
  is_active: boolean;
  created_at: string;
  product_lines?: ProductLine;
};

export type GlobalRanking = {
  product_id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  caffeine_mg: number | null;
  is_seasonal: boolean;
  is_active: boolean;
  created_at: string;
  product_line_id: string;
  product_line_name: string;
  product_line_slug: string;
  product_line_color: string | null;
  likes: number;
  dislikes: number;
  total_reactions: number;
  avg_rank: number | null;
  rank_count: number;
  avg_score: number | null;
  score_count: number;
  review_count: number;
  wilson_score: number;
  normalized_rank_score: number;
  normalized_avg_score: number;
  final_score: number;
  global_rank: number;
};

export type UserRanking = {
  id: string;
  user_id: string;
  product_id: string;
  rank_position: number;
  score: number | null;
  review_text: string | null;
  is_anonymous: boolean;
  created_at: string;
  updated_at: string;
  products?: Product;
};

export type ProductReview = {
  id: string;
  product_id: string;
  user_id: string;
  score: number | null;
  review_text: string | null;
  is_anonymous: boolean;
  created_at: string;
  updated_at: string;
  author_name: string;
};

export type ScoreDistribution = {
  score: number;
  count: number;
};

export type UserProfile = {
  user_id: string;
  display_name: string | null;
  default_anonymous: boolean;
  bio: string | null;
  created_at: string;
  updated_at: string;
};

export type Reaction = {
  id: string;
  user_id: string;
  product_id: string;
  reaction: 'like' | 'dislike';
  created_at: string;
};

export type TriedStatus = {
  user_id: string;
  product_id: string;
  tried: boolean;
  updated_at: string;
};

export type SortOption =
  | 'score'
  | 'rating'
  | 'product_line'
  | 'newest'
  | 'most_voted'
  | 'most_reviews';

export type RankingFilters = {
  sort?: SortOption;
  lineSlug?: string;
  search?: string;
  caffeineFree?: boolean | null;
};
