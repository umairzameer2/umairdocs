'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  MessageCircle,
  X,
  Send,
  Trash2,
  Bot,
  User,
  Sparkles,
  Loader2,
  Minimize2,
} from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

// Parse markdown-like formatting from AI responses
function formatAIResponse(content: string) {
  const lines = content.split('\n')
  const elements: React.ReactNode[] = []

  let inCodeBlock = false
  let codeContent = ''
  let inList = false

  lines.forEach((line, i) => {
    // Code blocks
    if (line.startsWith('```')) {
      if (inCodeBlock) {
        elements.push(
          <pre key={`code-${i}`} className="bg-muted text-foreground rounded-lg p-3 my-2 overflow-x-auto text-xs font-mono border border-border">
            <code>{codeContent.trim()}</code>
          </pre>
        )
        codeContent = ''
        inCodeBlock = false
      } else {
        inCodeBlock = true
      }
      return
    }

    if (inCodeBlock) {
      codeContent += line + '\n'
      return
    }

    // Headers
    if (line.startsWith('### ')) {
      elements.push(<h4 key={`h3-${i}`} className="font-semibold text-foreground mt-3 mb-1 text-sm">{line.slice(4)}</h4>)
      return
    }
    if (line.startsWith('## ')) {
      elements.push(<h3 key={`h2-${i}`} className="font-bold text-foreground mt-3 mb-1 text-base">{line.slice(3)}</h3>)
      return
    }
    if (line.startsWith('# ')) {
      elements.push(<h2 key={`h1-${i}`} className="font-bold text-purple-500 mt-3 mb-1 text-base">{line.slice(2)}</h2>)
      return
    }

    // Horizontal rule
    if (line.match(/^---+$/)) {
      elements.push(<hr key={`hr-${i}`} className="border-border my-2" />)
      return
    }

    // Bullet lists
    if (line.match(/^\s*[-*•]\s/)) {
      const text = line.replace(/^\s*[-*•]\s/, '')
      elements.push(
        <div key={`li-${i}`} className="flex gap-2 ml-2 my-0.5">
          <span className="text-purple-500 mt-0.5 flex-shrink-0">•</span>
          <span className="text-sm text-muted-foreground" dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(text) }} />
        </div>
      )
      inList = true
      return
    }

    // Numbered lists
    if (line.match(/^\s*\d+[.)]\s/)) {
      const numMatch = line.match(/^\s*(\d+)[.)]\s/)
      const num = numMatch ? numMatch[1] : '1'
      const text = line.replace(/^\s*\d+[.)]\s/, '')
      elements.push(
        <div key={`oli-${i}`} className="flex gap-2 ml-2 my-0.5">
          <span className="text-purple-500 font-medium text-sm flex-shrink-0">{num}.</span>
          <span className="text-sm text-muted-foreground" dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(text) }} />
        </div>
      )
      inList = true
      return
    }

    // Empty line
    if (line.trim() === '') {
      if (inList) {
        inList = false
      }
      elements.push(<div key={`blank-${i}`} className="h-1" />)
      return
    }

    // Regular paragraph
    inList = false
    elements.push(
      <p key={`p-${i}`} className="text-sm text-muted-foreground my-0.5 leading-relaxed" dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(line) }} />
    )
  })

  return elements
}

function formatInlineMarkdown(text: string): string {
  let result = text.replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-foreground">$1</strong>')
  result = result.replace(/\*(.+?)\*/g, '<em>$1</em>')
  result = result.replace(/`(.+?)`/g, '<code class="bg-muted text-purple-500 px-1 py-0.5 rounded text-xs font-mono">$1</code>')
  return result
}

