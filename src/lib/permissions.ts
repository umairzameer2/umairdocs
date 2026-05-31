import { db } from '@/lib/db'

/**
 * Role hierarchy and permission constants for the UmairDocs role-based system.
 *
 * - admin:  Full access — manage members, create/edit/delete docs, delete org, invite users
 * - member: Can create and edit docs; cannot delete org docs, manage members, or invite users
 * - viewer: Read-only access; cannot create, edit, or delete docs
 */

/** Set of roles that are allowed to create and edit documents in an org */
export const CAN_EDIT_ROLES = new Set(['admin', 'member'])

/** Set of roles that are allowed to delete documents in an org */
export const CAN_DELETE_ROLES = new Set(['admin'])

/**
 * Look up a user's role within a specific organization.
 *
 * @param userId - The user's ID
 * @param orgId  - The organization's ID
 * @returns The role string ('admin' | 'member' | 'viewer') or null if not a member
 */
export async function getUserOrgRole(
  userId: string,
  orgId: string
): Promise<string | null> {
  const membership = await db.orgMember.findUnique({
    where: {
      orgId_userId: { orgId, userId },
    },
    select: { role: true },
  })

  return membership?.role ?? null
}