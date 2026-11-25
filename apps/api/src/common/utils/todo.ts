import { AppError } from '../errors/app-error';

/** Placeholder body for endpoints whose behaviour is specified but not built yet. */
export function notImplemented(requirement: string): never {
  throw new AppError('NOT_IMPLEMENTED', 501, `Not implemented yet (${requirement})`);
}