export function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [streamingContent, setStreamingContent] = useState('')
  const [sessionId] = useState(() => `chat-${Date.now()}-${Math.random().toString(36).slice(2)}`)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, streamingContent, scrollToBottom])

  // Auto-focus input when chat opens, un-minimizes, or AI finishes responding
  useEffect(() => {
    if (isOpen && !isMinimized && !isLoading && inputRef.current) {
      // Small delay to ensure DOM is ready after state updates
      const timer = setTimeout(() => inputRef.current?.focus(), 50)
      return () => clearTimeout(timer)
    }
  }, [isOpen, isMinimized, isLoading])

  const handleSend = async () => {
    const trimmed = input.trim()
    if (!trimmed || isLoading) return

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: trimmed,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsLoading(true)
    setStreamingContent('')

    // Create abort controller for this request
    const abortController = new AbortController()
    abortRef.current = abortController

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          message: trimmed,
          stream: true,
        }),
        signal: abortController.signal,
      })

      if (!response.ok) {
        // Try to parse error as JSON
        try {
          const data = await response.json()
          throw new Error(data.error || 'Failed to get response')
        } catch {
          throw new Error('Failed to get response from AI')
        }
      }

      const contentType = response.headers.get('content-type') || ''

      if (contentType.includes('text/event-stream') && response.body) {
        // Handle SSE streaming response
        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let accumulated = ''
        let sseBuffer = ''
        let streamDone = false

        // Client-side safety timeout (60s) to prevent stream from hanging forever
        const streamTimeout = setTimeout(() => {
          streamDone = true
          try { reader.cancel() } catch { /* ignore */ }
        }, 60_000)

        try {
          while (!streamDone) {
            const { done, value } = await reader.read()
            if (done) break

            sseBuffer += decoder.decode(value, { stream: true })
            const lines = sseBuffer.split('\n')
            sseBuffer = lines.pop() || ''

            for (const line of lines) {
              const trimmedLine = line.trim()
              if (!trimmedLine || !trimmedLine.startsWith('data: ')) continue

              const data = trimmedLine.slice(6).trim()
              if (!data) continue
              if (data === '[DONE]') {
                // Stream finished — break out of BOTH loops immediately
                streamDone = true
                break
              }

              try {
                const parsed = JSON.parse(data)
                if (parsed.content) {
                  accumulated += parsed.content
                  setStreamingContent(accumulated)
                }
              } catch {
                // Incomplete JSON, continue
              }
            }
          }
        } finally {
          clearTimeout(streamTimeout)
          try { reader.releaseLock() } catch { /* already released */ }
        }

        // Add the completed streaming message
        if (accumulated) {
          const assistantMessage: ChatMessage = {
            id: `assistant-${Date.now()}`,
            role: 'assistant',
            content: accumulated,
            timestamp: new Date(),
          }
          setMessages((prev) => [...prev, assistantMessage])
        }
      } else {
        // Handle JSON response (non-streaming fallback)
        const data = await response.json()

        if (!data.success) {
          throw new Error(data.error || 'Failed to get response')
        }

        const assistantMessage: ChatMessage = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: data.response,
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, assistantMessage])
      }
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        // User cancelled, ignore
        return
      }
      console.error('Chat error:', error)
      const errorContent = (error as Error).message || 'Sorry, I encountered an error. Please try again.'
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: errorContent.includes('API key') || errorContent.includes('not configured')
          ? '⚠️ AI is not configured yet. Please ask your admin to set up the AI_API_KEY in the environment variables, or the system will use the built-in AI assistant.'
          : 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
      toast({
        title: 'AI Error',
        description: 'Failed to get a response. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
      setStreamingContent('')
      abortRef.current = null
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleClearChat = async () => {
    // Abort any pending request
    if (abortRef.current) {
      abortRef.current.abort()
    }
    try {
      await fetch('/api/chat', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      })
    } catch {
      // Ignore errors clearing
    }
    setMessages([])
    setStreamingContent('')
    toast({ title: 'Chat cleared', description: 'Starting a fresh conversation' })
  }

  const welcomeMessage: ChatMessage = {
    id: 'welcome',
    role: 'assistant',
    content: "Hello! I'm your **UmairDocs AI Assistant** 🎓\n\nI can help you with:\n- Answering academic questions across all subjects\n- Concluding and summarizing multiple answers\n- Explaining complex topics step by step\n- Helping with your documents\n\nAsk me anything!",
    timestamp: new Date(),
  }

  const displayMessages = messages.length === 0 ? [welcomeMessage] : messages

  return (
    <>
      {/* Floating Chat Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-gradient-to-br from-purple-600 to-purple-500 rounded-full shadow-lg shadow-purple-300/40 flex items-center justify-center text-white hover:shadow-xl hover:shadow-purple-300/50 hover:scale-105 transition-all duration-200 group"
            aria-label="Open AI Assistant"
          >
            <MessageCircle className="w-6 h-6 group-hover:scale-110 transition-transform" />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-background animate-pulse" />
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
            className={`fixed z-50 flex flex-col bg-card rounded-2xl shadow-2xl border border-border overflow-hidden
              bottom-6 right-6 w-[calc(100vw-3rem)] sm:w-96
              ${isMinimized ? 'h-14' : 'h-[520px] max-h-[80vh]'}
            `}
          >
            {/* Chat Header */}
            <div className="flex-shrink-0 bg-gradient-to-r from-purple-600 to-purple-500 text-white px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                  <Bot className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm leading-tight">AI Assistant</h3>
                  <p className="text-[10px] text-purple-200 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full inline-block" />
                    Online • Ready to help
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-white/70 hover:text-white hover:bg-white/10"
                  onClick={handleClearChat}
                  title="Clear chat"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-white/70 hover:text-white hover:bg-white/10"
                  onClick={() => setIsMinimized(!isMinimized)}
                  title={isMinimized ? 'Expand' : 'Minimize'}
                >
                  <Minimize2 className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-white/70 hover:text-white hover:bg-white/10"
                  onClick={() => { setIsOpen(false); setIsMinimized(false) }}
                  title="Close"
                >
                  <X className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>

            {/* Chat Messages */}
            {!isMinimized && (
              <>
                <div className="flex-1 overflow-y-auto p-4 space-y-4 docs-scrollbar bg-background/30">
                  {displayMessages.map((msg) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                      className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                    >
                      <Avatar className="h-7 w-7 flex-shrink-0 mt-0.5">
                        <AvatarFallback
                          className={
                            msg.role === 'assistant'
                              ? 'bg-gradient-to-br from-purple-500 to-purple-600 text-white text-[10px]'
                              : 'bg-muted text-muted-foreground text-[10px]'
                          }
                        >
                          {msg.role === 'assistant' ? <Bot className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                        </AvatarFallback>
                      </Avatar>
                      <div
                        className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 ${
                          msg.role === 'user'
                            ? 'bg-purple-600 text-white rounded-tr-sm'
                            : 'bg-card border border-border shadow-sm rounded-tl-sm'
                        }`}
                      >
                        {msg.role === 'assistant' ? (
                          <div className="ai-response">{formatAIResponse(msg.content)}</div>
                        ) : (
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                        )}
                        <p
                          className={`text-[9px] mt-1.5 ${
                            msg.role === 'user' ? 'text-purple-200' : 'text-muted-foreground'
                          }`}
                        >
                          {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </motion.div>
                  ))}

                  {/* Streaming message (being typed) */}
                  {isLoading && streamingContent && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex gap-2.5"
                    >
                      <Avatar className="h-7 w-7 flex-shrink-0 mt-0.5">
                        <AvatarFallback className="bg-gradient-to-br from-purple-500 to-purple-600 text-white text-[10px]">
                          <Bot className="w-3.5 h-3.5" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="max-w-[80%] bg-card border border-border shadow-sm rounded-2xl rounded-tl-sm px-3.5 py-2.5">
                        <div className="ai-response">{formatAIResponse(streamingContent)}</div>
                        <span className="inline-block w-1.5 h-4 bg-purple-500 animate-pulse ml-0.5 align-text-bottom" />
                      </div>
                    </motion.div>
                  )}

                  {/* Loading indicator (when no streaming content yet) */}
                  {isLoading && !streamingContent && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex gap-2.5"
                    >
                      <Avatar className="h-7 w-7 flex-shrink-0">
                        <AvatarFallback className="bg-gradient-to-br from-purple-500 to-purple-600 text-white text-[10px]">
                          <Bot className="w-3.5 h-3.5" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="bg-card border border-border shadow-sm rounded-2xl rounded-tl-sm px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-500" />
                          <span className="text-xs text-muted-foreground">Thinking...</span>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* Quick Suggestions */}
                {messages.length === 0 && !isLoading && (
                  <div className="px-4 pb-2 flex-shrink-0">
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        'Explain a topic',
                        'Summarize answers',
                        'Help with homework',
                      ].map((suggestion) => (
                        <button
                          key={suggestion}
                          onClick={() => setInput(suggestion)}
                          className="text-[11px] px-2.5 py-1.5 rounded-full bg-purple-500/10 text-purple-500 hover:bg-purple-500/20 transition-colors border border-purple-500/20"
                        >
                          <Sparkles className="w-2.5 h-2.5 inline mr-1" />
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Input Area */}
                <div className="flex-shrink-0 border-t border-border bg-card p-3">
                  <div className="flex items-end gap-2">
                    <Textarea
                      ref={inputRef}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Ask me anything..."
                      className="min-h-[38px] max-h-[100px] resize-none text-sm bg-background border-input focus:border-purple-300 focus:ring-purple-200/20 rounded-xl text-foreground placeholder:text-muted-foreground"
                      rows={1}
                      disabled={isLoading}
                    />
                    <Button
                      onClick={handleSend}
                      disabled={!input.trim() || isLoading}
                      className="h-[38px] w-[38px] p-0 rounded-xl bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 shadow-md shadow-purple-200/40 flex-shrink-0"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-[9px] text-muted-foreground mt-1.5 text-center">
                    AI can make mistakes. Verify important information.
                  </p>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}