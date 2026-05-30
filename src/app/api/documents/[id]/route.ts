import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const document = await db.document.findUnique({
      where: { id },
      include: {
        author: {
          select: { id: true, name: true, email: true, avatar: true },
        },
      },
    })

    if (!document) {
      return NextResponse.json(
        { success: false, error: 'Document not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      document: {
        ...document,
        authorName: document.author.name || document.author.email,
        createdAt: document.createdAt.toISOString(),
        updatedAt: document.updatedAt.toISOString(),
      },
    })
  } catch (error) {
    console.error('Fetch document error:', error)
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

    // Read body as text first to handle large content (e.g., documents with embedded images)
    // This avoids any implicit JSON parser size limits
    const bodyText = await request.text()
    let rawData: Record<string, unknown>
    try {
      rawData = JSON.parse(bodyText)
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON body' },
        { status: 400 }
      )
    }

        // Extract _userId before passing data to Prisma (it's not a Document field)
    const _userId = rawData._userId as string | undefined
    const { _userId: _, ...updateData } = rawData

    // Get the old document for change tracking
    const oldDoc = await db.document.findUnique({ where: { id } })

    const document = await db.document.update({
      where: { id },
      data: updateData,
    })

    // Log changes if userId is provided
    if (_userId && oldDoc) {
      const changes: Array<{ action: string; description: string; oldValue?: string; newValue?: string }> = []

      if (updateData.title && updateData.title !== oldDoc.title) {
        changes.push({
          action: 'rename',
          description: `Renamed document from "${oldDoc.title}" to "${updateData.title}"`,
          oldValue: oldDoc.title,
                    newValue: updateData.title as string,
        })
      }

      if (updateData.content && updateData.content !== oldDoc.content) {
        changes.push({
          action: 'edit',
          description: `Edited content of "${document.title}"`,
          oldValue: oldDoc.content,
          newValue: updateData.content as string,
        })
      }

      if (updateData.isStarred !== undefined && updateData.isStarred !== oldDoc.isStarred) {
        changes.push({
          action: 'star',
          description: `${updateData.isStarred ? 'Starred' : 'Unstarred'} "${document.title}"`,
        })
      }

      if (updateData.isTrashed !== undefined && updateData.isTrashed !== oldDoc.isTrashed) {
        changes.push({
          action: 'trash',
          description: `${updateData.isTrashed ? 'Moved to trash' : 'Restored'} "${document.title}"`,
        })
      }

      // Create change track entries
      for (const change of changes) {
        await db.changeTrack.create({
          data: {
            documentId: id,
            userId: _userId,
            action: change.action,
            description: change.description,
            oldValue: change.oldValue || null,
            newValue: change.newValue || null,
          },
        })
      }
    }

    return NextResponse.json({
      success: true,
      document: {
        ...document,
        createdAt: document.createdAt.toISOString(),
        updatedAt: document.updatedAt.toISOString(),
      },
    })
  } catch (error) {
    console.error('Update document error:', error)
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

    // Check if document exists
    const doc = await db.document.findUnique({ where: { id } })
    if (!doc) {
      return NextResponse.json(
        { success: false, error: 'Document not found' },
        { status: 404 }
      )
    }

    // Delete change tracks first (avoid foreign key issues), then delete the document
    await db.changeTrack.deleteMany({ where: { documentId: id } })
    await db.document.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete document error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
