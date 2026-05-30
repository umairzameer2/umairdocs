import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const members = await db.orgMember.findMany({
      where: { orgId: id },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatar: true },
        },
      },
      orderBy: { joinedAt: 'asc' },
    })

    return NextResponse.json({
      success: true,
      members: members.map((m) => ({
        id: m.id,
        role: m.role,
        joinedAt: m.joinedAt.toISOString(),
        user: m.user,
      })),
    })
  } catch (error) {
    console.error('Fetch members error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { email, role } = await request.json()

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      )
    }

    // Find user by email — auto-create if they don't exist yet (invitation)
    let user = await db.user.findUnique({ where: { email } })

    if (!user) {
      // Auto-create a placeholder account for the invited user
      const randomPassword = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2)
      const hashedPassword = await hashPassword(randomPassword)
      const nameFromEmail = email.split('@')[0]

      user = await db.user.create({
        data: {
          email,
          name: nameFromEmail,
          password: hashedPassword,
        },
      })
    }

    // Check if already a member
    const existing = await db.orgMember.findUnique({
      where: { orgId_userId: { orgId: id, userId: user.id } },
    })

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'User is already a member' },
        { status: 400 }
      )
    }

    const member = await db.orgMember.create({
      data: {
        orgId: id,
        userId: user.id,
        role: role || 'member',
      },
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
    console.error('Add member error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
