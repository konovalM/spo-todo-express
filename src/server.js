import express from 'express';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { config } from './config.js';
import { requireAuth } from './middleware/auth.js';
import {
  jsonSyntaxHandler,
  errorHandler,
  notFoundHandler,
} from './middleware/errors.js';
import { tasksRouter } from './routes/tasks.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();

// Точное соответствие контракту: маршруты оканчиваются на «/».
app.set('strict routing', true);
app.set('x-powered-by', false);

app.use(express.json());

// Статический интерфейс (обычный HTML/JS).
app.use(express.static(join(__dirname, '..', 'public')));

// GET /login/ — логин Moodle, text/plain, без токена.
app.get('/login/', (_req, res) => {
  res.type('text/plain').status(200).send(config.ownerLogin);
});

// Все /api/* требуют Bearer-токен.
app.use('/api', requireAuth);

// GET /api/author/ — login и fullName из конфигурации.
app.get('/api/author/', (_req, res) => {
  res.status(200).json({ login: config.ownerLogin, fullName: config.ownerFullName });
});

// CRUD дел.
app.use('/api/tasks', tasksRouter);

// Неизвестные маршруты и обработка ошибок.
app.use(notFoundHandler);
app.use(jsonSyntaxHandler);
app.use(errorHandler);

app.listen(config.port, () => {
  console.log(`todo app listening on http://127.0.0.1:${config.port} (owner: ${config.ownerLogin})`);
});
