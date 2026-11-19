import { HttpError } from '../errors.js';

// Ошибка парсинга JSON от express.json() -> 400.
export function jsonSyntaxHandler(err, _req, res, next) {
  if (err && err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'invalid JSON' });
  }
  next(err);
}

// Централизованный обработчик ошибок. Все тела ошибок — {"error": "..."}.
export function errorHandler(err, _req, res, _next) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.message });
  }
  if (err && err.isDbError) {
    console.error('DB error:', err.message);
    return res.status(503).json({ error: 'database unavailable' });
  }
  console.error('Unexpected error:', err);
  return res.status(500).json({ error: 'internal error' });
}

// 404 для неизвестных маршрутов (в JSON, т.к. вне /api это редкость).
export function notFoundHandler(_req, res) {
  res.status(404).json({ error: 'route not found' });
}
