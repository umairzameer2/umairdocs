import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    if (!userId) return NextResponse.json({ success: false, error: 'User ID required' }, { status: 400 })

    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, avatar: true, authProvider: true, createdAt: true, updatedAt: true },
    })
    if (!user) return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })

    return NextResponse.json({
      success: true,
      profile: { ...user, createdAt: user.createdAt.toISOString(), updatedAt: user.updatedAt.toISOString() },
    })
  } catch (error) {
    console.error('Fetch profile error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { userId, name, avatar } = await request.json()
    if (!userId) return NextResponse.json({ success: false, error: 'User ID required' }, { status: 400 })

    const updateData: Record<string, unknown> = {}
    if (name !== undefined) updateData.name = name
    if (avatar !== undefined) updateData.avatar = avatar

    const user = await db.user.update({
      where: { id: userId },
      data: updateData,
      select: { id: true, email: true, name: true, avatar: true, authProvider: true, createdAt: true, updatedAt: true },
    })

    return NextResponse.json({
      success: true,
      profile: { ...user, createdAt: user.createdAt.toISOString(), updatedAt: user.updatedAt.toISOString() },
    })
  } catch (error) {
    console.error('Update profile error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const field = searchParams.get('field')

    if (!userId) return NextResponse.json({ success: false, error: 'User ID required' }, { status: 400 })

    if (field === 'avatar') {
      const user = await db.user.update({
        where: { id: userId },
        data: { avatar: null },
        select: { id: true, email: true, name: true, avatar: true },
      })
      return NextResponse.json({ success: true, profile: user })
    }

    return NextResponse.json({ success: false, error: 'Invalid field' }, { status: 400 })
  } catch (error) {
    console.error('Delete profile field error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
