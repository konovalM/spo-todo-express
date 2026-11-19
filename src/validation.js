import { badRequest } from './errors.js';

const RUN_ID_RE = /^[A-Za-z0-9_-]{1,64}$/;
const UUID_RE = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

// title: строка, после trim от 1 до 200 символов. Возвращает очищенное значение.
export function validateTitle(value) {
  if (typeof value !== 'string') {
    throw badRequest('title must be a string');
  }
  const trimmed = value.trim();
  if (trimmed.length < 1 || trimmed.length > 200) {
    throw badRequest('title length must be 1..200 after trim');
  }
  return trimmed;
}

// runId: 1-64 символа из [A-Za-z0-9_-].
export function validateRunId(value) {
  if (typeof value !== 'string' || !RUN_ID_RE.test(value)) {
    throw badRequest('runId must match [A-Za-z0-9_-]{1,64}');
  }
  return value;
}

// done: только boolean.
export function validateDone(value) {
  if (typeof value !== 'boolean') {
    throw badRequest('done must be a boolean');
  }
  return value;
}

export function isUuid(value) {
  return typeof value === 'string' && UUID_RE.test(value);
}

// Разрешаем в теле только перечисленные ключи, иначе 400 (лишние поля).
export function rejectExtraKeys(body, allowed) {
  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    throw badRequest('body must be a JSON object');
  }
  for (const key of Object.keys(body)) {
    if (!allowed.includes(key)) {
      throw badRequest(`unexpected field: ${key}`);
    }
  }
}
