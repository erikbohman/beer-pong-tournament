-- ============================================================
-- Beer Pong Tournament — Supabase Schema
-- Run this entire file in your Supabase SQL Editor (one paste)
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Tables ───────────────────────────────────────────────────

CREATE TABLE themes (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name                 TEXT NOT NULL,
  primary_color        TEXT NOT NULL DEFAULT '#f97316',
  secondary_color      TEXT NOT NULL DEFAULT '#fb923c',
  accent_color         TEXT NOT NULL DEFAULT '#fbbf24',
  background_color     TEXT NOT NULL DEFAULT '#111827',
  background_image_url TEXT,
  logo_url             TEXT,
  font_style           TEXT NOT NULL DEFAULT 'Inter',
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_at           TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE tournaments (
  id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name                        TEXT NOT NULL,
  type                        TEXT NOT NULL CHECK (type IN ('single_elimination','group_stage','multi_stage')),
  participant_type            TEXT NOT NULL CHECK (participant_type IN ('players','teams')),
  status                      TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published')),
  theme_id                    UUID REFERENCES themes(id) ON DELETE SET NULL,
  start_date                  DATE,
  num_participants            INT NOT NULL,
  num_groups                  INT,
  players_per_group           INT,
  players_advancing_per_group INT,
  created_at                  TIMESTAMPTZ DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE groups (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  order_index   INT NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE teams (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  seed_order    INT NOT NULL DEFAULT 0,
  group_id      UUID REFERENCES groups(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE players (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  team_id       UUID REFERENCES teams(id) ON DELETE SET NULL,
  name          TEXT NOT NULL,
  seed_order    INT NOT NULL DEFAULT 0,
  group_id      UUID REFERENCES groups(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE matches (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tournament_id      UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  stage              TEXT NOT NULL CHECK (stage IN ('group','knockout')),
  round              INT NOT NULL,
  match_number       INT NOT NULL,
  group_id           UUID REFERENCES groups(id) ON DELETE SET NULL,
  participant1_id    UUID,
  participant2_id    UUID,
  participant1_type  TEXT CHECK (participant1_type IN ('team','player')),
  participant2_type  TEXT CHECK (participant2_type IN ('team','player')),
  winner_id          UUID,
  winner_type        TEXT CHECK (winner_type IN ('team','player')),
  participant1_cups  INT,
  participant2_cups  INT,
  created_at         TIMESTAMPTZ DEFAULT NOW(),
  updated_at         TIMESTAMPTZ DEFAULT NOW()
);

-- ── updated_at triggers ───────────────────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_tournaments_updated_at
  BEFORE UPDATE ON tournaments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_themes_updated_at
  BEFORE UPDATE ON themes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_matches_updated_at
  BEFORE UPDATE ON matches
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ── Row Level Security ────────────────────────────────────────

ALTER TABLE themes      ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups      ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams       ENABLE ROW LEVEL SECURITY;
ALTER TABLE players     ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches     ENABLE ROW LEVEL SECURITY;

-- Themes: public can read; authenticated users manage all
CREATE POLICY "themes_public_read" ON themes FOR SELECT TO anon USING (true);
CREATE POLICY "themes_auth_all"    ON themes FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Tournaments: public sees only published; auth manages all
CREATE POLICY "tournaments_public_read"
  ON tournaments FOR SELECT TO anon
  USING (status = 'published');

CREATE POLICY "tournaments_auth_all"
  ON tournaments FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- Groups: public reads if parent tournament is published
CREATE POLICY "groups_public_read"
  ON groups FOR SELECT TO anon
  USING (EXISTS (
    SELECT 1 FROM tournaments t WHERE t.id = groups.tournament_id AND t.status = 'published'
  ));
CREATE POLICY "groups_auth_all" ON groups FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Teams: same pattern
CREATE POLICY "teams_public_read"
  ON teams FOR SELECT TO anon
  USING (EXISTS (
    SELECT 1 FROM tournaments t WHERE t.id = teams.tournament_id AND t.status = 'published'
  ));
CREATE POLICY "teams_auth_all" ON teams FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Players: same pattern
CREATE POLICY "players_public_read"
  ON players FOR SELECT TO anon
  USING (EXISTS (
    SELECT 1 FROM tournaments t WHERE t.id = players.tournament_id AND t.status = 'published'
  ));
CREATE POLICY "players_auth_all" ON players FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Matches: public reads published; public can UPDATE scores on published tournaments
CREATE POLICY "matches_public_read"
  ON matches FOR SELECT TO anon
  USING (EXISTS (
    SELECT 1 FROM tournaments t WHERE t.id = matches.tournament_id AND t.status = 'published'
  ));

CREATE POLICY "matches_public_update"
  ON matches FOR UPDATE TO anon
  USING (EXISTS (
    SELECT 1 FROM tournaments t WHERE t.id = matches.tournament_id AND t.status = 'published'
  ))
  WITH CHECK (true);

CREATE POLICY "matches_auth_all" ON matches FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ── Storage Bucket ────────────────────────────────────────────
-- Run separately in Supabase Dashboard > Storage, or uncomment and run here:

-- INSERT INTO storage.buckets (id, name, public) VALUES ('theme-assets', 'theme-assets', true)
-- ON CONFLICT (id) DO NOTHING;

-- CREATE POLICY "theme_assets_public_read"
--   ON storage.objects FOR SELECT TO anon USING (bucket_id = 'theme-assets');

-- CREATE POLICY "theme_assets_auth_manage"
--   ON storage.objects FOR ALL TO authenticated USING (bucket_id = 'theme-assets') WITH CHECK (bucket_id = 'theme-assets');

-- ============================================================
-- Done! Now:
-- 1. Create a user in Supabase Auth > Users > Add User
-- 2. Create the 'theme-assets' storage bucket manually in
--    Supabase Dashboard > Storage (set to Public)
-- 3. Copy your Project URL + anon key into .env
-- ============================================================
