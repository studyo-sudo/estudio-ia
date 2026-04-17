const { Pool } = require('pg');
const { databaseUrl } = require('./config');

let pool = null;

function hasDatabase() {
  return Boolean(databaseUrl);
}

function getPool() {
  if (!hasDatabase()) {
    return null;
  }

  if (!pool) {
    pool = new Pool({
      connectionString: databaseUrl,
      ssl: {
        rejectUnauthorized: false,
      },
    });
  }

  return pool;
}

async function initializeDatabase() {
  const client = getPool();

  if (!client) {
    return false;
  }

  await client.query(`
    CREATE TABLE IF NOT EXISTS auth_users (
      email TEXT PRIMARY KEY,
      password_hash TEXT NOT NULL,
      source TEXT NOT NULL DEFAULT 'local',
      created_at BIGINT NOT NULL
    )
  `);

  await client.query(`
    ALTER TABLE auth_users
    ADD COLUMN IF NOT EXISTS phone_number TEXT
  `);

  await client.query(`
    ALTER TABLE auth_users
    ADD COLUMN IF NOT EXISTS phone_verified_at BIGINT
  `);

  await client.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS auth_users_phone_number_unique
    ON auth_users (phone_number)
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS user_state (
      email TEXT PRIMARY KEY,
      history JSONB NOT NULL DEFAULT '[]'::jsonb,
      billing JSONB NOT NULL DEFAULT '{"plan":"free","credits":0}'::jsonb,
      updated_at BIGINT NOT NULL
    )
  `);

  return true;
}

module.exports = {
  getPool,
  hasDatabase,
  initializeDatabase,
};
