import { NextRequest, NextResponse } from 'next/server'

// ─── Configuration ────────────────────────────────────────────────
// Uses z-ai-web-dev-sdk by default (no API key needed).
// Optionally configure OpenAI-compatible API for custom models:
//   AI_API_KEY=your-api-key-here
//   AI_BASE_URL=https://api.openai.com/v1  (or https://api.groq.com/openai/v1 for Groq)
//   AI_MODEL=gpt-4o-mini  (or llama-3.1-8b-instant for Groq)
// ───────────────────────────────────────────────────────────────────

const AI_API_KEY = process.env.AI_API_KEY || ''
const AI_BASE_URL = process.env.AI_BASE_URL || 'https://api.openai.com/v1'
const AI_MODEL = process.env.AI_MODEL || 'gpt-4o-mini'
const USE_SDK = !AI_API_KEY // Use z-ai-web-dev-sdk when no API key is configured

// In-memory conversation store with TTL for memory management
type ChatRole = 'system' | 'user' | 'assistant'
interface ChatMessage {
  role: ChatRole
  content: string
}
interface ConversationEntry {
  messages: ChatMessage[]
  lastAccessed: number
}
const conversations = new Map<string, ConversationEntry>()
const MAX_CONVERSATIONS = 500
const CONVERSATION_TTL = 2 * 60 * 60 * 1000 // 2 hours

// Clean up expired conversations periodically
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

// Run cleanup every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupConversations, 5 * 60 * 1000)
}

const SYSTEM_PROMPT = `You are UmairDocs AI Assistant — a friendly, warm, and knowledgeable academic assistant built into the UmairDocs document platform. Your role is to help students with their questions across all subjects.

## Core Identity
- You are an AI-powered academic assistant embedded in a document editor
- You help students learn, understand, and produce better academic work
- You are accurate, reliable, and always cite your reasoning
- You are WARM and FRIENDLY — never robotic or cold

## Greeting Rules (VERY IMPORTANT)
- When a user greets you (hi, hello, hey, good morning, etc.), ALWAYS respond warmly and enthusiastically
- Use friendly language like "Hey there! 👋", "Hello! 😊", "Hi! Great to see you!"
- Add a relevant emoji to greeting responses
- After greeting, briefly mention how you can help them today
- NEVER respond to greetings with just "Hello." or "Hi." — always add warmth and offer help
- Examples of good greeting responses:
  - "Hey there! 👋 So glad you're here! I'm your UmairDocs AI Assistant. How can I help you today? Whether it's studying, homework, or writing — I'm ready! 😊"
  - "Hello! 😊 Welcome back! What would you like to work on today? I can help with any subject! 🎓"
  - "Hi! 👋 Great to chat with you! Feel free to ask me anything — from math problems to essay writing! ✨"

## Response Guidelines
1. **Warm & Friendly**: Always start with a positive, encouraging tone. Use emojis occasionally (not excessively).
2. **Accuracy First**: Always provide factually correct information. If you're unsure, say so rather than guessing.
3. **Clear Structure**: Use Markdown formatting (headers, bullet points, numbered lists, code blocks) to make responses easy to read.
4. **Step-by-Step**: Break down complex topics into sequential, understandable steps.
5. **Examples & Analogies**: Use concrete examples and relatable analogies to illustrate concepts.
6. **Encouraging Tone**: Be supportive and positive. Celebrate good questions and learning progress.
7. **Concise by Default**: Keep answers focused and to the point. Offer to elaborate if the student wants more detail.
8. **Ask for Clarification**: If a question is ambiguous, ask the student to clarify before answering.

## Academic Integrity
- Help students understand concepts and learn, NOT cheat on assignments
- Guide students toward finding answers themselves when appropriate
- When summarizing multiple answers, highlight key takeaways and common themes
- Always explain the reasoning behind answers, not just the final result

## Document Context
When document context is provided, reference the student's work to give relevant, contextual help. You can suggest improvements, explain concepts within their document's topic, or help refine their writing.

## Response Format
- Use \`##\` for section headers, \`-\` for bullet points, \`1.\` for numbered steps
- Wrap code in triple backticks with language identifier
- Use **bold** for emphasis on key terms
- Keep paragraphs short (2-3 sentences max)`

