import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword, verifyPassword } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { userId, currentPassword, newPassword, resetPassword } = await request.json()
    if (!userId || !newPassword) return NextResponse.json({ success: false, error: 'User ID and new password required' }, { status: 400 })

    if (newPassword.length < 6) return NextResponse.json({ success: false, error: 'Password must be at least 6 characters' }, { status: 400 })

    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user) return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })

    // Google users don't have a real password - they can set one without providing current password
    const isGoogleUser = user.authProvider === 'google'

    // Reset password flow: user forgot their password and confirms via email
    if (resetPassword) {
      const hashedPassword = await hashPassword(newPassword)
      await db.user.update({
        where: { id: userId },
        data: { password: hashedPassword, authProvider: 'email' },
      })
      return NextResponse.json({ success: true })
    }

    if (isGoogleUser) {
      // Google user setting a password for the first time
      const hashedPassword = await hashPassword(newPassword)
      await db.user.update({
        where: { id: userId },
        data: { password: hashedPassword, authProvider: 'email' },
      })
      return NextResponse.json({ success: true })
    }

    // Email users must verify their current password
    if (!currentPassword) {
      return NextResponse.json({ success: false, error: 'Current password is required' }, { status: 400 })
    }

    const valid = await verifyPassword(currentPassword, user.password)
    if (!valid) return NextResponse.json({ success: false, error: 'Current password is incorrect' }, { status: 400 })

    const hashedPassword = await hashPassword(newPassword)
    await db.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Change password error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
