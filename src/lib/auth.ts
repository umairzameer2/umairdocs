import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Simple hash function for passwords (in production, use bcrypt)
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password + 'doc-editor-salt-2024')
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  const hash = await hashPassword(password)
  return hash === hashedPassword
}

export async function getSessionUser(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return null
  
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true, avatar: true },
  })
  return user
}
