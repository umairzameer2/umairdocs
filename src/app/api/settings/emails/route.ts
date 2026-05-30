import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    if (!userId) return NextResponse.json({ success: false, error: 'User ID required' }, { status: 400 })

    const emails = await db.emailAddress.findMany({
      where: { userId },
      orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
    })

    return NextResponse.json({
      success: true,
      emails: emails.map((e) => ({
        id: e.id,
        email: e.email,
        isPrimary: e.isPrimary,
        verified: e.verified,
        createdAt: e.createdAt.toISOString(),
      })),
    })
  } catch (error) {
    console.error('Fetch emails error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, email } = await request.json()
    if (!userId || !email) return NextResponse.json({ success: false, error: 'User ID and email required' }, { status: 400 })

    // Check if email already exists
    const existing = await db.emailAddress.findUnique({ where: { email } })
    if (existing) return NextResponse.json({ success: false, error: 'Email address already in use' }, { status: 400 })

    // Check how many emails the user already has (limit 5)
    const count = await db.emailAddress.count({ where: { userId } })
    if (count >= 5) return NextResponse.json({ success: false, error: 'Maximum 5 email addresses allowed' }, { status: 400 })

    const emailAddress = await db.emailAddress.create({
      data: { email, userId, isPrimary: false, verified: true },
    })

    return NextResponse.json({
      success: true,
      email: {
        id: emailAddress.id,
        email: emailAddress.email,
        isPrimary: emailAddress.isPrimary,
        verified: emailAddress.verified,
        createdAt: emailAddress.createdAt.toISOString(),
      },
    })
  } catch (error) {
    console.error('Add email error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const emailId = searchParams.get('emailId')
    const userId = searchParams.get('userId')

    if (!emailId || !userId) return NextResponse.json({ success: false, error: 'Email ID and User ID required' }, { status: 400 })

    // Check if it's the primary email
    const emailRecord = await db.emailAddress.findUnique({ where: { id: emailId } })
    if (!emailRecord) return NextResponse.json({ success: false, error: 'Email not found' }, { status: 404 })
    if (emailRecord.isPrimary) return NextResponse.json({ success: false, error: 'Cannot remove primary email address' }, { status: 400 })
    if (emailRecord.userId !== userId) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 })

    await db.emailAddress.delete({ where: { id: emailId } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete email error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { emailId, userId, makePrimary } = await request.json()
    if (!emailId || !userId) return NextResponse.json({ success: false, error: 'Email ID and User ID required' }, { status: 400 })

    if (makePrimary) {
      // Unset current primary
      await db.emailAddress.updateMany({
        where: { userId, isPrimary: true },
        data: { isPrimary: false },
      })
      // Set new primary
      await db.emailAddress.update({
        where: { id: emailId },
        data: { isPrimary: true },
      })
      // Also update user's main email
      const emailRecord = await db.emailAddress.findUnique({ where: { id: emailId } })
      if (emailRecord) {
        await db.user.update({
          where: { id: userId },
          data: { email: emailRecord.email },
        })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Update email error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
