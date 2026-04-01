const fs = require('fs');
const path = require('path');

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;

  const content = fs.readFileSync(filePath, 'utf8');

  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith('#')) continue;

    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex <= 0) continue;

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim();

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

function readEnv(name, fallback) {
  const value = process.env[name];
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : fallback;
}

const rootDir = path.resolve(__dirname, '..');
loadEnvFile(path.join(rootDir, '.env'));

module.exports = {
  port: Number(readEnv('PORT', '3000')),
  authDemoEmail: readEnv('AUTH_DEMO_EMAIL', 'demo@estudioia.local'),
  authDemoPassword: readEnv('AUTH_DEMO_PASSWORD', 'demo1234'),
  authTokenSecret: readEnv('AUTH_TOKEN_SECRET', 'change-me-in-production'),
  databaseUrl: readEnv('DATABASE_URL', ''),
  openaiApiKey: readEnv('OPENAI_API_KEY', ''),
  openaiModel: readEnv('OPENAI_MODEL', 'gpt-5-nano'),
  dataDir: path.join(rootDir, 'data'),
};
