import { NotImplementedException } from '@nestjs/common';

/** Placeholder body for endpoints whose behaviour is specified but not built yet. */
export function notImplemented(requirement: string): never {
  throw new NotImplementedException(`Not implemented yet (${requirement})`);
}
