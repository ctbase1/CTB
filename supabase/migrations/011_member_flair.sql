-- Add flair column to memberships table
ALTER TABLE memberships
  ADD COLUMN IF NOT EXISTS flair TEXT CHECK (char_length(flair) <= 40);

-- Members can update their own flair
CREATE POLICY "members_update_own_flair"
  ON memberships
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Moderators and admins can clear (set to null) any member's flair in their communities
CREATE POLICY "mods_clear_member_flair"
  ON memberships
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM memberships m
      WHERE m.community_id = memberships.community_id
        AND m.user_id = auth.uid()
        AND m.role IN ('admin', 'moderator')
    )
  )
  WITH CHECK (flair IS NULL);
