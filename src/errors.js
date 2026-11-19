// Единый тип ошибки с HTTP-статусом. message попадает в тело {"error": message}.
export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export const badRequest = (msg) => new HttpError(400, msg);
export const unauthorized = (msg = 'unauthorized') => new HttpError(401, msg);
export const notFound = (msg = 'not found') => new HttpError(404, msg);
