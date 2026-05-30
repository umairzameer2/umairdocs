'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { MessageCircle, X, Send, Minimize2 } from 'lucide-react'
import type { CollabMessage } from './use-collaboration'

function getInitials(name: string): string {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
}

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

// ─── Collab Chat ─────────────────────────────────────────────────────

interface CollabChatProps {
  messages: CollabMessage[]
  onSendMessage: (message: string) => void
  currentUserId: string
  isOpen: boolean
  onToggle: () => void
  collaboratorCount: number
}

export function CollabChat({
  messages,
  onSendMessage,
  currentUserId,
  isOpen,
  onToggle,
  collaboratorCount,
}: CollabChatProps) {
  const [input, setInput] = useState('')
  const [isMinimized, setIsMinimized] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (isOpen && !isMinimized && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen, isMinimized])

  const handleSend = () => {
    const trimmed = input.trim()
    if (!trimmed) return
    onSendMessage(trimmed)
    setInput('')
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <>
      {/* Floating Chat Button - only when chat is closed */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            onClick={onToggle}
            className="fixed bottom-4 left-4 sm:bottom-6 sm:left-6 z-50 h-10 px-4 bg-gradient-to-r from-purple-600 to-purple-500 rounded-full shadow-lg shadow-purple-300/40 flex items-center gap-2 text-white hover:shadow-xl hover:shadow-purple-300/50 hover:scale-105 transition-all duration-200 text-sm font-medium"
            aria-label="Open team chat"
          >
            <MessageCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Team Chat</span>
            {collaboratorCount > 0 && (
              <span className="w-5 h-5 bg-white/20 rounded-full text-[10px] flex items-center justify-center">
                {collaboratorCount + 1}
              </span>
            )}
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className={`fixed z-50 flex flex-col bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200/80 dark:border-slate-700/80 overflow-hidden
              bottom-4 left-4 sm:bottom-6 sm:left-6 w-[calc(100vw-2rem)] sm:w-80
              ${isMinimized ? 'h-12' : 'h-[420px] max-h-[70vh]'}
            `}
          >
            {/* Chat Header */}
            <div className="flex-shrink-0 bg-gradient-to-r from-purple-600 to-purple-500 text-white px-4 py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4" />
                <span className="text-sm font-semibold">Team Chat</span>
                {collaboratorCount + 1 > 1 && (
                  <span className="text-[10px] text-purple-200 bg-white/15 px-1.5 py-0.5 rounded-full">
                    {collaboratorCount + 1} online
                  </span>
                )}
              </div>
              <div className="flex items-center gap-0.5">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-white/70 hover:text-white hover:bg-white/10"
                  onClick={() => setIsMinimized(!isMinimized)}
                >
                  <Minimize2 className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-white/70 hover:text-white hover:bg-white/10"
                  onClick={onToggle}
                >
                  <X className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>

            {/* Chat Messages */}
            {!isMinimized && (
              <>
                <ScrollArea className="flex-1 p-3">
                  <div className="space-y-3">
                    {messages.length === 0 && (
                      <div className="text-center py-8 text-slate-400 dark:text-slate-500">
                        <MessageCircle className="w-6 h-6 mx-auto mb-2 opacity-50" />
                        <p className="text-xs">Start chatting with your team</p>
                      </div>
                    )}

                    {messages.map((msg) => {
                      const isOwn = msg.userId === currentUserId
                      return (
                        <motion.div
                          key={msg.id}
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`flex gap-2 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}
                        >
                          <Avatar className="h-6 w-6 shrink-0 mt-0.5">
                            <AvatarFallback
                              className="text-[8px] font-semibold text-white"
                              style={{ backgroundColor: msg.userColor || '#6366f1' }}
                            >
                              {getInitials(msg.userName)}
                            </AvatarFallback>
                          </Avatar>
                          <div
                            className={`max-w-[75%] rounded-xl px-3 py-1.5 ${
                              isOwn
                                ? 'bg-purple-600 text-white rounded-tr-sm'
                                : 'bg-slate-100 dark:bg-slate-700 border border-slate-200/50 dark:border-slate-600/50 rounded-tl-sm'
                            }`}
                          >
                            {!isOwn && (
                              <p className="text-[10px] font-medium mb-0.5" style={{ color: msg.userColor }}>
                                {msg.userName}
                              </p>
                            )}
                            <p className="text-xs leading-relaxed whitespace-pre-wrap break-words">{msg.message}</p>
                            <p className={`text-[8px] mt-1 ${isOwn ? 'text-purple-200' : 'text-slate-400 dark:text-slate-500'}`}>
                              {formatTime(msg.timestamp)}
                            </p>
                          </div>
                        </motion.div>
                      )
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                {/* Input */}
                <div className="flex-shrink-0 border-t border-slate-200/60 dark:border-slate-700 bg-white dark:bg-slate-800 p-2">
                  <div className="flex items-center gap-1.5">
                    <Input
                      ref={inputRef}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Type a message..."
                      className="h-8 text-xs border-slate-200 dark:border-slate-600 focus:border-purple-300 dark:focus:border-purple-500 rounded-lg"
                    />
                    <Button
                      onClick={handleSend}
                      disabled={!input.trim()}
                      size="icon"
                      className="h-8 w-8 p-0 rounded-lg bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 shrink-0"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
