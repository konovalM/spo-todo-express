import { config } from '../config.js';
import { unauthorized } from '../errors.js';

// Проверяет Authorization: Bearer <token>. Без корректного токена -> 401.
export function requireAuth(req, _res, next) {
  const header = req.get('authorization') || '';
  const match = header.match(/^Bearer\s+(.+)$/);
  if (!match || match[1] !== config.authToken) {
    return next(unauthorized('invalid or missing bearer token'));
  }
  next();
}
