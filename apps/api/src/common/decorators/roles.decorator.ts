import { SetMetadata } from '@nestjs/common';
import type { Role } from '@schoolcoin/types';

export const ROLES_KEY = 'roles';

/** @Roles('ACCOUNTANT', 'ADMIN') */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
