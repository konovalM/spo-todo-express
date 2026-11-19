-- Учебная таблица дел. Отдельная таблица для проверяющего.
-- Соответствие полей API <-> физических столбцов описано в README.
CREATE TABLE IF NOT EXISTS tasks (
    id          uuid        PRIMARY KEY,           -- API: id (UUID-строка)
    owner_login text        NOT NULL,              -- API: ownerLogin (логин Moodle)
    title       text        NOT NULL,              -- API: title
    done        boolean     NOT NULL DEFAULT false, -- API: done
    run_id      text        NOT NULL,              -- API: runId
    created_at  timestamptz NOT NULL DEFAULT now() -- API: createdAt (ISO 8601 UTC)
);

-- Ускоряет выборку GET /api/tasks/?runId=...
CREATE INDEX IF NOT EXISTS idx_tasks_owner_run
    ON tasks (owner_login, run_id, created_at);
