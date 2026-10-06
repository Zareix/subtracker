/**
 * Preloaded before test files (see `bunfig.toml`) so that modules importing
 * `~/lib/db` connect to an in-memory SQLite database instead of opening — and,
 * when `NODE_ENV=test`, deleting — the development database.
 */
process.env.DATABASE_PATH = ":memory:"
