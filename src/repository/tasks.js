import { randomUUID } from 'node:crypto';
import { query } from '../db.js';

// Маппинг физической строки БД (snake_case) на поля API (camelCase).
// createdAt отдаётся строкой UTC в ISO 8601.
function toApi(row) {
  return {
    id: row.id,
    ownerLogin: row.owner_login,
    title: row.title,
    done: row.done,
    runId: row.run_id,
    createdAt: new Date(row.created_at).toISOString(),
  };
}

export async function createTask({ ownerLogin, title, runId }) {
  const id = randomUUID();
  const { rows } = await query(
    `INSERT INTO tasks (id, owner_login, title, done, run_id, created_at)
     VALUES ($1, $2, $3, false, $4, now())
     RETURNING *`,
    [id, ownerLogin, title, runId],
  );
  return toApi(rows[0]);
}

export async function listTasksByRunId(ownerLogin, runId) {
  const { rows } = await query(
    `SELECT * FROM tasks
     WHERE owner_login = $1 AND run_id = $2
     ORDER BY created_at ASC`,
    [ownerLogin, runId],
  );
  return rows.map(toApi);
}

export async function getTaskById(ownerLogin, id) {
  const { rows } = await query(
    `SELECT * FROM tasks WHERE owner_login = $1 AND id = $2`,
    [ownerLogin, id],
  );
  return rows[0] ? toApi(rows[0]) : null;
}

// Частичное обновление: title и/или done. Возвращает обновлённую строку или null.
export async function updateTask(ownerLogin, id, patch) {
  const sets = [];
  const params = [ownerLogin, id];
  if (Object.prototype.hasOwnProperty.call(patch, 'title')) {
    params.push(patch.title);
    sets.push(`title = $${params.length}`);
  }
  if (Object.prototype.hasOwnProperty.call(patch, 'done')) {
    params.push(patch.done);
    sets.push(`done = $${params.length}`);
  }
  const { rows } = await query(
    `UPDATE tasks SET ${sets.join(', ')}
     WHERE owner_login = $1 AND id = $2
     RETURNING *`,
    params,
  );
  return rows[0] ? toApi(rows[0]) : null;
}

export async function deleteTask(ownerLogin, id) {
  const { rowCount } = await query(
    `DELETE FROM tasks WHERE owner_login = $1 AND id = $2`,
    [ownerLogin, id],
  );
  return rowCount > 0;
}
