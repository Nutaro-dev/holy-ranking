-- Holy Ranking schema
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE admin_users (
  user_id uuid REFERENCES auth.users(id) PRIMARY KEY
);

CREATE TABLE product_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  color_hex text,
  caffeine_typical boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE products (
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

CREATE TABLE user_rankings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  product_id uuid REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  rank_position int NOT NULL,
  star_rating numeric(2,1),
  review_text text,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, product_id)
);

CREATE TABLE reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  product_id uuid REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  reaction text CHECK (reaction IN ('like', 'dislike')) NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, product_id)
);

CREATE TABLE tried_status (
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  product_id uuid REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  tried boolean DEFAULT true,
  updated_at timestamptz DEFAULT now(),
  PRIMARY KEY (user_id, product_id)
);

CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_line ON products(product_line_id);
CREATE INDEX idx_products_active ON products(is_active);
CREATE INDEX idx_user_rankings_user ON user_rankings(user_id, rank_position);
CREATE INDEX idx_reactions_product ON reactions(product_id);
CREATE INDEX idx_tried_status_user ON tried_status(user_id);
