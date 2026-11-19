import { SetMetadata } from '@nestjs/common';
import type { Role } from '@schoolcoin/types';

export const ROLES_KEY = 'roles';

/** @Roles(...PERMISSIONS.FINANCE) — take the roles from the permission matrix in @schoolcoin/types. */
export const Roles = (...roles: readonly Role[]) => SetMetadata(ROLES_KEY, roles);
