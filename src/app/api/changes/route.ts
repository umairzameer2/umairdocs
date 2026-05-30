import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const documentId = searchParams.get('documentId')
    const organizationId = searchParams.get('organizationId')

    if (documentId) {
      const changes = await db.changeTrack.findMany({
        where: { documentId },
        include: {
          user: {
            select: { id: true, name: true, email: true, avatar: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      })

      return NextResponse.json({
        success: true,
        changes: changes.map((c) => ({
          id: c.id,
          action: c.action,
          description: c.description,
          oldValue: c.oldValue,
          newValue: c.newValue,
          createdAt: c.createdAt.toISOString(),
          user: c.user,
        })),
      })
    }

    if (organizationId) {
      const changes = await db.changeTrack.findMany({
        where: {
          document: { organizationId },
        },
        include: {
          user: {
            select: { id: true, name: true, email: true, avatar: true },
          },
          document: {
            select: { id: true, title: true, icon: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      })

      return NextResponse.json({
        success: true,
        changes: changes.map((c) => ({
          id: c.id,
          action: c.action,
          description: c.description,
          oldValue: c.oldValue,
          newValue: c.newValue,
          createdAt: c.createdAt.toISOString(),
          user: c.user,
          document: c.document,
        })),
      })
    }

    return NextResponse.json(
      { success: false, error: 'Document ID or Organization ID is required' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Fetch changes error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { documentId, userId, action, description, oldValue, newValue } = await request.json()

    if (!documentId || !userId || !action) {
      return NextResponse.json(
        { success: false, error: 'Document ID, user ID, and action are required' },
        { status: 400 }
      )
    }

    const change = await db.changeTrack.create({
      data: {
        documentId,
        userId,
        action,
        description: description || '',
        oldValue: oldValue || null,
        newValue: newValue || null,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatar: true },
        },
      },
    })

    return NextResponse.json({
      success: true,
      change: {
        id: change.id,
        action: change.action,
        description: change.description,
        oldValue: change.oldValue,
        newValue: change.newValue,
        createdAt: change.createdAt.toISOString(),
        user: change.user,
      },
    })
  } catch (error) {
    console.error('Create change error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
