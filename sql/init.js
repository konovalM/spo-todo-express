// Применяет schema.sql к целевой БД. Запуск: npm run init-db
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { pool } from '../src/db.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const sql = await readFile(join(__dirname, 'schema.sql'), 'utf8');
await pool.query(sql);
console.log('Schema applied.');
await pool.end();
