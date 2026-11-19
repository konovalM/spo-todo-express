import 'dotenv/config';

function required(name) {
  const value = process.env[name];
  if (!value || !value.trim()) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value.trim();
}

export const config = {
  port: Number(process.env.PORT) || 3000,
  authToken: required('AUTH_TOKEN'),
  databaseUrl: required('DATABASE_URL'),
  pgSsl: String(process.env.PGSSL).toLowerCase() === 'true',
  ownerLogin: required('OWNER_LOGIN'),
  ownerFullName: required('OWNER_FULL_NAME'),
};
