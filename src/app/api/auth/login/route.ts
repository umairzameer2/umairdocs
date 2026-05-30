import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyPassword } from '@/lib/auth'
import { sendEmail, welcomeEmailTemplate } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      )
    }

    const user = await db.user.findUnique({ where: { email } })

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    const isValid = await verifyPassword(password, user.password)

    if (!isValid) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Send login notification email (don't block the response)
    sendEmail({
      to: user.email,
      subject: 'Sign-in notification — UmairDocs',
      html: welcomeEmailTemplate({
        name: user.name || user.email.split('@')[0],
        email: user.email,
        isSignup: false,
      }).html,
      text: welcomeEmailTemplate({
        name: user.name || user.email.split('@')[0],
        email: user.email,
        isSignup: false,
      }).text,
    }).catch(() => { /* don't block login if email fails */ })

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
    console.error('Login error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}