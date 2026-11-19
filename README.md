# Список дел: Express + PostgreSQL

Итоговая работа по курсу «Серверные веб-технологии 2026». REST-API «список дел» на
Node.js + Express с хранением в PostgreSQL и интерфейсом на обычном HTML/JS.

- **Студент:** Коноваленко Максим Павлович (ii4elkaa)
- **HTTPS-адрес:** https://94.154.130.35.sslip.io:9443/
- **СУБД:** PostgreSQL 16 · **Площадка:** собственный VPS (Ubuntu 24.04), Docker + nginx
- **Node.js:** 22 (контейнер) · локальная разработка — Node ≥ 20

> Порт 9443, а не 443, потому что 443 на сервере занят другим сервисом. Это
> полноценный HTTPS с доверенным сертификатом Let's Encrypt.

## Архитектура

Приложение разбито по ответственностям: `src/server.js` (Express, strict-routing,
подключение middleware), `src/routes/tasks.js` (контракт CRUD), `src/repository/tasks.js`
(SQL и маппинг полей), `src/validation.js` (правила `title`/`runId`/`done`/UUID),
`src/middleware/auth.js` (Bearer-токен) и `src/middleware/errors.js` (единый JSON-формат
ошибок `{"error":"…"}` с кодами 400/401/404/503). ФИО, логин и токен берутся только из
переменных окружения (`.env`), в тело запросов не принимаются и в исходники не зашиты.
Сервер сам задаёт `id` (UUID), `ownerLogin`, `createdAt` и начальное `done=false`.
Приложение и его **отдельный** Postgres запускаются через `docker-compose`; nginx
терминирует TLS и проксирует на `127.0.0.1:3000`.

## Схема данных и сопоставление полей

Таблица `tasks` (физические столбцы `snake_case` → поля API `camelCase`):

| Поле API    | Столбец БД   | Тип           | Примечание                       |
|-------------|--------------|---------------|----------------------------------|
| `id`        | `id`         | `uuid`        | первичный ключ, задаёт сервер    |
| `ownerLogin`| `owner_login`| `text`        | логин Moodle из конфигурации      |
| `title`     | `title`      | `text`        | 1–200 символов после `trim`      |
| `done`      | `done`       | `boolean`     | по умолчанию `false`             |
| `runId`     | `run_id`     | `text`        | 1–64 символа `[A-Za-z0-9_-]`     |
| `createdAt` | `created_at` | `timestamptz` | отдаётся строкой ISO 8601 (UTC)  |

Схема и индекс — в [`sql/schema.sql`](sql/schema.sql).

## Анализ размещения (проверено 2026-11-19)

| Вариант | СУБД | Бесплатно / оплата | Ограничения | Проверка | Источник |
|---|---|---|---|---|---|
| **Timeweb Cloud** (отечественный) | PostgreSQL 14–18 | платно, от ~230–790 ₽/мес; постоянного free-tier нет | managed-кластер, публичный IP +200 ₽, бэкапы 6 ₽/ГБ; регионы РФ/NL | тариф подтверждён на сайте | [timeweb.cloud](https://timeweb.cloud/services/postgresql) |
| **Supabase** (без оплаты студентом) | PostgreSQL | постоянный free-tier | 500 МБ БД, 2 проекта, **пауза после 7 дней простоя** — не годится для 24/7 | лимиты подтверждены | [uibakery.io](https://uibakery.io/blog/supabase-pricing) |
| **Helios (факультетский)** | по данным кафедры | для студентов ИТМО | требует вузовской учётки; на дату работы **личный доступ не предоставлен/не проверен** | доступа нет — зафиксировано | внутренний ресурс ИТМО |

**Обоснование выбора.** Требуется стабильный 24/7 HTTPS и независимый доступ
проверяющего к БД. Supabase на free-tier засыпает после 7 дней простоя; Timeweb —
платный; Helios на дату работы недоступен. Поэтому развёрнуто на **собственном VPS**:
полный контроль над Postgres, отдельная учебная БД, выдача проверяющему ограниченной
роли и SSH-туннеля (см. ниже).

## Независимый доступ проверяющего к БД

Отдельная роль `todo_grader` имеет только `SELECT/INSERT/UPDATE/DELETE` на таблице
`tasks`. Доступ — через ограниченный SSH-туннель (пользователь `grader`, без shell,
разрешён только проброс на Postgres). Ключ, пароль роли и команды передаются
преподавателю личным сообщением в Moodle (не публикуются).

## Команды

```bash
# Локально (нужен запущенный PostgreSQL; строка подключения — в .env)
cp .env.example .env         # заполнить AUTH_TOKEN, DATABASE_URL, OWNER_*
npm install
npm run init-db              # применить sql/schema.sql
npm run seed                 # создать обязательное «итоговое» дело (runId=manual)
npm start                    # http://127.0.0.1:3000

# Docker (приложение + отдельный Postgres)
docker-compose up -d --build
docker-compose exec app node sql/init.js
docker-compose exec app node sql/seed.js

# Проверка контракта
BASE=http://127.0.0.1:3000 TOKEN=<token> npm run smoke
```

## HTTP-интерфейс (кратко)

`GET /login/` (text/plain, без токена) · `GET /api/author/` · `POST /api/tasks/` ·
`GET /api/tasks/?runId=…` · `GET /api/tasks/:id/` · `PATCH /api/tasks/:id/` ·
`DELETE /api/tasks/:id/`. Все `/api/*` требуют `Authorization: Bearer <token>`,
тела ответов — `application/json`, маршруты оканчиваются на `/`.
