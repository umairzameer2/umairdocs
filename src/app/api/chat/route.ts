import { NextRequest, NextResponse } from 'next/server'

// ─── Configuration ────────────────────────────────────────────────
// Uses z-ai-web-dev-sdk by default (no API key needed).
// Optionally configure OpenAI-compatible API for custom models:
//   AI_API_KEY=your-api-key-here
//   AI_BASE_URL=https://api.openai.com/v1
//   AI_MODEL=gpt-4o-mini
// ───────────────────────────────────────────────────────────────────

const AI_API_KEY = (process.env.AI_API_KEY || '').trim()
const AI_BASE_URL = (process.env.AI_BASE_URL || 'https://api.openai.com/v1').trim()
const AI_MODEL = (process.env.AI_MODEL || 'gpt-4o-mini').trim()
const USE_SDK = !AI_API_KEY

// In-memory conversation store
interface ConversationEntry {
  messages: Array<{ role: string; content: string }>
  lastAccessed: number
}
const conversations = new Map<string, ConversationEntry>()
const MAX_CONVERSATIONS = 500
const CONVERSATION_TTL = 2 * 60 * 60 * 1000

function cleanupConversations() {
  const now = Date.now()
  for (const [key, entry] of conversations) {
    if (now - entry.lastAccessed > CONVERSATION_TTL) {
      conversations.delete(key)
    }
  }
  if (conversations.size > MAX_CONVERSATIONS) {
    const entries = [...conversations.entries()].sort((a, b) => a[1].lastAccessed - b[1].lastAccessed)
    const toRemove = entries.slice(0, conversations.size - MAX_CONVERSATIONS)
    for (const [key] of toRemove) {
      conversations.delete(key)
    }
  }
}

if (typeof setInterval !== 'undefined') {
  setInterval(cleanupConversations, 5 * 60 * 1000)
}

const SYSTEM_PROMPT = `You are UmairDocs AI Assistant — a friendly, knowledgeable academic assistant built into the UmairDocs document platform. Your role is to help students with their questions across all subjects.

## Core Identity
- You are an AI-powered academic assistant embedded in a document editor
- You help students learn, understand, and produce better academic work
- You are accurate, reliable, and always cite your reasoning

## Response Guidelines
1. **Accuracy First**: Always provide factually correct information. If you're unsure, say so rather than guessing.
2. **Clear Structure**: Use Markdown formatting (headers, bullet points, numbered lists, code blocks) to make responses easy to read.
3. **Step-by-Step**: Break down complex topics into sequential, understandable steps.
4. **Examples & Analogies**: Use concrete examples and relatable analogies to illustrate concepts.
5. **Encouraging Tone**: Be supportive and positive. Celebrate good questions and learning progress.
6. **Concise by Default**: Keep answers focused and to the point. Offer to elaborate if the student wants more detail.
7. **Ask for Clarification**: If a question is ambiguous, ask the student to clarify before answering.

## Academic Integrity
- Help students understand concepts and learn, NOT cheat on assignments
- Guide students toward finding answers themselves when appropriate
- Always explain the reasoning behind answers, not just the final result

## Response Format
- Use \`##\` for section headers, \`-\` for bullet points, \`1.\` for numbered steps
- Wrap code in triple backticks with language identifier
- Use **bold** for emphasis on key terms
- Keep paragraphs short (2-3 sentences max)`

// ─── Cached ZAI instance ──────────────────────────────────────────
let zaiInstance: Awaited<ReturnType<typeof import('z-ai-web-dev-sdk').default>> | null = null
let zaiInitPromise: Promise<typeof zaiInstance> | null = null

async function getZAIInstance() {
  if (zaiInstance) return zaiInstance
  if (zaiInitPromise) return zaiInitPromise

  zaiInitPromise = (async () => {
    try {
      const ZAI = (await import('z-ai-web-dev-sdk')).default
      const instance = await ZAI.create()
      zaiInstance = instance
      return instance
    } catch (err) {
      console.error('Failed to initialize z-ai-web-dev-sdk:', err)
      zaiInitPromise = null
      throw new Error('SDK initialization failed')
    }
  })()

  return zaiInitPromise
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)
    promise.then(
      (val) => { clearTimeout(timer); resolve(val) },
      (err) => { clearTimeout(timer); reject(err) }
    )
  })
}

