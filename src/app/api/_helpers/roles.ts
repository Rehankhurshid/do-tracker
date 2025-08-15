import { UserRole } from '@/types'

export class ForbiddenError extends Error { status = 403 }

export function ensureRole(userRole: UserRole, allowed: UserRole[]) {
  if (!allowed.includes(userRole)) {
    throw new ForbiddenError(`Forbidden: requires one of [${allowed.join(', ')}]`)
  }
}
