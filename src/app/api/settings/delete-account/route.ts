import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const confirmation = searchParams.get('confirmation')

    if (!userId) return NextResponse.json({ success: false, error: 'User ID required' }, { status: 400 })
    if (confirmation !== 'DELETE_ACCOUNT') return NextResponse.json({ success: false, error: 'Confirmation required' }, { status: 400 })

    // Check user exists
    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user) return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })

    // Use a transaction to ensure all deletions succeed or none do
    await db.$transaction(async (tx) => {
      // 1. Delete change tracks by this user
      await tx.changeTrack.deleteMany({ where: { userId } })

      // 2. Get IDs of organizations created by this user
      const userOrgs = await tx.organization.findMany({
        where: { createdBy: userId },
        select: { id: true },
      })
      const orgIds = userOrgs.map((o) => o.id)

      // 3. If there are organizations, delete their documents' change tracks first
      if (orgIds.length > 0) {
        // Delete change tracks for documents in these orgs
        const orgDocs = await tx.document.findMany({
          where: { organizationId: { in: orgIds } },
          select: { id: true },
        })
        const orgDocIds = orgDocs.map((d) => d.id)

        if (orgDocIds.length > 0) {
          await tx.changeTrack.deleteMany({
            where: { documentId: { in: orgDocIds } },
          })
        }

        // Delete documents in these organizations
        await tx.document.deleteMany({
          where: { organizationId: { in: orgIds } },
        })

        // Delete org members in these organizations
        await tx.orgMember.deleteMany({
          where: { orgId: { in: orgIds } },
        })

        // Delete the organizations
        await tx.organization.deleteMany({
          where: { createdBy: userId },
        })
      }

      // 4. Delete remaining documents by this user (not in orgs already deleted)
      // First delete their change tracks
      const userDocs = await tx.document.findMany({
        where: { authorId: userId },
        select: { id: true },
      })
      const userDocIds = userDocs.map((d) => d.id)

      if (userDocIds.length > 0) {
        await tx.changeTrack.deleteMany({
          where: { documentId: { in: userDocIds } },
        })
      }

      await tx.document.deleteMany({ where: { authorId: userId } })

      // 5. Delete remaining org memberships (orgs created by others)
      await tx.orgMember.deleteMany({ where: { userId } })

      // 6. Delete email addresses
      await tx.emailAddress.deleteMany({ where: { userId } })

      // 7. Delete device sessions
      await tx.deviceSession.deleteMany({ where: { userId } })

      // 8. Finally, delete the user
      await tx.user.delete({ where: { id: userId } })
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete account error:', error)
    const message = error instanceof Error ? error.message : 'Failed to delete account. Please try again.'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
