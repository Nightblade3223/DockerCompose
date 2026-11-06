// Initialize NAS-backed configuration once; preserve existing games and secrets.
const fs = require('node:fs');
const crypto = require('node:crypto');
const JSON5 = require('/md/node_modules/json5');
const configPath = '/config/config.json5';
const passwordPath = '/config/postgres-password';
if (fs.existsSync(configPath) !== fs.existsSync(passwordPath)) {
  throw new Error('Incomplete Massive Decks configuration; restore both configuration files from backup.');
}
if (!fs.existsSync(configPath)) {
  const password = crypto.randomBytes(32).toString('hex');
  const config = JSON5.parse(fs.readFileSync('/md/config.json5', 'utf8'));
  const connection = {
    host: 'massivedecks-db', port: 5432, user: 'massivedecks',
    database: 'massivedecks', password, keepAlive: false,
  };
  config.secret = crypto.randomBytes(48).toString('hex');
  // Start with the bundled decks so server readiness never needs a remote
  // card provider. Extra sources can be enabled in the generated config later.
  config.sources = { builtIn: config.sources.builtIn };
  config.adverts.manyDecks = false;
  config.storage = { ...config.storage, type: 'PostgreSQL', connection };
  config.cache = { ...config.cache, type: 'PostgreSQL', connection };
  fs.writeFileSync(passwordPath, password, { mode: 0o600, flag: 'wx' });
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2), { mode: 0o600, flag: 'wx' });
}
// The server runs as the configured non-root NAS user; PostgreSQL reads its
// password file as root before dropping privileges in the official entrypoint.
for (const path of [configPath, passwordPath]) {
  fs.chownSync(path, Number(process.env.PUID), Number(process.env.PGID));
}
console.log('Massive Decks configuration ready.');
