import pg from 'pg';
import { config } from './config.js';

// Единый пул соединений для всего приложения.
export const pool = new pg.Pool({
  connectionString: config.databaseUrl,
  ssl: config.pgSsl ? { rejectUnauthorized: false } : false,
});

// Ошибка уровня БД -> 503. Помечаем ошибки пула специальным флагом,
// чтобы error-middleware отличал их от ошибок валидации (400).
pool.on('error', (err) => {
  console.error('Unexpected PG pool error:', err.message);
});

export async function query(text, params) {
  try {
    return await pool.query(text, params);
  } catch (err) {
    err.isDbError = true;
    throw err;
  }
}
