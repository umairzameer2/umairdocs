import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// ─── Get pending invitations for a user's email ────────────────────
// GET /api/invitations/pending?email=xxx
export async function GET(request: NextRequest) {
  try {
    const email = request.nextUrl.searchParams.get('email')

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'email is required' },
        { status: 400 }
      )
    }

    const invitations = await db.invitation.findMany({
      where: {
        email,
        acceptedAt: null,
        expiresAt: { gt: new Date() },
      },
      include: {
        organization: {
          select: { id: true, name: true, icon: true, description: true },
        },
        inviter: {
          select: { id: true, name: true, email: true, avatar: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({
      success: true,
      invitations: invitations.map((inv) => ({
        id: inv.id,
        token: inv.token,
        email: inv.email,
        role: inv.role,
        expiresAt: inv.expiresAt.toISOString(),
        createdAt: inv.createdAt.toISOString(),
        organization: inv.organization,
        inviter: inv.inviter,
      })),
    })
  } catch (error) {
    console.error('Fetch pending invitations error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
