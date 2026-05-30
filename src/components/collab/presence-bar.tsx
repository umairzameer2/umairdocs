'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Badge } from '@/components/ui/badge'
import { Wifi, WifiOff, Loader2, Users, Pencil } from 'lucide-react'
import type { RemoteUser, ActivityData, ConnectionStatus } from './use-collaboration'

function getInitials(name: string): string {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
}

// ─── Presence Bar ────────────────────────────────────────────────────

interface PresenceBarProps {
  remoteUsers: RemoteUser[]
  activities: Map<string, ActivityData>
  connectionStatus: ConnectionStatus
  currentUser: { id: string; name: string | null; email: string; avatar: string | null } | null
}

export function PresenceBar({ remoteUsers, activities, connectionStatus, currentUser }: PresenceBarProps) {
  const totalUsers = remoteUsers.length + 1 // +1 for current user

  return (
    <div className="flex items-center gap-2">
      {/* Connection status indicator */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center">
              {connectionStatus === 'connected' ? (
                <Wifi className="w-3.5 h-3.5 text-green-500" />
              ) : connectionStatus === 'connecting' || connectionStatus === 'reconnecting' ? (
                <Loader2 className="w-3.5 h-3.5 text-amber-500 animate-spin" />
              ) : (
                <WifiOff className="w-3.5 h-3.5 text-slate-400" />
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">
            {connectionStatus === 'connected'
              ? 'Real-time sync active'
              : connectionStatus === 'connecting'
                ? 'Connecting...'
                : connectionStatus === 'reconnecting'
                  ? 'Reconnecting...'
                  : 'Offline - changes saved locally'}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* User count */}
      {totalUsers > 1 && (
        <Badge variant="secondary" className="h-6 text-[10px] gap-1 px-1.5 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800">
          <Users className="w-3 h-3" />
          {totalUsers}
        </Badge>
      )}

      {/* User avatars */}
      <div className="flex items-center -space-x-2">
        {/* Current user */}
        {currentUser && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="relative">
                  <Avatar className="h-7 w-7 border-2 border-white dark:border-slate-800 ring-2 ring-green-400">
                    {currentUser.avatar ? <AvatarImage src={currentUser.avatar} alt="" /> : null}
                    <AvatarFallback className="bg-gradient-to-br from-purple-500 to-purple-600 text-white text-[9px] font-semibold">
                      {getInitials(currentUser.name || currentUser.email)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-white dark:border-slate-800" />
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                You ({currentUser.name || currentUser.email})
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        {/* Remote users */}
        <AnimatePresence>
          {remoteUsers.map((remoteUser) => (
            <motion.div
              key={remoteUser.id}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            >
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="relative">
                      <Avatar
                        className="h-7 w-7 border-2 border-white dark:border-slate-800"
                        style={{ boxShadow: `0 0 0 2px ${remoteUser.color}40` }}
                      >
                        {remoteUser.avatar ? <AvatarImage src={remoteUser.avatar} alt="" /> : null}
                        <AvatarFallback
                          className="text-white text-[9px] font-semibold"
                          style={{ backgroundColor: remoteUser.color }}
                        >
                          {getInitials(remoteUser.name)}
                        </AvatarFallback>
                      </Avatar>
                      <span
                        className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-slate-800"
                        style={{ backgroundColor: remoteUser.color }}
                      />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="text-xs">
                    <div className="flex items-center gap-1.5">
                      <span>{remoteUser.name}</span>
                      {activities.has(remoteUser.id) && (
                        <span className="flex items-center gap-0.5 text-purple-500">
                          <Pencil className="w-2.5 h-2.5" />
                          typing...
                        </span>
                      )}
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}

// ─── Typing Indicator ────────────────────────────────────────────────

interface TypingIndicatorProps {
  activities: Map<string, ActivityData>
}

export function TypingIndicator({ activities }: TypingIndicatorProps) {
  const typingUsers = Array.from(activities.values()).filter((a) => a.type === 'typing')

  if (typingUsers.length === 0) return null

  const names = typingUsers.map((a) => a.name).filter(Boolean)

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 5 }}
      className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 px-2"
    >
      <div className="flex gap-0.5">
        <motion.span
          className="w-1 h-1 rounded-full bg-purple-500"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1, repeat: Infinity, delay: 0 }}
        />
        <motion.span
          className="w-1 h-1 rounded-full bg-purple-500"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
        />
        <motion.span
          className="w-1 h-1 rounded-full bg-purple-500"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
        />
      </div>
      <span>
        {names.length === 1
          ? `${names[0]} is typing...`
          : names.length === 2
            ? `${names[0]} and ${names[1]} are typing...`
            : `${names.length} people are typing...`}
      </span>
    </motion.div>
  )
}

// ─── Remote Cursor Overlay ────────────────────────────────────────────

interface RemoteCursorOverlayProps {
  cursors: Map<string, CursorData>
  editorRef: React.RefObject<HTMLDivElement | null>
}

export function RemoteCursorOverlay({ cursors }: RemoteCursorOverlayProps) {
  // This component renders remote cursors as absolute-positioned elements
  // It relies on data-cursor attributes in the editor DOM for positioning

  return (
    <>
      {Array.from(cursors.entries()).map(([userId, cursor]) => {
        if (!cursor.position) return null

        return (
          <div
            key={userId}
            className="remote-cursor-indicator"
            data-remote-cursor={userId}
            data-cursor-line={cursor.position.line}
            data-cursor-column={cursor.position.column}
            style={{ '--cursor-color': cursor.color } as React.CSSProperties}
          />
        )
      })}
    </>
  )
}

// Re-export type
export type { CursorData }