// ─── SDK-based handler (default, no API key needed) ────────────────
async function handleWithSDK(
  messages: ChatMessage[],
  stream: boolean
) {
  // Dynamically import z-ai-web-dev-sdk (server-side only)
  const ZAI = (await import('z-ai-web-dev-sdk')).default
  const zai = await ZAI.create()

  if (!stream) {
    const completion = await zai.chat.completions.create({
      messages,
      thinking: { type: 'disabled' },
    })
    const response = completion.choices?.[0]?.message?.content || ''
    return { type: 'json' as const, response }
  }

  // SDK streaming - we'll collect the response and stream it as SSE
  const completion = await zai.chat.completions.create({
    messages,
    thinking: { type: 'disabled' },
  })
  const fullContent = completion.choices?.[0]?.message?.content || ''

  // Create SSE stream from the full response (SDK doesn't support true streaming,
  // so we send the complete response in chunks for a streaming-like experience)
  const encoder = new TextEncoder()
  const chunkSize = 20 // characters per chunk
  let offset = 0

  const stream$ = new ReadableStream({
    async pull(controller) {
      if (offset >= fullContent.length) {
        controller.enqueue(encoder.encode('data: [DONE]\n\n'))
        controller.close()
        return
      }

      const chunk = fullContent.slice(offset, offset + chunkSize)
      offset += chunkSize

      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: chunk })}\n\n`))

      // Small delay for streaming effect
      await new Promise((r) => setTimeout(r, 30))
    },
  })

  return { type: 'stream' as const, stream: stream$, content: fullContent }
}

// ─── OpenAI-compatible API handler (when API key is configured) ───
async function handleWithOpenAI(
  messages: ChatMessage[],
  stream: boolean
) {
  if (!stream) {
    const response = await fetch(`${AI_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${AI_API_KEY}`,
      },
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
      throw new Error(`AI API error (${response.status}). Check your API key and model name.`)
    }

    const completion = await response.json()
    const aiResponse = completion.choices?.[0]?.message?.content
    if (!aiResponse) throw new Error('No response from AI')
    return { type: 'json' as const, response: aiResponse }
  }

  // Streaming
  const response = await fetch(`${AI_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${AI_API_KEY}`,
    },
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
    throw new Error(`AI API error (${response.status}). Check your API key and model name.`)
  }

  if (!response.body) throw new Error('No response body from AI API')

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
          // Process remaining buffer
          if (sseBuffer.trim()) {
            const remaining = sseBuffer.trim()
            if (remaining.startsWith('data: ')) {
              const data = remaining.slice(6).trim()
              if (data && data !== '[DONE]') {
                try {
                  const parsed = JSON.parse(data)
                  const delta = parsed.choices?.[0]?.delta?.content
                  if (delta) {
                    fullContent += delta
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: delta })}\n\n`))
                  }
                } catch { /* ignore incomplete JSON */ }
              }
            }
          }
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
          } catch {
            // Incomplete JSON — will be completed in next chunk
          }
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

    // Get or create conversation history
    const sessionKey = sessionId || 'default'
    let entry = conversations.get(sessionKey)

    // Build the system message with current document context
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

    // Add user message
    history.push({ role: 'user', content: message })

    // Keep conversation manageable (system prompt + last 20 messages)
    if (history.length > 22) {
      const systemMsg = history[0]
      const recentMessages = history.slice(-21)
      entry.messages = [systemMsg, ...recentMessages]
    }

    const shouldStream = useStream !== false

    // Route to appropriate handler
    let result: Awaited<ReturnType<typeof handleWithSDK> | ReturnType<typeof handleWithOpenAI>>

    if (USE_SDK) {
      result = await handleWithSDK(entry.messages, shouldStream)
    } else {
      result = await handleWithOpenAI(entry.messages, shouldStream)
    }

    if (result.type === 'json') {
      // Non-streaming: return JSON response
      entry.messages.push({ role: 'assistant', content: result.response })
      entry.lastAccessed = Date.now()
      conversations.set(sessionKey, entry)

      return NextResponse.json({
        success: true,
        response: result.response,
        messageCount: entry.messages.length - 1,
      })
    }

    // Streaming: return SSE response
    const entryRef = entry
    const sessionKeyRef = sessionKey
    const capturedContent = result.content

    // For OpenAI streaming, we track fullContent inside the stream handler
    // For SDK streaming, we already have the full content
    let fullStreamedContent = USE_SDK ? capturedContent : ''

    const originalStream = result.stream
    const encoder = new TextEncoder()

    // Get reader ONCE outside the stream to avoid "ReadableStream is locked" errors
    const originalReader = originalStream.getReader()

    const wrappedStream = new ReadableStream({
      async pull(controller) {
        try {
          while (true) {
            const { done, value } = await originalReader.read()
            if (done) {
              // Save the conversation
              const contentToSave = USE_SDK ? capturedContent : fullStreamedContent
              if (contentToSave) {
                entryRef.messages.push({ role: 'assistant', content: contentToSave })
                entryRef.lastAccessed = Date.now()
                conversations.set(sessionKeyRef, entryRef)
              }
              controller.close()
              return
            }

            // Track content for OpenAI streaming
            if (!USE_SDK) {
              const text = new TextDecoder().decode(value)
              const match = text.match(/data: (\{.*\})\n\n/)
              if (match) {
                try {
                  const parsed = JSON.parse(match[1])
                  if (parsed.content) {
                    fullStreamedContent += parsed.content
                  }
                } catch { /* ignore */ }
              }
            }

            controller.enqueue(value)
          }
        } catch (err) {
          console.error('Wrapped stream error:', err)
          controller.close()
        } finally {
          try { originalReader.releaseLock() } catch { /* already released */ }
        }
      },
    })

    return new Response(wrappedStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
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

// ─── Delete conversation ───────────────────────────────────────────
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