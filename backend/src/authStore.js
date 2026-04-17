const fs = require('fs/promises');
const crypto = require('crypto');
const { authDemoEmail, authDemoPassword } = require('./config');
const { authFile, ensureStorageReady } = require('./storage');
const { getPool, hasDatabase } = require('./db');

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

function normalizePhoneNumber(phoneNumber) {
  return String(phoneNumber || '')
    .trim()
    .replace(/[^\d+]/g, '')
    .replace(/(?!^)\+/g, '');
}

async function readUsers() {
  await ensureStorageReady();

  if (hasDatabase()) {
    const pool = getPool();
    const result = await pool.query(
      `
        SELECT
          email,
          password_hash AS "passwordHash",
          source,
          created_at AS "createdAt",
          phone_number AS "phoneNumber",
          phone_verified_at AS "phoneVerifiedAt"
        FROM auth_users
      `
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
          INSERT INTO auth_users (
            email,
            password_hash,
            source,
            created_at,
            phone_number,
            phone_verified_at
          )
          VALUES ($1, $2, $3, $4, $5, $6)
        `,
        [
          user.email,
          user.passwordHash,
          user.source || 'local',
          user.createdAt || Date.now(),
          user.phoneNumber || null,
          user.phoneVerifiedAt || null,
        ]
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
      phoneNumber: null,
      phoneVerifiedAt: Date.now(),
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
          created_at AS "createdAt",
          phone_number AS "phoneNumber",
          phone_verified_at AS "phoneVerifiedAt"
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
        INSERT INTO auth_users (
          email,
          password_hash,
          source,
          created_at,
          phone_number,
          phone_verified_at
        )
        VALUES ($1, $2, $3, $4, $5, $6)
      `,
      [normalizedEmail, hashPassword(password), 'local', Date.now(), null, null]
    );

    return { email: normalizedEmail };
  }

  const users = await readUsers();
  users.push({
    email: normalizedEmail,
    passwordHash: hashPassword(password),
    source: 'local',
    createdAt: Date.now(),
    phoneNumber: null,
    phoneVerifiedAt: null,
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

async function getUserByPhoneNumber(phoneNumber) {
  const normalizedPhoneNumber = normalizePhoneNumber(phoneNumber);

  if (!normalizedPhoneNumber) {
    return null;
  }

  if (hasDatabase()) {
    const pool = getPool();
    const result = await pool.query(
      `
        SELECT
          email,
          password_hash AS "passwordHash",
          source,
          created_at AS "createdAt",
          phone_number AS "phoneNumber",
          phone_verified_at AS "phoneVerifiedAt"
        FROM auth_users
        WHERE phone_number = $1
        LIMIT 1
      `,
      [normalizedPhoneNumber]
    );

    return result.rows[0] || null;
  }

  const users = await readUsers();
  return (
    users.find((user) => normalizePhoneNumber(user.phoneNumber) === normalizedPhoneNumber) || null
  );
}

async function setUserPhoneVerification(email, phoneNumber) {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const normalizedPhoneNumber = normalizePhoneNumber(phoneNumber);

  if (!normalizedPhoneNumber) {
    throw new Error('Telefono invalido.');
  }

  const currentUser = await getUserByEmail(normalizedEmail);
  if (!currentUser) {
    throw new Error('No se encontro la cuenta.');
  }

  const otherUser = await getUserByPhoneNumber(normalizedPhoneNumber);
  if (otherUser && otherUser.email !== normalizedEmail) {
    throw new Error('Este numero ya esta asociado a otra cuenta.');
  }

  if (hasDatabase()) {
    const pool = getPool();
    await pool.query(
      `
        UPDATE auth_users
        SET phone_number = $1, phone_verified_at = $2
        WHERE email = $3
      `,
      [normalizedPhoneNumber, Date.now(), normalizedEmail]
    );

    return {
      ...currentUser,
      phoneNumber: normalizedPhoneNumber,
      phoneVerifiedAt: Date.now(),
    };
  }

  const users = await readUsers();
  const nextUsers = users.map((user) =>
    user.email === normalizedEmail
      ? {
          ...user,
          phoneNumber: normalizedPhoneNumber,
          phoneVerifiedAt: Date.now(),
        }
      : user
  );

  await writeUsers(nextUsers);

  return nextUsers.find((user) => user.email === normalizedEmail) || {
    ...currentUser,
    phoneNumber: normalizedPhoneNumber,
    phoneVerifiedAt: Date.now(),
  };
}

module.exports = {
  registerUser,
  validateCredentials,
  getUserByEmail,
  getUserByPhoneNumber,
  setUserPhoneVerification,
  normalizePhoneNumber,
};
