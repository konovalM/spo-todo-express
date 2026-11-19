import express from 'express';
import { config } from '../config.js';
import { badRequest, notFound } from '../errors.js';
import {
  validateTitle,
  validateRunId,
  validateDone,
  isUuid,
  rejectExtraKeys,
} from '../validation.js';
import {
  createTask,
  listTasksByRunId,
  getTaskById,
  updateTask,
  deleteTask,
} from '../repository/tasks.js';

// Обёртка, чтобы ошибки из async-хендлеров уходили в error-middleware.
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

export const tasksRouter = express.Router({ strict: true });

// POST /api/tasks/ — создать дело. Разрешены только title и runId.
tasksRouter.post('/', wrap(async (req, res) => {
  rejectExtraKeys(req.body, ['title', 'runId']);
  const title = validateTitle(req.body.title);
  const runId = validateRunId(req.body.runId);
  const task = await createTask({ ownerLogin: config.ownerLogin, title, runId });
  res.status(201).json(task);
}));

// GET /api/tasks/?runId=... — список дел автора с данным runId.
tasksRouter.get('/', wrap(async (req, res) => {
  if (req.query.runId === undefined) {
    throw badRequest('query parameter runId is required');
  }
  const runId = validateRunId(req.query.runId);
  const tasks = await listTasksByRunId(config.ownerLogin, runId);
  res.status(200).json(tasks);
}));

// GET /api/tasks/:id/ — одно дело.
tasksRouter.get('/:id/', wrap(async (req, res) => {
  if (!isUuid(req.params.id)) {
    throw badRequest('invalid UUID');
  }
  const task = await getTaskById(config.ownerLogin, req.params.id);
  if (!task) throw notFound('task not found');
  res.status(200).json(task);
}));

// PATCH /api/tasks/:id/ — обновить title и/или done (непустой набор).
tasksRouter.patch('/:id/', wrap(async (req, res) => {
  if (!isUuid(req.params.id)) {
    throw badRequest('invalid UUID');
  }
  rejectExtraKeys(req.body, ['title', 'done']);
  const patch = {};
  if (Object.prototype.hasOwnProperty.call(req.body, 'title')) {
    patch.title = validateTitle(req.body.title);
  }
  if (Object.prototype.hasOwnProperty.call(req.body, 'done')) {
    patch.done = validateDone(req.body.done);
  }
  if (Object.keys(patch).length === 0) {
    throw badRequest('provide at least one of title or done');
  }
  const task = await updateTask(config.ownerLogin, req.params.id, patch);
  if (!task) throw notFound('task not found');
  res.status(200).json(task);
}));

// DELETE /api/tasks/:id/ — удалить дело. 204 без тела.
tasksRouter.delete('/:id/', wrap(async (req, res) => {
  if (!isUuid(req.params.id)) {
    throw badRequest('invalid UUID');
  }
  const ok = await deleteTask(config.ownerLogin, req.params.id);
  if (!ok) throw notFound('task not found');
  res.status(204).end();
}));
