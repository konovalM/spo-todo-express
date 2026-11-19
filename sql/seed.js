// Создаёт обязательное «итоговое» дело через код приложения (репозиторий).
// Идемпотентно: не дублирует при повторном запуске. Запуск: npm run seed
import { config } from '../src/config.js';
import { pool } from '../src/db.js';
import { createTask, listTasksByRunId } from '../src/repository/tasks.js';

const title = `Итоговая работа 24.10.2026: ${config.ownerLogin}`;
const runId = 'manual';

const existing = await listTasksByRunId(config.ownerLogin, runId);
if (existing.some((t) => t.title === title)) {
  console.log('Manual task already exists, skipping.');
} else {
  const task = await createTask({ ownerLogin: config.ownerLogin, title, runId });
  console.log('Created manual task:', task.id);
}
await pool.end();
