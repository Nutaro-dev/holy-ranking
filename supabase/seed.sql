-- Holy Ranking seed data
-- Run after migrations. Admin promotion via scripts/promote-admin.ts after first login.

INSERT INTO product_lines (id, name, slug, color_hex, caffeine_typical) VALUES
  ('11111111-1111-1111-1111-111111111101', 'HOLY Energy', 'energy', '#FF006E', true),
  ('11111111-1111-1111-1111-111111111102', 'HOLY Iced Tea', 'iced-tea', '#00C896', false),
  ('11111111-1111-1111-1111-111111111103', 'HOLY Hydration', 'hydration', '#7B2FF7', false)
ON CONFLICT (slug) DO NOTHING;

-- HOLY Energy (~7)
INSERT INTO products (product_line_id, name, slug, description, image_url, caffeine_mg, is_seasonal) VALUES
  ('11111111-1111-1111-1111-111111111101', 'Kirsche', 'energy-kirsche', 'Klassische Kirsch-Energy mit HOLY Micro-Koffein.', '/products/placeholder-energy.svg', 80, false),
  ('11111111-1111-1111-1111-111111111101', 'Himbeere & Yuzu', 'energy-himbeere-yuzu', 'Fruchtig-säuerliche Kombination aus Himbeere und Yuzu.', '/products/placeholder-energy.svg', 80, false),
  ('11111111-1111-1111-1111-111111111101', 'Zitrus & Kalamansi', 'energy-zitrus-kalamansi', 'Erfrischender Zitrus-Mix mit Kalamansi.', '/products/placeholder-energy.svg', 80, false),
  ('11111111-1111-1111-1111-111111111101', 'Saurer Apfel', 'energy-saurer-apfel', 'Knackig-saurer Apfelgeschmack für Energy-Fans.', '/products/placeholder-energy.svg', 80, false),
  ('11111111-1111-1111-1111-111111111101', 'Lion''s Lemonade', 'energy-lions-lemonade', 'Zuckerfreie Limonade mit Löwenmähne-Extrakt.', '/products/placeholder-energy.svg', 80, false),
  ('11111111-1111-1111-1111-111111111101', 'Energy Eel', 'energy-eel', 'Limitierte Sorte mit exotischem Twist.', '/products/placeholder-energy.svg', 80, true),
  ('11111111-1111-1111-1111-111111111101', 'Winter Edition', 'energy-winter-edition', 'Saisonale Limited Edition.', '/products/placeholder-energy.svg', 80, true)
ON CONFLICT (slug) DO NOTHING;

-- HOLY Iced Tea (~7)
INSERT INTO products (product_line_id, name, slug, description, image_url, caffeine_mg, is_seasonal) VALUES
  ('11111111-1111-1111-1111-111111111102', 'Classic Black Tea', 'iced-tea-classic-black', 'Kräftiger schwarzer Eistee.', '/products/placeholder-iced-tea.svg', 20, false),
  ('11111111-1111-1111-1111-111111111102', 'Classic Green Tea', 'iced-tea-classic-green', 'Leichter grüner Eistee.', '/products/placeholder-iced-tea.svg', 15, false),
  ('11111111-1111-1111-1111-111111111102', 'Peach', 'iced-tea-peach', 'Süßer Pfirsich-Eistee.', '/products/placeholder-iced-tea.svg', 0, false),
  ('11111111-1111-1111-1111-111111111102', 'Lemon x Honey', 'iced-tea-lemon-honey', 'Zitrone trifft Honig.', '/products/placeholder-iced-tea.svg', 0, false),
  ('11111111-1111-1111-1111-111111111102', 'Raspberry x Vanilla', 'iced-tea-raspberry-vanilla', 'Himbeere und Vanille im Eistee.', '/products/placeholder-iced-tea.svg', 0, false),
  ('11111111-1111-1111-1111-111111111102', 'Watermelon', 'iced-tea-watermelon', 'Erfrischende Wassermelone.', '/products/placeholder-iced-tea.svg', 0, false),
  ('11111111-1111-1111-1111-111111111102', 'Strawberry x Hibiscus', 'iced-tea-strawberry-hibiscus', 'Erdbeere und Hibiskus.', '/products/placeholder-iced-tea.svg', 0, false)
ON CONFLICT (slug) DO NOTHING;

-- HOLY Hydration (~7)
INSERT INTO products (product_line_id, name, slug, description, image_url, caffeine_mg, is_seasonal) VALUES
  ('11111111-1111-1111-1111-111111111103', 'White Peach', 'hydration-white-peach', 'Sanfter weißer Pfirsich.', '/products/placeholder-hydration.svg', 0, false),
  ('11111111-1111-1111-1111-111111111103', 'Grapefruit', 'hydration-grapefruit', 'Spritzige Grapefruit mit Elektrolyten.', '/products/placeholder-hydration.svg', 0, false),
  ('11111111-1111-1111-1111-111111111103', 'Cranberry', 'hydration-cranberry', 'Herbe Cranberry-Hydration.', '/products/placeholder-hydration.svg', 0, false),
  ('11111111-1111-1111-1111-111111111103', 'Green Apple', 'hydration-green-apple', 'Grüner Apfel für aktive Tage.', '/products/placeholder-hydration.svg', 0, false),
  ('11111111-1111-1111-1111-111111111103', 'Dragonfruit', 'hydration-dragonfruit', 'Exotische Drachenfrucht.', '/products/placeholder-hydration.svg', 0, false),
  ('11111111-1111-1111-1111-111111111103', 'Apricot', 'hydration-apricot', 'Sonnige Aprikose.', '/products/placeholder-hydration.svg', 0, false),
  ('11111111-1111-1111-1111-111111111103', 'Multivitamin', 'hydration-multivitamin', 'Fruchtiger Multivitamin-Mix.', '/products/placeholder-hydration.svg', 0, false)
ON CONFLICT (slug) DO NOTHING;
