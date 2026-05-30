import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword } from '@/lib/auth'
import { sendEmail, welcomeEmailTemplate } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 6 characters' },
        { status: 400 }
      )
    }

    const existingUser = await db.user.findUnique({ where: { email } })

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'An account with this email already exists' },
        { status: 409 }
      )
    }

    const hashedPassword = await hashPassword(password)

    const user = await db.user.create({
      data: {
        email,
        password: hashedPassword,
        name: name || email.split('@')[0],
        authProvider: 'email',
        emails: {
          create: {
            email,
            isPrimary: true,
            verified: true,
          },
        },
      },
    })

    // Send welcome email (don't block the response)
    sendEmail({
      to: user.email,
      subject: 'Welcome to UmairDocs! 🎉',
      html: welcomeEmailTemplate({
        name: user.name || user.email.split('@')[0],
        email: user.email,
        isSignup: true,
      }).html,
      text: welcomeEmailTemplate({
        name: user.name || user.email.split('@')[0],
        email: user.email,
        isSignup: true,
      }).text,
    }).catch(() => { /* don't block signup if email fails */ })

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
    console.error('Signup error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}