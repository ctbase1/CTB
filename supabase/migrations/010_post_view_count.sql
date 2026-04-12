ALTER TABLE posts ADD COLUMN view_count INTEGER NOT NULL DEFAULT 0;

-- SECURITY DEFINER bypasses the posts_update_own RLS policy so any viewer
-- (including unauthenticated) can increment the count without owning the post.
CREATE OR REPLACE FUNCTION increment_post_view(post_id UUID)
RETURNS VOID
LANGUAGE SQL
SECURITY DEFINER
AS $$
  UPDATE posts SET view_count = view_count + 1 WHERE id = post_id AND is_removed = FALSE;
$$;
