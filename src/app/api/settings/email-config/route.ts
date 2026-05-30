import { NextResponse } from 'next/server'
import { getEmailProvider } from '@/lib/email'

// GET /api/settings/email-config — check if email is configured
export async function GET() {
  const provider = getEmailProvider()
  return NextResponse.json({
    configured: provider !== 'none',
    provider,
  })
}
