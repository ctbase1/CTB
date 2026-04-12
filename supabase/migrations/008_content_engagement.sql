-- Posts: flair, pinning, editing, link preview
ALTER TABLE posts
  ADD COLUMN flair text,
  ADD COLUMN is_pinned boolean NOT NULL DEFAULT false,
  ADD COLUMN edited_at timestamptz,
  ADD COLUMN link_preview jsonb;

-- Communities: allowed flairs, rules
ALTER TABLE communities
  ADD COLUMN allowed_flairs text[] NOT NULL DEFAULT '{}',
  ADD COLUMN rules jsonb[] NOT NULL DEFAULT '{}';

-- Saved posts
CREATE TABLE saved_posts (
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  saved_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, post_id)
);

ALTER TABLE saved_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own saved posts"
  ON saved_posts FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
