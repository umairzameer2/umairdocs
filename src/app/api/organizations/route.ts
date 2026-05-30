import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      )
    }

    const memberships = await db.orgMember.findMany({
      where: { userId },
      include: {
        organization: {
          include: {
            members: {
              include: {
                user: {
                  select: { id: true, name: true, email: true, avatar: true },
                },
              },
            },
            _count: { select: { documents: true } },
          },
        },
      },
      orderBy: { joinedAt: 'desc' },
    })

    const organizations = memberships.map((m) => ({
      id: m.organization.id,
      name: m.organization.name,
      slug: m.organization.slug,
      description: m.organization.description,
      icon: m.organization.icon,
      createdBy: m.organization.createdBy,
      createdAt: m.organization.createdAt.toISOString(),
      updatedAt: m.organization.updatedAt.toISOString(),
      role: m.role,
      memberCount: m.organization.members.length,
      documentCount: m.organization._count.documents,
      members: m.organization.members.map((mem) => ({
        id: mem.id,
        role: mem.role,
        joinedAt: mem.joinedAt.toISOString(),
        user: mem.user,
      })),
    }))

    return NextResponse.json({ success: true, organizations })
  } catch (error) {
    console.error('Fetch organizations error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, description, icon, userId } = await request.json()

    if (!name || !userId) {
      return NextResponse.json(
        { success: false, error: 'Name and user ID are required' },
        { status: 400 }
      )
    }

    // Generate slug from name
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      + '-' + Date.now().toString(36)

    const organization = await db.organization.create({
      data: {
        name,
        slug,
        description: description || '',
        icon: icon || '🏢',
        createdBy: userId,
        members: {
          create: {
            userId,
            role: 'owner',
          },
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true, avatar: true },
            },
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      organization: {
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
        description: organization.description,
        icon: organization.icon,
        createdBy: organization.createdBy,
        createdAt: organization.createdAt.toISOString(),
        updatedAt: organization.updatedAt.toISOString(),
        role: 'owner',
        memberCount: organization.members.length,
        documentCount: 0,
        members: organization.members.map((m) => ({
          id: m.id,
          role: m.role,
          joinedAt: m.joinedAt.toISOString(),
          user: m.user,
        })),
      },
    })
  } catch (error) {
    console.error('Create organization error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
