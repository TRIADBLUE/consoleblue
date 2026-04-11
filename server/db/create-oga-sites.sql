-- create-oga-sites.sql
-- Run this ONCE against the Console.Blue production database.
-- It creates an ogaSites row for every TRIADBLUE domain and generates a unique
-- API key for each. Safe to re-run — ON CONFLICT (domain) DO NOTHING means
-- existing rows are not touched.
--
-- Usage (on Replit shell inside the consoleblue Repl):
--   psql "$DATABASE_URL" -f server/db/create-oga-sites.sql
--
-- Or paste into Replit Database tab → Query.
--
-- After running, the final SELECT prints every domain + its API key.
-- Copy the value next to "console.blue" into Replit Secrets as
-- VITE_OGA_KEY_CONSOLEBLUE, and do the same for each sister site.

-- Ensure pgcrypto is available for gen_random_bytes().
-- Neon and Replit Postgres have this enabled by default, but this is a no-op
-- if it's already there.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Insert one row per TRIADBLUE root domain. All emancipated=true because
-- these are independent roots, not inherited subdomains.
INSERT INTO oga_sites (domain, display_name, api_key, status, emancipated, allowed_origins)
VALUES
  ('console.blue',         'Console.Blue',       'oga_' || encode(gen_random_bytes(32), 'hex'), 'active', true, '[]'::jsonb),
  ('businessblueprint.io', 'businessblueprint',  'oga_' || encode(gen_random_bytes(32), 'hex'), 'active', true, '[]'::jsonb),
  ('hostsblue.com',        'hostsblue',          'oga_' || encode(gen_random_bytes(32), 'hex'), 'active', true, '[]'::jsonb),
  ('swipesblue.com',       'swipesblue',         'oga_' || encode(gen_random_bytes(32), 'hex'), 'active', true, '[]'::jsonb),
  ('scansblue.com',        'scansblue',          'oga_' || encode(gen_random_bytes(32), 'hex'), 'active', true, '[]'::jsonb),
  ('linkblue.systems',     'LINKBlue',           'oga_' || encode(gen_random_bytes(32), 'hex'), 'active', true, '[]'::jsonb),
  ('triadblue.com',        'TRIADBLUE',          'oga_' || encode(gen_random_bytes(32), 'hex'), 'active', true, '[]'::jsonb),
  ('builderblue2.com',     'BUILDERBLUE2',       'oga_' || encode(gen_random_bytes(32), 'hex'), 'active', true, '[]'::jsonb)
ON CONFLICT (domain) DO NOTHING;

-- Print every site + its key. Copy these into Replit Secrets on the
-- corresponding Repl (one env var per site, named VITE_OGA_KEY_<UPPER>).
SELECT
  id,
  domain,
  display_name,
  api_key,
  status,
  emancipated,
  created_at
FROM oga_sites
ORDER BY domain;
