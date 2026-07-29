/** Errors that are safe to surface to a client verbatim. */
export class AppError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
    this.expose = true;
  }
}

export const badRequest = (msg, details) => new AppError(400, 'bad_request', msg, details);
export const unauthorized = (msg = 'Sign in to continue.') => new AppError(401, 'unauthorized', msg);
export const forbidden = (msg = 'You do not have access to this.') => new AppError(403, 'forbidden', msg);
export const notFound = (msg = 'Not found.') => new AppError(404, 'not_found', msg);
export const conflict = (msg) => new AppError(409, 'conflict', msg);
export const tooMany = (msg = 'Too many requests. Try again shortly.') => new AppError(429, 'rate_limited', msg);
