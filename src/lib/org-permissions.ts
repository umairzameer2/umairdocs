import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Valid organization member roles, ordered by privilege level (highest first).
 *
 * - admin:  Full access — manage members, create/edit/delete docs, delete org, invite users
 * - member: Can create and edit docs; cannot delete org docs, manage members, or invite users
 * - viewer: Read-only access; cannot create, edit, or delete docs
 */
const ROLE_HIERARCHY: Record<string, number> = {
  admin: 3,
  member: 2,
  viewer: 1,
}

/**
 * Only the admin can manage members (add, remove, change roles, invite).
 */
const MEMBER_MANAGEMENT_ROLES = ['admin']

/**
 * Look up the role of a given user within a given organization.
 * Returns null if the user is not a member of the organization.
 */
export async function getUserOrgRole(
  userId: string,
  orgId: string
): Promise<string | null> {
  const membership = await db.orgMember.findUnique({
    where: { orgId_userId: { orgId, userId } },
    select: { role: true },
  })
  return membership?.role ?? null
}

/**
 * Check whether a role has at least the required privilege level.
 */
export function hasRolePrivilege(role: string, minimumRole: string): boolean {
  return (ROLE_HIERARCHY[role] ?? 0) >= (ROLE_HIERARCHY[minimumRole] ?? 0)
}

/**
 * Check whether a role is allowed to manage members.
 * Only admins can manage members, invite users, and change roles.
 */
export function canManageMembers(role: string): boolean {
  return MEMBER_MANAGEMENT_ROLES.includes(role)
}

/**
 * Get the numeric privilege level of a role.
 */
export function getRoleLevel(role: string): number {
  return ROLE_HIERARCHY[role] ?? 0
}

/**
 * Authenticate the request and verify the user's role in the organization.
 * Returns either an error NextResponse or the authenticated context.
 *
 * Usage:
 *   const result = await authenticateOrgRequest(request, orgId, 'member')
 *   if (result.error) return result.error
 *   const { user, role } = result.context
 */
export async function authenticateOrgRequest(
  request: NextRequest,
  orgId: string,
  minimumRole: string
): Promise<
  | { error: NextResponse }
  | { context: { userId: string; role: string } }
> {
  // 1. Authenticate the user
  const user = await getSessionUser(request)
  if (!user) {
    return {
      error: NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      ),
    }
  }

  // 2. Verify the user is a member of the organization
  const role = await getUserOrgRole(user.id, orgId)
  if (!role) {
    return {
      error: NextResponse.json(
        { success: false, error: 'You are not a member of this organization' },
        { status: 403 }
      ),
    }
  }

  // 3. Check role privilege
  if (!hasRolePrivilege(role, minimumRole)) {
    return {
      error: NextResponse.json(
        { success: false, error: 'You do not have permission to perform this action' },
        { status: 403 }
      ),
    }
  }

  return { context: { userId: user.id, role } }
}
