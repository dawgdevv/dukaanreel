CREATE TABLE IF NOT EXISTS reels (
  id TEXT PRIMARY KEY,
  caption TEXT NOT NULL,
  product_name TEXT,
  price INTEGER,
  shop_name TEXT NOT NULL DEFAULT 'Apni Dukaan',
  scene_id TEXT NOT NULL DEFAULT 'white',
  image_url TEXT NOT NULL,
  audio_url TEXT,
  video_url TEXT,
  status TEXT NOT NULL DEFAULT 'ready',
  error_code TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS reels_created_at_idx ON reels (created_at DESC);
