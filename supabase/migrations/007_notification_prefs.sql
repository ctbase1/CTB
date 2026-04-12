ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS notification_prefs JSONB
DEFAULT '{"comments":true,"replies":true,"likes":true,"follows":true}'::jsonb;
