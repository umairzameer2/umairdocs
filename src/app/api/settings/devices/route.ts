import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    if (!userId) return NextResponse.json({ success: false, error: 'User ID required' }, { status: 400 })

    const sessions = await db.deviceSession.findMany({
      where: { userId },
      orderBy: { lastActive: 'desc' },
    })

    return NextResponse.json({
      success: true,
      sessions: sessions.map((s) => ({
        id: s.id,
        deviceName: s.deviceName,
        deviceType: s.deviceType,
        browser: s.browser,
        os: s.os,
        ipAddress: s.ipAddress,
        location: s.location,
        lastActive: s.lastActive.toISOString(),
        createdAt: s.createdAt.toISOString(),
        isCurrent: s.isCurrent,
      })),
    })
  } catch (error) {
    console.error('Fetch sessions error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, deviceName, deviceType, browser, os } = await request.json()
    if (!userId) return NextResponse.json({ success: false, error: 'User ID required' }, { status: 400 })

    // Get real IP address from request headers
    const forwarded = request.headers.get('x-forwarded-for')
    const realIp = request.headers.get('x-real-ip')
    const clientIp = forwarded?.split(',')[0]?.trim() || realIp || '127.0.0.1'

    // Try to get location from IP (simple approach)
    let location = 'Local'
    try {
      const geoRes = await fetch(`http://ip-api.com/json/${clientIp}?fields=city,country`, {
        signal: AbortSignal.timeout(3000),
      })
      if (geoRes.ok) {
        const geo = await geoRes.json()
        if (geo.city && geo.country) {
          location = `${geo.city}, ${geo.country}`
        }
      }
    } catch {
      location = 'Local'
    }

    // Mark all existing sessions as not current
    await db.deviceSession.updateMany({
      where: { userId, isCurrent: true },
      data: { isCurrent: false },
    })

    const session = await db.deviceSession.create({
      data: {
        userId,
        deviceName: deviceName || 'Unknown Device',
        deviceType: deviceType || 'desktop',
        browser: browser || 'Unknown',
        os: os || 'Unknown',
        ipAddress: clientIp,
        location,
        isCurrent: true,
      },
    })

    return NextResponse.json({
      success: true,
      session: {
        id: session.id,
        deviceName: session.deviceName,
        deviceType: session.deviceType,
        browser: session.browser,
        os: session.os,
        ipAddress: session.ipAddress,
        location: session.location,
        lastActive: session.lastActive.toISOString(),
        createdAt: session.createdAt.toISOString(),
        isCurrent: session.isCurrent,
      },
    })
  } catch (error) {
    console.error('Create session error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')
    const userId = searchParams.get('userId')

    if (!sessionId || !userId) return NextResponse.json({ success: false, error: 'Session ID and User ID required' }, { status: 400 })

    // Don't allow deleting current session
    const session = await db.deviceSession.findUnique({ where: { id: sessionId } })
    if (!session) return NextResponse.json({ success: false, error: 'Session not found' }, { status: 404 })
    if (session.isCurrent) return NextResponse.json({ success: false, error: 'Cannot revoke current session' }, { status: 400 })
    if (session.userId !== userId) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 })

    await db.deviceSession.delete({ where: { id: sessionId } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete session error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}