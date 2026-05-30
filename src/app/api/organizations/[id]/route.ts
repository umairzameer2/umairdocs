import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const organization = await db.organization.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true, avatar: true },
            },
          },
          orderBy: { joinedAt: 'asc' },
        },
        _count: { select: { documents: true } },
      },
    })

    if (!organization) {
      return NextResponse.json(
        { success: false, error: 'Organization not found' },
        { status: 404 }
      )
    }

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
        memberCount: organization.members.length,
        documentCount: organization._count.documents,
        members: organization.members.map((m) => ({
          id: m.id,
          role: m.role,
          joinedAt: m.joinedAt.toISOString(),
          user: m.user,
        })),
      },
    })
  } catch (error) {
    console.error('Fetch organization error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { name, description, icon } = await request.json()

    const organization = await db.organization.update({
      where: { id },
      data: { name, description, icon },
    })

    return NextResponse.json({
      success: true,
      organization: {
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
        description: organization.description,
        icon: organization.icon,
        updatedAt: organization.updatedAt.toISOString(),
      },
    })
  } catch (error) {
    console.error('Update organization error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Delete related change tracks for org documents first
    const orgDocs = await db.document.findMany({
      where: { organizationId: id },
      select: { id: true },
    })

    if (orgDocs.length > 0) {
      await db.changeTrack.deleteMany({
        where: { documentId: { in: orgDocs.map((d) => d.id) } },
      })
    }

    // Delete documents that belong to this org
    await db.document.deleteMany({
      where: { organizationId: id },
    })

    // Delete org (members cascade automatically)
    await db.organization.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete organization error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
