import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { authenticateOrgRequest } from '@/lib/org-permissions'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  try {
    const { id: orgId, memberId } = await params

    // Permission check: only admin can change roles
    const auth = await authenticateOrgRequest(request, orgId, 'admin')
    if ('error' in auth) return auth.error

    const { role } = await request.json()

    // Validate the new role
    if (!['admin', 'member', 'viewer'].includes(role)) {
      return NextResponse.json(
        { success: false, error: 'Invalid role. Must be admin, member, or viewer.' },
        { status: 400 }
      )
    }

    // Find the target member to validate the operation
    const targetMember = await db.orgMember.findUnique({
      where: { id: memberId },
    })

    if (!targetMember || targetMember.orgId !== orgId) {
      return NextResponse.json(
        { success: false, error: 'Member not found in this organization' },
        { status: 404 }
      )
    }

    // Admin role cannot be changed (ownership transfer is a separate flow)
    if (targetMember.role === 'admin' && role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Cannot change the role of the organization admin' },
        { status: 403 }
      )
    }

    const member = await db.orgMember.update({
      where: { id: memberId },
      data: { role },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatar: true },
        },
      },
    })

    return NextResponse.json({
      success: true,
      member: {
        id: member.id,
        role: member.role,
        joinedAt: member.joinedAt.toISOString(),
        user: member.user,
      },
    })
  } catch (error) {
    console.error('Update member error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  try {
    const { id: orgId, memberId } = await params

    // Permission check: only admin can remove members
    const auth = await authenticateOrgRequest(request, orgId, 'admin')
    if ('error' in auth) return auth.error

    // Find the target member to validate the operation
    const targetMember = await db.orgMember.findUnique({
      where: { id: memberId },
    })

    if (!targetMember || targetMember.orgId !== orgId) {
      return NextResponse.json(
        { success: false, error: 'Member not found in this organization' },
        { status: 404 }
      )
    }

    // Cannot remove the admin from the organization
    if (targetMember.role === 'admin') {
      return NextResponse.json(
        { success: false, error: 'Cannot remove the organization admin' },
        { status: 403 }
      )
    }

    await db.orgMember.delete({ where: { id: memberId } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Remove member error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
