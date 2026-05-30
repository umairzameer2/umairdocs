import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ success: false, valid: false, error: 'User ID required' }, { status: 400 })
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, avatar: true, authProvider: true },
    })

    if (!user) {
      return NextResponse.json({ success: false, valid: false, error: 'User not found' })
    }

    return NextResponse.json({ success: true, valid: true, user })
  } catch (error) {
    console.error('Verify session error:', error)
    return NextResponse.json({ success: false, valid: false, error: 'Verification failed' }, { status: 500 })
  }
}
