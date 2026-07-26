import { badRequest } from '../lib/errors.js';

/**
 * Validates and REPLACES req.body / req.query / req.params with the parsed
 * result. Replacing rather than merging is what makes this a real defence:
 * unknown keys are dropped, so a request cannot smuggle `role: "admin"` past a
 * controller that spreads the body into a model.
 */
export const validate = (schemas) => (req, _res, next) => {
  try {
    if (schemas.body) req.body = schemas.body.parse(req.body ?? {});
    if (schemas.query) req.validatedQuery = schemas.query.parse(req.query ?? {});
    if (schemas.params) req.params = schemas.params.parse(req.params ?? {});
    next();
  } catch (err) {
    if (err?.issues) {
      return next(
        badRequest(
          'Some fields need attention.',
          err.issues.map((i) => ({ field: i.path.join('.') || '(root)', message: i.message }))
        )
      );
    }
    next(err);
  }
};
