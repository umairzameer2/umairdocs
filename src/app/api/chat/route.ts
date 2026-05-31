import { NextRequest, NextResponse } from 'next/server'

const AI_API_KEY = (process.env.AI_API_KEY || '').trim()
const AI_BASE_URL = (process.env.AI_BASE_URL || 'https://api.groq.com/openai/v1').trim()
const AI_MODEL = (process.env.AI_MODEL || 'llama-3.1-8b-instant').trim()

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

export async function POST(request: NextRequest) {
  try {
    if (!AI_API_KEY) {
      return NextResponse.json(
        { error: 'AI is not configured. Please set AI_API_KEY environment variable.' },
        { status: 500 }
      )
    }

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

    if (!shouldStream) {
      const result = await withRetry(async () => {
        const response = await fetch(`${AI_BASE_URL}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${AI_API_KEY}`,
          },
          body: JSON.stringify({
            model: AI_MODEL,
            messages: history,
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
        return completion.choices?.[0]?.message?.content || ''
      })

      entry.messages.push({ role: 'assistant', content: result })
      entry.lastAccessed = Date.now()
      conversations.set(sessionKey, entry)

      return NextResponse.json({
        success: true,
        response: result,
        messageCount: entry.messages.length - 1,
      })
    }

    // Streaming
    const response = await fetch(`${AI_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AI_API_KEY}`,
      },
      body: JSON.stringify({
        model: AI_MODEL,
        messages: history,
        stream: true,
        temperature: 0.7,
        max_tokens: 2048,
      }),
    })

    if (!response.ok) {
      const errText = await response.text().catch(() => 'Unknown error')
      console.error('AI API error:', response.status, errText)
      return NextResponse.json(
        { error: `AI API error (${response.status})` },
        { status: 500 }
      )
    }

    if (!response.body) {
      return NextResponse.json({ error: 'No response body from AI' }, { status: 500 })
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    const encoder = new TextEncoder()
    let fullContent = ''
    let sseBuffer = ''
    const entryRef = entry
    const sessionKeyRef = sessionKey

    const stream$ = new ReadableStream({
      async pull(controller) {
        try {
          const { done, value } = await reader.read()
          if (done) {
            if (fullContent) {
              entryRef.messages.push({ role: 'assistant', content: fullContent })
              entryRef.lastAccessed = Date.now()
              conversations.set(sessionKeyRef, entryRef)
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
            } catch { /* ignore incomplete JSON */ }
          }
        } catch (err) {
          console.error('Stream read error:', err)
          if (fullContent) {
            entryRef.messages.push({ role: 'assistant', content: fullContent })
            entryRef.lastAccessed = Date.now()
            conversations.set(sessionKeyRef, entryRef)
          }
          try { controller.close() } catch { /* already closed */ }
        }
      },
      cancel() {
        reader.cancel()
      },
    })

    return new Response(stream$, {
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