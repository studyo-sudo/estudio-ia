const fs = require('fs/promises');
const crypto = require('crypto');
const { authDemoEmail, authDemoPassword } = require('./config');
const { authFile, ensureStorageReady } = require('./storage');
const { getPool, hasDatabase } = require('./db');

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

async function readUsers() {
  await ensureStorageReady();

  if (hasDatabase()) {
    const pool = getPool();
    const result = await pool.query(
      'SELECT email, password_hash AS "passwordHash", source, created_at AS "createdAt" FROM auth_users'
    );
    return result.rows;
  }

  try {
    const raw = await fs.readFile(authFile, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeUsers(users) {
  await ensureStorageReady();

  if (hasDatabase()) {
    const pool = getPool();
    await pool.query('DELETE FROM auth_users');

    for (const user of users) {
      await pool.query(
        `
          INSERT INTO auth_users (email, password_hash, source, created_at)
          VALUES ($1, $2, $3, $4)
        `,
        [user.email, user.passwordHash, user.source || 'local', user.createdAt || Date.now()]
      );
    }

    return;
  }

  await fs.writeFile(authFile, JSON.stringify(users, null, 2), 'utf8');
}

async function getUserByEmail(email) {
  if (email === authDemoEmail) {
    return {
      email,
      passwordHash: hashPassword(authDemoPassword),
      source: 'demo',
    };
  }

  if (hasDatabase()) {
    const pool = getPool();
    const result = await pool.query(
      `
        SELECT
          email,
          password_hash AS "passwordHash",
          source,
          created_at AS "createdAt"
        FROM auth_users
        WHERE email = $1
        LIMIT 1
      `,
      [email]
    );

    return result.rows[0] || null;
  }

  const users = await readUsers();
  return users.find((user) => user.email === email) || null;
}

async function registerUser(email, password) {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const existing = await getUserByEmail(normalizedEmail);

  if (existing) {
    throw new Error('Ya existe una cuenta con ese email.');
  }

  if (hasDatabase()) {
    const pool = getPool();
    await pool.query(
      `
        INSERT INTO auth_users (email, password_hash, source, created_at)
        VALUES ($1, $2, $3, $4)
      `,
      [normalizedEmail, hashPassword(password), 'local', Date.now()]
    );

    return { email: normalizedEmail };
  }

  const users = await readUsers();
  users.push({
    email: normalizedEmail,
    passwordHash: hashPassword(password),
    source: 'local',
    createdAt: Date.now(),
  });

  await writeUsers(users);
  return { email: normalizedEmail };
}

async function validateCredentials(email, password) {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const user = await getUserByEmail(normalizedEmail);

  if (!user || user.passwordHash !== hashPassword(password)) {
    return null;
  }

  return { email: normalizedEmail };
}

module.exports = {
  registerUser,
  validateCredentials,
};
