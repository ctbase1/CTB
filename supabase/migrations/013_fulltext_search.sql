-- supabase/migrations/013_fulltext_search.sql

-- Posts: full-text vector over title + body
ALTER TABLE posts ADD COLUMN IF NOT EXISTS search_vector tsvector;

CREATE INDEX IF NOT EXISTS posts_search_idx ON posts USING GIN(search_vector);

CREATE OR REPLACE FUNCTION posts_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    to_tsvector('english',
      coalesce(NEW.title, '') || ' ' || coalesce(NEW.body, '')
    );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS posts_search_update ON posts;
CREATE TRIGGER posts_search_update
  BEFORE INSERT OR UPDATE OF title, body ON posts
  FOR EACH ROW EXECUTE FUNCTION posts_search_vector_update();

-- Backfill existing posts
UPDATE posts
SET search_vector =
  to_tsvector('english',
    coalesce(title, '') || ' ' || coalesce(body, '')
  );

-- Communities: full-text vector over name + description
ALTER TABLE communities ADD COLUMN IF NOT EXISTS search_vector tsvector;

CREATE INDEX IF NOT EXISTS communities_search_idx ON communities USING GIN(search_vector);

CREATE OR REPLACE FUNCTION communities_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    to_tsvector('english',
      coalesce(NEW.name, '') || ' ' || coalesce(NEW.description, '')
    );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS communities_search_update ON communities;
CREATE TRIGGER communities_search_update
  BEFORE INSERT OR UPDATE OF name, description ON communities
  FOR EACH ROW EXECUTE FUNCTION communities_search_vector_update();

-- Backfill existing communities
UPDATE communities
SET search_vector =
  to_tsvector('english',
    coalesce(name, '') || ' ' || coalesce(description, '')
  );
