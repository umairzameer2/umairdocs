import { NextResponse } from 'next/server'

export async function POST() {
  const response = NextResponse.json({ success: true })

  // Clear NextAuth session cookies — these persist for 30 days and can
  // cause auto sign-in even after our Zustand state is cleared
  const cookieOptions = {
    path: '/',
    maxAge: 0,
    httpOnly: true,
    sameSite: 'lax' as const,
  }

  response.cookies.set('next-auth.session-token', '', cookieOptions)
  response.cookies.set('next-auth.callback-url', '', cookieOptions)
  response.cookies.set('next-auth.csrf-token', '', cookieOptions)
  response.cookies.set('__Secure-next-auth.session-token', '', {
    ...cookieOptions,
    secure: true,
  })

  return response
}
