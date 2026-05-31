import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sendEmail, isEmailConfigured, invitationEmailTemplate } from '@/lib/email'
import { getUserOrgRole } from '@/lib/org-permissions'
import crypto from 'crypto'

// Valid roles that can be assigned to invited users
const VALID_INVITE_ROLES = ['member', 'viewer']

// ─── Create an invitation ────────────────────────────────────────
// POST /api/invitations
// Body: { orgId, email, role, invitedBy }
// Only admins can create invitations.
export async function POST(request: NextRequest) {
  try {
    const { orgId, email, role = 'viewer', invitedBy } = await request.json()

    if (!orgId || !email || !invitedBy) {
      return NextResponse.json(
        { success: false, error: 'orgId, email, and invitedBy are required' },
        { status: 400 }
      )
    }

    // Validate role — only member or viewer can be assigned via invitation
    if (!VALID_INVITE_ROLES.includes(role)) {
      return NextResponse.json(
        { success: false, error: 'Invalid role. Only "member" or "viewer" can be assigned to invited members.' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email address' },
        { status: 400 }
      )
    }

    // Check org exists
    const org = await db.organization.findUnique({
      where: { id: orgId },
      include: { members: true },
    })
    if (!org) {
      return NextResponse.json(
        { success: false, error: 'Organization not found' },
        { status: 404 }
      )
    }

    // Check inviter is an ADMIN of the org (only admins can invite)
    const inviterRole = await getUserOrgRole(invitedBy, orgId)
    if (!inviterRole) {
      return NextResponse.json(
        { success: false, error: 'You are not a member of this organization' },
        { status: 403 }
      )
    }
    if (inviterRole !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Only the organization admin can invite members' },
        { status: 403 }
      )
    }

    // Get inviter's user info
    const inviterUser = await db.user.findUnique({ where: { id: invitedBy } })
    if (!inviterUser) {
      return NextResponse.json(
        { success: false, error: 'Inviter not found' },
        { status: 404 }
      )
    }

    // Check if user is already a member
    const existingUser = await db.user.findUnique({ where: { email } })
    if (existingUser) {
      const existingMember = await db.orgMember.findUnique({
        where: { orgId_userId: { orgId, userId: existingUser.id } },
      })
      if (existingMember) {
        return NextResponse.json(
          { success: false, error: 'This user is already a member' },
          { status: 400 }
        )
      }
    }

    // Check for existing pending invitation
    const existingInvitation = await db.invitation.findFirst({
      where: {
        email,
        orgId,
        acceptedAt: null,
        expiresAt: { gt: new Date() },
      },
    })
    if (existingInvitation) {
      return NextResponse.json(
        { success: false, error: 'An invitation has already been sent to this email' },
        { status: 400 }
      )
    }

    // Create invitation with token
    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

    const invitation = await db.invitation.create({
      data: {
        token,
        email,
        orgId,
        role,
        invitedBy,
        expiresAt,
      },
    })

    // Send invitation email
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000'
    const acceptUrl = `${baseUrl}/?invitation=${token}`

    const emailTemplate = invitationEmailTemplate({
      orgName: org.name,
      orgIcon: org.icon || '🏢',
      inviterName: inviterUser.name || inviterUser.email,
      role,
      acceptUrl,
    })

    const emailSent = await sendEmail({
      to: email,
      subject: `${inviterUser.name || inviterUser.email} invited you to join "${org.name}" on UmairDocs`,
      html: emailTemplate.html,
      text: emailTemplate.text,
    })

    return NextResponse.json({
      success: true,
      invitation: {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        token: invitation.token,
        acceptUrl,
        expiresAt: invitation.expiresAt.toISOString(),
        emailSent,
        emailConfigured: isEmailConfigured(),
      },
    })
  } catch (error) {
    console.error('Create invitation error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// ─── List pending invitations for an org ──────────────────────────
// GET /api/invitations?orgId=xxx
// Only admins can list invitations.
export async function GET(request: NextRequest) {
  try {
    const orgId = request.nextUrl.searchParams.get('orgId')
    const userId = request.nextUrl.searchParams.get('userId')

    if (!orgId) {
      return NextResponse.json(
        { success: false, error: 'orgId is required' },
        { status: 400 }
      )
    }

    // Verify the requester is an admin
    if (userId) {
      const role = await getUserOrgRole(userId, orgId)
      if (role !== 'admin') {
        return NextResponse.json(
          { success: false, error: 'Only admins can view invitations' },
          { status: 403 }
        )
      }
    }

    const invitations = await db.invitation.findMany({
      where: {
        orgId,
        acceptedAt: null,
        expiresAt: { gt: new Date() },
      },
      include: {
        inviter: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({
      success: true,
      invitations: invitations.map((inv) => ({
        id: inv.id,
        email: inv.email,
        role: inv.role,
        token: inv.token,
        expiresAt: inv.expiresAt.toISOString(),
        createdAt: inv.createdAt.toISOString(),
        inviter: inv.inviter,
      })),
    })
  } catch (error) {
    console.error('Fetch invitations error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// ─── Delete/cancel an invitation ──────────────────────────────────
// DELETE /api/invitations?invitationId=xxx&userId=xxx
// Only admins can cancel invitations.
export async function DELETE(request: NextRequest) {
  try {
    const invitationId = request.nextUrl.searchParams.get('invitationId')
    const userId = request.nextUrl.searchParams.get('userId')

    if (!invitationId) {
      return NextResponse.json(
        { success: false, error: 'invitationId is required' },
        { status: 400 }
      )
    }

    // Find the invitation to get the orgId
    const invitation = await db.invitation.findUnique({ where: { id: invitationId } })
    if (!invitation) {
      return NextResponse.json(
        { success: false, error: 'Invitation not found' },
        { status: 404 }
      )
    }

    // Verify the requester is an admin of the org
    if (userId) {
      const role = await getUserOrgRole(userId, invitation.orgId)
      if (role !== 'admin') {
        return NextResponse.json(
          { success: false, error: 'Only admins can cancel invitations' },
          { status: 403 }
        )
      }
    }

    await db.invitation.delete({ where: { id: invitationId } })

    return NextResponse.json({ success: true, message: 'Invitation cancelled' })
  } catch (error) {
    console.error('Delete invitation error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}