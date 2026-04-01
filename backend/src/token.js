const crypto = require('crypto');
const { authTokenSecret } = require('./config');

function toBase64Url(value) {
  return Buffer.from(value)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function fromBase64Url(value) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - (normalized.length % 4 || 4)) % 4);
  return Buffer.from(padded, 'base64').toString('utf8');
}

function sign(payloadText) {
  return crypto.createHmac('sha256', authTokenSecret).update(payloadText).digest('hex');
}

function createToken(email) {
  const payload = JSON.stringify({
    email,
    issuedAt: Date.now(),
  });

  const encodedPayload = toBase64Url(payload);
  const signature = sign(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

function verifyToken(token) {
  if (!token || typeof token !== 'string' || !token.includes('.')) {
    return null;
  }

  const [encodedPayload, signature] = token.split('.');

  if (!encodedPayload || !signature || sign(encodedPayload) !== signature) {
    return null;
  }

  try {
    return JSON.parse(fromBase64Url(encodedPayload));
  } catch {
    return null;
  }
}

module.exports = {
  createToken,
  verifyToken,
};
