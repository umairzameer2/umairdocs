import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword } from '@/lib/auth'

// ─── Get invitation details (public) ─────────────────────────────
// GET /api/invitations/[token]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params

    const invitation = await db.invitation.findUnique({
      where: { token },
      include: {
        organization: {
          select: { id: true, name: true, icon: true, description: true },
        },
        inviter: {
          select: { id: true, name: true, email: true, avatar: true },
        },
      },
    })

    if (!invitation) {
      return NextResponse.json(
        { success: false, error: 'Invitation not found' },
        { status: 404 }
      )
    }

    // Check if expired
    if (invitation.expiresAt < new Date()) {
      return NextResponse.json(
        { success: false, error: 'Invitation has expired', expired: true },
        { status: 410 }
      )
    }

    // Check if already accepted
    if (invitation.acceptedAt) {
      return NextResponse.json(
        { success: false, error: 'Invitation has already been accepted', accepted: true },
        { status: 410 }
      )
    }

    // Check if user with this email already exists
    const existingUser = await db.user.findUnique({
      where: { email: invitation.email },
    })

    return NextResponse.json({
      success: true,
      invitation: {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        expiresAt: invitation.expiresAt.toISOString(),
        organization: invitation.organization,
        inviter: invitation.inviter,
        userExists: !!existingUser,
      },
    })
  } catch (error) {
    console.error('Get invitation error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// ─── Accept an invitation ────────────────────────────────────────
// POST /api/invitations/[token]
// Body: { userId? } — if user is logged in, pass userId; if new user, they'll need to signup first
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params
    const body = await request.json().catch(() => ({}))
    const { userId, name, password } = body

    const invitation = await db.invitation.findUnique({
      where: { token },
    })

    if (!invitation) {
      return NextResponse.json(
        { success: false, error: 'Invitation not found' },
        { status: 404 }
      )
    }

    if (invitation.expiresAt < new Date()) {
      return NextResponse.json(
        { success: false, error: 'Invitation has expired' },
        { status: 410 }
      )
    }

    if (invitation.acceptedAt) {
      return NextResponse.json(
        { success: false, error: 'Invitation has already been accepted' },
        { status: 410 }
      )
    }

    let targetUserId = userId

    // If no userId provided, find or create the user
    if (!targetUserId) {
      const existingUser = await db.user.findUnique({
        where: { email: invitation.email },
      })

      if (existingUser) {
        targetUserId = existingUser.id
      } else {
        // Create new user (they need to provide a password)
        if (!password) {
          return NextResponse.json(
            { success: false, error: 'Password is required for new accounts', needsSignup: true },
            { status: 400 }
          )
        }

        const hashedPassword = await hashPassword(password)
        const newName = name || invitation.email.split('@')[0]

        const newUser = await db.user.create({
          data: {
            email: invitation.email,
            name: newName,
            password: hashedPassword,
            authProvider: 'email',
          },
        })
        targetUserId = newUser.id
      }
    }

    // Check if already a member
    const existingMember = await db.orgMember.findUnique({
      where: { orgId_userId: { orgId: invitation.orgId, userId: targetUserId } },
    })

    if (existingMember) {
      // Mark invitation as accepted anyway
      await db.invitation.update({
        where: { id: invitation.id },
        data: { acceptedAt: new Date() },
      })
      return NextResponse.json({
        success: true,
        message: 'You are already a member of this organization',
        alreadyMember: true,
      })
    }

    // Add user to organization
    const member = await db.orgMember.create({
      data: {
        orgId: invitation.orgId,
        userId: targetUserId,
        role: invitation.role,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatar: true },
        },
      },
    })

    // Mark invitation as accepted
    await db.invitation.update({
      where: { id: invitation.id },
      data: { acceptedAt: new Date() },
    })

    // Get the user for auto-login
    const user = await db.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, email: true, name: true, avatar: true, authProvider: true },
    })

    return NextResponse.json({
      success: true,
      message: 'Invitation accepted! Welcome to the organization.',
      member: {
        id: member.id,
        role: member.role,
        joinedAt: member.joinedAt.toISOString(),
        user: member.user,
      },
      user,
    })
  } catch (error) {
    console.error('Accept invitation error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
