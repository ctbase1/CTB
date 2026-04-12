-- ============================================================
-- reports (polymorphic: post | comment)
-- ============================================================
CREATE TABLE reports (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  target_id   UUID NOT NULL,
  target_type TEXT NOT NULL CHECK (target_type IN ('post', 'comment')),
  reason      TEXT NOT NULL,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reports_insert_auth"
  ON reports FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "reports_select_own"
  ON reports FOR SELECT
  USING (auth.uid() = reporter_id);

CREATE POLICY "reports_update_admin"
  ON reports FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_platform_admin = TRUE
    )
  );

-- ============================================================
-- community_bans
-- ============================================================
CREATE TABLE community_bans (
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  banned_by    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (community_id, user_id)
);

ALTER TABLE community_bans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "community_bans_select_all"
  ON community_bans FOR SELECT
  USING (TRUE);

CREATE POLICY "community_bans_insert_mod"
  ON community_bans FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM memberships
      WHERE community_id = community_bans.community_id
        AND user_id = auth.uid()
        AND role IN ('admin', 'moderator')
    )
  );

CREATE POLICY "community_bans_delete_mod"
  ON community_bans FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM memberships
      WHERE community_id = community_bans.community_id
        AND user_id = auth.uid()
        AND role IN ('admin', 'moderator')
    )
  );
