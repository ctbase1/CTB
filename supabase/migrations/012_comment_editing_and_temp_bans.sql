-- supabase/migrations/012_comment_editing_and_temp_bans.sql

-- 1. Add edited_at to comments
ALTER TABLE comments
  ADD COLUMN IF NOT EXISTS edited_at timestamptz;

-- 2. Add expires_at to community_bans (NULL = permanent)
ALTER TABLE community_bans
  ADD COLUMN IF NOT EXISTS expires_at timestamptz;

-- Members can update their own comments (body + edited_at) within RLS
-- The ownership check + 15-min window is enforced in the server action;
-- RLS only checks ownership so the action can't be bypassed.
CREATE POLICY "authors_update_own_comments"
  ON comments
  FOR UPDATE
  TO authenticated
  USING (author_id = auth.uid())
  WITH CHECK (author_id = auth.uid());
