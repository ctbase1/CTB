-- supabase/migrations/012_comment_editing_and_temp_bans.sql

-- 1. Add edited_at to comments
ALTER TABLE comments
  ADD COLUMN IF NOT EXISTS edited_at timestamptz;

-- 2. Add expires_at to community_bans (NULL = permanent)
ALTER TABLE community_bans
  ADD COLUMN IF NOT EXISTS expires_at timestamptz;

-- Replace the existing comments_update_own policy (which lacked WITH CHECK)
-- with a stricter version that prevents author_id tampering.
DROP POLICY IF EXISTS "comments_update_own" ON comments;
DROP POLICY IF EXISTS "authors_update_own_comments" ON comments;

CREATE POLICY "authors_update_own_comments"
  ON comments
  FOR UPDATE
  TO authenticated
  USING (author_id = auth.uid())
  WITH CHECK (author_id = auth.uid());
