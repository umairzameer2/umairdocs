'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'
import { useAppStore } from '@/store/app-store'

// ─── Types ────────────────────────────────────────────────────────────

export interface RemoteUser {
  id: string
  name: string
  email: string
  avatar: string | null
  color: string
  cursorPosition: { line: number; column: number } | null
  lastActive: number
}

export interface CursorData {
  userId: string
  color: string
  name: string
  position: { line: number; column: number } | null
}

export interface SelectionData {
  userId: string
  color: string
  name: string
  selection: {
    start: { line: number; column: number }
    end: { line: number; column: number }
  } | null
}

export interface CollabMessage {
  id: string
  userId: string
  userName: string
  userColor: string
  message: string
  timestamp: number
}

export interface ActivityData {
  userId: string
  name: string
  type: 'typing' | 'idle'
}

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting'

// ─── Hook ─────────────────────────────────────────────────────────────

const COLLAB_PORT = 3003

export function useCollaboration(documentId: string | null) {
  const { user } = useAppStore()
  const socketRef = useRef<Socket | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected')
  const [remoteUsers, setRemoteUsers] = useState<RemoteUser[]>([])
  const [remoteCursors, setRemoteCursors] = useState<Map<string, CursorData>>(new Map())
  const [remoteSelections, setRemoteSelections] = useState<Map<string, SelectionData>>(new Map())
  const [activities, setActivities] = useState<Map<string, ActivityData>>(new Map())
  const [messages, setMessages] = useState<CollabMessage[]>([])
  const [documentVersion, setDocumentVersion] = useState(0)
  const [isSyncing, setIsSyncing] = useState(false)

  // Refs for stable callbacks
  const onRemoteChangeRef = useRef<((content: string, version: number) => void) | null>(null)
  const onRemoteTitleRef = useRef<((title: string) => void) | null>(null)

  // ─── Connect / Disconnect ────────────────────────────────────────
  useEffect(() => {
    if (!documentId || !user) {
      // Use a micro-task to avoid synchronous setState in effect
      queueMicrotask(() => {
        setConnectionStatus('disconnected')
        setRemoteUsers([])
        setRemoteCursors(new Map())
        setRemoteSelections(new Map())
        setActivities(new Map())
      })
      return
    }

    queueMicrotask(() => {
      setConnectionStatus('connecting')
    })

    const socket = io('/?XTransformPort=' + COLLAB_PORT, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
    })

    socketRef.current = socket

    socket.on('connect', () => {
      console.log('[collab] Connected to collaboration server')
      setConnectionStatus('connected')
    })

    socket.on('disconnect', () => {
      console.log('[collab] Disconnected from collaboration server')
      setConnectionStatus('disconnected')
    })

    socket.on('reconnecting', () => {
      setConnectionStatus('reconnecting')
    })

    // ─── Room events ────────────────────────────────────────────

    socket.on('collab:joined', (data: {
      documentId: string
      users: RemoteUser[]
      content: string | null
      version: number
    }) => {
      console.log('[collab] Joined document room', data.documentId, `(${data.users.length} other users)`)
      setRemoteUsers(data.users)
      setDocumentVersion(data.version)
    })

    socket.on('collab:user_joined', (userData: RemoteUser) => {
      console.log('[collab] User joined:', userData.name)
      setRemoteUsers((prev) => {
        if (prev.some((u) => u.id === userData.id)) return prev
        return [...prev, userData]
      })
    })

    socket.on('collab:user_left', (data: { socketId: string; userId: string; userName?: string }) => {
      console.log('[collab] User left:', data.userName || data.userId)
      setRemoteUsers((prev) => prev.filter((u) => u.id !== data.userId))
      setRemoteCursors((prev) => {
        const next = new Map(prev)
        next.delete(data.userId)
        return next
      })
      setRemoteSelections((prev) => {
        const next = new Map(prev)
        next.delete(data.userId)
        return next
      })
      setActivities((prev) => {
        const next = new Map(prev)
        next.delete(data.userId)
        return next
      })
    })

    // ─── Document sync ──────────────────────────────────────────

    socket.on('collab:change', (data: {
      content: string
      version: number
      userId: string
      delta?: {
        type: 'insert' | 'delete' | 'replace'
        position: number
        text?: string
        length?: number
      }
    }) => {
      setIsSyncing(true)
      setDocumentVersion(data.version)
      if (onRemoteChangeRef.current) {
        onRemoteChangeRef.current(data.content, data.version)
      }
      // Clear syncing after a short delay
      setTimeout(() => setIsSyncing(false), 300)
    })

    socket.on('collab:title', (data: { title: string; userId: string }) => {
      if (onRemoteTitleRef.current) {
        onRemoteTitleRef.current(data.title)
      }
    })

    // ─── Cursor & Selection ─────────────────────────────────────

    socket.on('collab:cursor', (data: CursorData) => {
      setRemoteCursors((prev) => {
        const next = new Map(prev)
        next.set(data.userId, data)
        return next
      })
    })

    socket.on('collab:selection', (data: SelectionData) => {
      setRemoteSelections((prev) => {
        const next = new Map(prev)
        next.set(data.userId, data)
        return next
      })
    })

    // ─── Activity ───────────────────────────────────────────────

    socket.on('collab:activity', (data: ActivityData) => {
      setActivities((prev) => {
        const next = new Map(prev)
        if (data.type === 'idle') {
          next.delete(data.userId)
        } else {
          next.set(data.userId, { ...data, lastActive: Date.now() })
        }
        return next
      })
    })

    // ─── Chat messages ──────────────────────────────────────────

    socket.on('collab:message', (msg: CollabMessage) => {
      setMessages((prev) => [...prev, msg])
    })

    return () => {
      socket.disconnect()
      socketRef.current = null
      setConnectionStatus('disconnected')
      setRemoteUsers([])
      setRemoteCursors(new Map())
      setRemoteSelections(new Map())
      setActivities(new Map())
    }
  }, [documentId, user?.id])

  // ─── Actions ──────────────────────────────────────────────────────

  const joinDocument = useCallback((content?: string) => {
    if (!socketRef.current || !documentId || !user) return
    socketRef.current.emit('doc:join', {
      documentId,
      user: {
        id: user.id,
        name: user.name || user.email.split('@')[0],
        email: user.email,
        avatar: user.avatar,
      },
      content,
    })
  }, [documentId, user])

  const leaveDocument = useCallback(() => {
    if (!socketRef.current || !documentId) return
    socketRef.current.disconnect()
    socketRef.current = null
    setConnectionStatus('disconnected')
    setRemoteUsers([])
  }, [documentId])

  const sendChange = useCallback((content: string, version: number, delta?: {
    type: 'insert' | 'delete' | 'replace'
    position: number
    text?: string
    length?: number
  }) => {
    if (!socketRef.current || !documentId) return
    socketRef.current.emit('doc:change', { documentId, content, version, delta })
  }, [documentId])

  const sendTitle = useCallback((title: string) => {
    if (!socketRef.current || !documentId) return
    socketRef.current.emit('doc:title', { documentId, title })
  }, [documentId])

  const sendCursor = useCallback((position: { line: number; column: number } | null) => {
    if (!socketRef.current || !documentId) return
    socketRef.current.emit('doc:cursor', { documentId, position })
  }, [documentId])

  const sendSelection = useCallback((selection: {
    start: { line: number; column: number }
    end: { line: number; column: number }
  } | null) => {
    if (!socketRef.current || !documentId) return
    socketRef.current.emit('doc:selection', { documentId, selection })
  }, [documentId])

  const sendActivity = useCallback((type: 'typing' | 'idle') => {
    if (!socketRef.current || !documentId) return
    socketRef.current.emit('doc:activity', { documentId, type })
  }, [documentId])

  const sendMessage = useCallback((message: string) => {
    if (!socketRef.current || !documentId) return
    socketRef.current.emit('doc:message', { documentId, message })
  }, [documentId])

  // ─── Callback setters ────────────────────────────────────────────

  const onRemoteChange = useCallback((handler: (content: string, version: number) => void) => {
    onRemoteChangeRef.current = handler
  }, [])

  const onRemoteTitle = useCallback((handler: (title: string) => void) => {
    onRemoteTitleRef.current = handler
  }, [])

  // ─── Typing indicator cleanup ────────────────────────────────────

  useEffect(() => {
    const interval = setInterval(() => {
      setActivities((prev) => {
        const now = Date.now()
        const next = new Map<string, ActivityData>()
        let changed = false
        for (const [key, val] of prev) {
          if (now - val.lastActive < 5000) {
            next.set(key, val)
          } else {
            changed = true
          }
        }
        return changed ? next : prev
      })
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  return {
    // State
    connectionStatus,
    remoteUsers,
    remoteCursors,
    remoteSelections,
    activities,
    messages,
    documentVersion,
    isSyncing,
    isConnected: connectionStatus === 'connected',
    collaboratorCount: remoteUsers.length,

    // Actions
    joinDocument,
    leaveDocument,
    sendChange,
    sendTitle,
    sendCursor,
    sendSelection,
    sendActivity,
    sendMessage,

    // Callback setters
    onRemoteChange,
    onRemoteTitle,
  }
}