async function withRetry<T>(fn: () => Promise<T>, maxRetries = 2, baseDelay = 1000): Promise<T> {
  let lastError: unknown = null
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (err) {
      lastError = err
      if (attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt)
        console.warn(`Retry ${attempt + 1}/${maxRetries} after ${delay}ms:`, err instanceof Error ? err.message : err)
        await new Promise((r) => setTimeout(r, delay))
      }
    }
  }
  throw lastError
}

// ─── SDK-based handler ─────────────────────────────────────────────
async function handleWithSDK(
  messages: Array<{ role: string; content: string }>,
  stream: boolean
) {
  const zai = await getZAIInstance()

  const sdkMessages = messages.map(m => ({
    role: (m.role === 'system' ? 'assistant' : m.role) as 'assistant' | 'user',
    content: m.content,
  }))

  async function createCompletion() {
    return withRetry(
      () => withTimeout(
        zai.chat.completions.create({
          messages: sdkMessages,
          thinking: { type: 'disabled' },
        }),
        45_000,
        'SDK chat completion'
      ),
      2,
      1000
    )
  }

  const completion = await createCompletion()
  const fullContent = completion.choices?.[0]?.message?.content || ''

  if (!stream) {
    return { type: 'json' as const, response: fullContent }
  }

  const encoder = new TextEncoder()
  const FIRST_CHUNK_SIZE = 80
  const CHUNK_SIZE = 20
  let offset = 0
  let isFirstChunk = true

  const stream$ = new ReadableStream({
    async pull(controller) {
      if (offset >= fullContent.length) {
        controller.enqueue(encoder.encode('data: [DONE]\n\n'))
        controller.close()
        return
      }
      const size = isFirstChunk ? FIRST_CHUNK_SIZE : CHUNK_SIZE
      isFirstChunk = false
      const chunk = fullContent.slice(offset, offset + size)
      offset += size
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: chunk })}\n\n`))
      await new Promise((r) => setTimeout(r, 25))
    },
  })

  return { type: 'stream' as const, stream: stream$, content: fullContent }
}

// ─── OpenAI-compatible API handler ────────────────────────────────
async function handleWithOpenAI(
  messages: Array<{ role: string; content: string }>,
  stream: boolean
) {
  // Ensure API key has no invalid characters
  const cleanKey = AI_API_KEY.replace(/[\r\n"']/g, '')

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${cleanKey}`,
  }

  if (!stream) {
    const response = await fetch(`${AI_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: AI_MODEL,
        messages,
        temperature: 0.7,
        max_tokens: 2048,
      }),
    })

    if (!response.ok) {
      const errText = await response.text().catch(() => 'Unknown error')
      console.error('AI API error:', response.status, errText)
      throw new Error(`AI API error (${response.status})`)
    }

    const completion = await response.json()
    const aiResponse = completion.choices?.[0]?.message?.content
    if (!aiResponse) throw new Error('No response from AI')
    return { type: 'json' as const, response: aiResponse }
  }

  // Streaming
  const response = await fetch(`${AI_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: AI_MODEL,
      messages,
      stream: true,
      temperature: 0.7,
      max_tokens: 2048,
    }),
  })

  if (!response.ok) {
    const errText = await response.text().catch(() => 'Unknown error')
    console.error('AI API error:', response.status, errText)
    throw new Error(`AI API error (${response.status})`)
  }

  if (!response.body) throw new Error('No response body')

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  const encoder = new TextEncoder()
  let fullContent = ''
  let sseBuffer = ''

  const stream$ = new ReadableStream({
    async pull(controller) {
      try {
        const { done, value } = await reader.read()
        if (done) {
          controller.enqueue(encoder.encode('data: [DONE]\n\n'))
          controller.close()
          return
        }

        sseBuffer += decoder.decode(value, { stream: true })
        const lines = sseBuffer.split('\n')
        sseBuffer = lines.pop() || ''

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed || !trimmed.startsWith('data: ')) continue
          const data = trimmed.slice(6).trim()
          if (!data || data === '[DONE]') continue

          try {
            const parsed = JSON.parse(data)
            const delta = parsed.choices?.[0]?.delta?.content
            if (delta) {
              fullContent += delta
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: delta })}\n\n`))
            }
          } catch { /* ignore */ }
        }
      } catch (err) {
        console.error('Stream read error:', err)
        try { controller.close() } catch { /* already closed */ }
      }
    },
    cancel() {
      reader.cancel()
    },
  })

  return { type: 'stream' as const, stream: stream$, content: fullContent }
}

// ─── Main POST handler ─────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const { sessionId, message, documentContext, stream: useStream } = await request.json()

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    if (message.length > 4000) {
      return NextResponse.json({ error: 'Message too long (max 4000 characters)' }, { status: 400 })
    }

    const sessionKey = sessionId || 'default'
    let entry = conversations.get(sessionKey)

    const systemContent = documentContext
      ? `${SYSTEM_PROMPT}\n\n## Current Document Context\nThe student is currently working on the following document. Use this to provide contextual help:\n\n${documentContext}`
      : SYSTEM_PROMPT

    if (!entry) {
      entry = {
        messages: [{ role: 'system', content: systemContent }],
        lastAccessed: Date.now(),
      }
    } else {
      entry.messages[0] = { role: 'system', content: systemContent }
      entry.lastAccessed = Date.now()
    }

    const history = entry.messages
    history.push({ role: 'user', content: message })

    if (history.length > 22) {
      const systemMsg = history[0]
      const recentMessages = history.slice(-21)
      entry.messages = [systemMsg, ...recentMessages]
    }

    const shouldStream = useStream !== false

    let result: Awaited<ReturnType<typeof handleWithSDK> | ReturnType<typeof handleWithOpenAI>>

    if (USE_SDK) {
      result = await handleWithSDK(entry.messages, shouldStream)
    } else {
      result = await handleWithOpenAI(entry.messages, shouldStream)
    }

    if (result.type === 'json') {
      entry.messages.push({ role: 'assistant', content: result.response })
      entry.lastAccessed = Date.now()
      conversations.set(sessionKey, entry)

      return NextResponse.json({
        success: true,
        response: result.response,
        messageCount: entry.messages.length - 1,
      })
    }

    // Streaming response
    const entryRef = entry
    const sessionKeyRef = sessionKey
    const capturedContent = result.content
    let fullStreamedContent = USE_SDK ? capturedContent : ''

    const originalStream = result.stream
    const originalReader = originalStream.getReader()

    const wrappedStream = new ReadableStream({
      async pull(controller) {
        try {
          const { done, value } = await originalReader.read()
          if (done) {
            const contentToSave = USE_SDK ? capturedContent : fullStreamedContent
            if (contentToSave) {
              entryRef.messages.push({ role: 'assistant', content: contentToSave })
              entryRef.lastAccessed = Date.now()
              conversations.set(sessionKeyRef, entryRef)
            }
            controller.close()
            return
          }

          if (!USE_SDK) {
            const text = new TextDecoder().decode(value)
            const lines = text.split('\n')
            for (const line of lines) {
              const trimmed = line.trim()
              if (!trimmed.startsWith('data: ')) continue
              const data = trimmed.slice(6).trim()
              if (!data || data === '[DONE]') continue
              try {
                const parsed = JSON.parse(data)
                if (parsed.content) {
                  fullStreamedContent += parsed.content
                }
              } catch { /* ignore */ }
            }
          }

          controller.enqueue(value)
        } catch (err) {
          console.error('Wrapped stream error:', err)
          const contentToSave = USE_SDK ? capturedContent : fullStreamedContent
          if (contentToSave) {
            entryRef.messages.push({ role: 'assistant', content: contentToSave })
            entryRef.lastAccessed = Date.now()
            conversations.set(sessionKeyRef, entryRef)
          }
          try { controller.close() } catch { /* already closed */ }
        }
      },
      cancel() {
        try { originalReader.cancel() } catch { /* ignore */ }
      },
    })

    return new Response(wrappedStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
      },
    })
  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { error: 'Failed to get AI response. Please try again.' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { sessionId } = await request.json()
    if (sessionId) {
      conversations.delete(sessionId)
    }
    return NextResponse.json({ success: true, message: 'Conversation cleared' })
  } catch {
    return NextResponse.json({ error: 'Failed to clear conversation' }, { status: 500 })
  }
}