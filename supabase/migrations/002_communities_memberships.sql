-- ============================================================
-- membership_role enum
-- ============================================================
CREATE TYPE membership_role AS ENUM ('admin', 'moderator', 'member');

-- ============================================================
-- communities
-- ============================================================
CREATE TABLE communities (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  slug        TEXT UNIQUE NOT NULL,
  description TEXT,
  banner_url  TEXT,
  created_by  UUID NOT NULL REFERENCES profiles(id),
  is_removed  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- memberships
-- ============================================================
CREATE TABLE memberships (
  user_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  role         membership_role NOT NULL DEFAULT 'member',
  joined_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, community_id)
);

-- ============================================================
-- Trigger: auto-grant admin membership on community creation
-- Runs as SECURITY DEFINER to bypass memberships RLS
-- ============================================================
CREATE OR REPLACE FUNCTION handle_community_created()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO memberships (user_id, community_id, role)
  VALUES (NEW.created_by, NEW.id, 'admin');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_community_created
  AFTER INSERT ON communities
  FOR EACH ROW EXECUTE FUNCTION handle_community_created();

-- ============================================================
-- RLS: communities
-- ============================================================
ALTER TABLE communities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "communities_select_public"
  ON communities FOR SELECT
  USING (is_removed = FALSE);

CREATE POLICY "communities_insert_auth"
  ON communities FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "communities_update_admin"
  ON communities FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM memberships
      WHERE memberships.community_id = id
        AND memberships.user_id = auth.uid()
        AND memberships.role = 'admin'
    )
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.is_platform_admin = TRUE
    )
  );

-- ============================================================
-- RLS: memberships
-- ============================================================
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "memberships_select_all"
  ON memberships FOR SELECT
  USING (TRUE);

CREATE POLICY "memberships_insert_own"
  ON memberships FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id AND role = 'member');

CREATE POLICY "memberships_delete_own"
  ON memberships FOR DELETE
  USING (auth.uid() = user_id AND role != 'admin');

CREATE POLICY "memberships_delete_admin"
  ON memberships FOR DELETE
  USING (
    user_id != auth.uid()
    AND (
      EXISTS (
        SELECT 1 FROM memberships m2
        WHERE m2.community_id = memberships.community_id
          AND m2.user_id = auth.uid()
          AND m2.role = 'admin'
      )
      OR EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
          AND profiles.is_platform_admin = TRUE
      )
    )
  );

CREATE POLICY "memberships_update_admin"
  ON memberships FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM memberships m2
      WHERE m2.community_id = memberships.community_id
        AND m2.user_id = auth.uid()
        AND m2.role = 'admin'
    )
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.is_platform_admin = TRUE
    )
  );
