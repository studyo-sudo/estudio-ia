const crypto = require('crypto');
const fs = require('fs/promises');
const path = require('path');
const { dataDir } = require('./config');
const { getPool, hasDatabase, initializeDatabase } = require('./db');

const usersDir = path.join(dataDir, 'users');
const authFile = path.join(dataDir, 'auth-users.json');
const CREDIT_EXPIRATION_MS = 30 * 24 * 60 * 60 * 1000;

function normalizeBillingState(rawBilling) {
  const now = Date.now();
  const grants = Array.isArray(rawBilling?.creditGrants)
    ? rawBilling.creditGrants
        .filter(
          (grant) =>
            grant &&
            typeof grant.id === 'string' &&
            typeof grant.amount === 'number' &&
            typeof grant.remaining === 'number' &&
            typeof grant.purchasedAt === 'number' &&
            typeof grant.expiresAt === 'number'
        )
        .filter((grant) => grant.remaining > 0 && grant.expiresAt > now)
        .sort((a, b) => a.expiresAt - b.expiresAt)
    : [];

  if (grants.length === 0 && Number.isFinite(rawBilling?.credits) && rawBilling.credits > 0) {
    grants.push({
      id: `legacy-${now}`,
      amount: rawBilling.credits,
      remaining: rawBilling.credits,
      purchasedAt: now,
      expiresAt: now + CREDIT_EXPIRATION_MS,
    });
  }

  return {
    plan: rawBilling?.plan === 'premium' ? 'premium' : 'free',
    credits: grants.reduce((total, grant) => total + grant.remaining, 0),
    creditGrants: grants,
  };
}

async function ensureStorageReady() {
  if (hasDatabase()) {
    await initializeDatabase();
    return;
  }

  await fs.mkdir(usersDir, { recursive: true });
  try {
    await fs.access(authFile);
  } catch {
    await fs.writeFile(authFile, JSON.stringify([], null, 2), 'utf8');
  }
}

function getUserFilePath(email) {
  const userHash = crypto.createHash('sha1').update(email).digest('hex');
  return path.join(usersDir, `${userHash}.json`);
}

async function readUserState(email) {
  await ensureStorageReady();

  if (hasDatabase()) {
    const pool = getPool();
    const result = await pool.query('SELECT history, billing FROM user_state WHERE email = $1', [
      email,
    ]);

    if (result.rowCount === 0) {
      return {
        history: [],
        billing: { plan: 'free', credits: 0 },
      };
    }

    const row = result.rows[0];
    const history = Array.isArray(row.history) ? row.history : [];
    const billing = normalizeBillingState(row.billing);

    return { history, billing };
  }

  const filePath = getUserFilePath(email);

  try {
    const raw = await fs.readFile(filePath, 'utf8');
    const parsed = JSON.parse(raw);
    return {
      history: Array.isArray(parsed.history) ? parsed.history : [],
      billing: normalizeBillingState(parsed.billing),
    };
  } catch {
    return {
      history: [],
      billing: normalizeBillingState(),
    };
  }
}

async function writeUserState(email, nextState) {
  await ensureStorageReady();

  if (hasDatabase()) {
    const pool = getPool();
    await pool.query(
      `
        INSERT INTO user_state (email, history, billing, updated_at)
        VALUES ($1, $2::jsonb, $3::jsonb, $4)
        ON CONFLICT (email)
        DO UPDATE SET
          history = EXCLUDED.history,
          billing = EXCLUDED.billing,
          updated_at = EXCLUDED.updated_at
      `,
      [email, JSON.stringify(nextState.history || []), JSON.stringify(nextState.billing || {}), Date.now()]
    );
    return;
  }

  const filePath = getUserFilePath(email);
  await fs.writeFile(filePath, JSON.stringify(nextState, null, 2), 'utf8');
}

function mergeHistoryItems(localItems, remoteItems) {
  const merged = new Map();

  for (const item of [...localItems, ...remoteItems]) {
    const previous = merged.get(item.id);

    if (!previous || item.createdAt >= previous.createdAt) {
      merged.set(item.id, item);
    }
  }

  return [...merged.values()].sort((a, b) => b.createdAt - a.createdAt);
}

module.exports = {
  ensureStorageReady,
  authFile,
  readUserState,
  writeUserState,
  mergeHistoryItems,
};
