-- Migration: Create api_keys table and migrate existing keys from users table
-- Run this BEFORE running `drizzle-kit push` to drop users.api_key_hash

BEGIN;

-- 1. Create the api_keys table
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  key_hash VARCHAR(64) NOT NULL,
  key_prefix VARCHAR(7) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  last_used_at TIMESTAMP
);

-- 2. Migrate existing keys from users.api_key_hash
INSERT INTO api_keys (user_id, name, key_hash, key_prefix, created_at)
SELECT id, 'Default', api_key_hash, 'sk_****', created_at
FROM users
WHERE api_key_hash IS NOT NULL;

-- 3. Drop the old column
ALTER TABLE users DROP COLUMN IF EXISTS api_key_hash;

COMMIT;
