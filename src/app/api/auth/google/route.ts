import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { email, name, avatar } = await request.json()

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      )
    }

    // Check if user already exists
    let user = await db.user.findUnique({ where: { email } })

    if (user) {
      // User exists - log them in
      return NextResponse.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatar: user.avatar,
          authProvider: user.authProvider,
        },
      })
    }

    // Create new user with a random password (they authenticate via Google)
    const randomPassword = crypto.randomUUID()
    const hashedPassword = await hashPassword(randomPassword)

    user = await db.user.create({
      data: {
        email,
        name: name || email.split('@')[0],
        avatar: avatar || null,
        password: hashedPassword,
        authProvider: 'google',
        emails: {
          create: {
            email,
            isPrimary: true,
            verified: true,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        authProvider: user.authProvider,
      },
    })
  } catch (error) {
    console.error('Google auth error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
