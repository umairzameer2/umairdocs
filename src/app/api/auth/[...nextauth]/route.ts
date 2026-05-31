import NextAuth, { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import { db } from '@/lib/db'
import { hashPassword } from '@/lib/auth'
import { sendEmail, welcomeEmailTemplate } from '@/lib/email'

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET || 'umairdocs-secret-key-change-in-production',
  pages: {
    signIn: '/', // Redirect back to our custom sign-in page
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === 'google' && user.email) {
        try {
          // Check if user exists in our database
          let existingUser = await db.user.findUnique({
            where: { email: user.email },
          })

          if (!existingUser) {
            // Create new user with a random password (they authenticate via Google)
            const randomPassword = crypto.randomUUID()
            const hashedPassword = await hashPassword(randomPassword)

            existingUser = await db.user.create({
              data: {
                email: user.email,
                name: user.name || user.email.split('@')[0],
                avatar: user.image || null,
                password: hashedPassword,
                emails: {
                  create: {
                    email: user.email,
                    isPrimary: true,
                    verified: true,
                  },
                },
              },
            })

            // Send welcome email to new Google OAuth users (non-blocking)
            const { html, text } = welcomeEmailTemplate({
              name: existingUser.name || '',
              email: existingUser.email,
            })
            sendEmail({ to: existingUser.email, subject: 'Welcome to UmairDocs! 🎉', html, text }).catch((err) => {
              console.error('Failed to send welcome email:', err)
            })
          } else if (user.image && !existingUser.avatar) {
            // Update avatar if user doesn't have one
            await db.user.update({
              where: { id: existingUser.id },
              data: { avatar: user.image },
            })
          }

          return true
        } catch (error) {
          console.error('Google sign-in error:', error)
          return false
        }
      }
      return true
    },
    async jwt({ token, user, trigger }) {
      // ─── PERMANENT FIX FOR HTTP 431 ──────────────────────────────
      // NextAuth auto-injects Google profile data (name, email, picture)
      // into the JWT. The "picture" URL from Google is the LARGEST field
      // (100-200 chars). When encrypted into a JWE cookie, large tokens
      // can push past the ~4KB cookie limit on Vercel → HTTP 431.
      //
      // Strategy: Keep email (small, needed by NextAuth internals).
      // Strip picture (large, fetched from DB in session callback).
      // Store our own uid for DB lookups.

      // On first sign-in, look up the user and store the ID
      if (user?.email) {
        try {
          const dbUser = await db.user.findUnique({
            where: { email: user.email },
          })
          if (dbUser) {
            token.uid = dbUser.id
          }
        } catch {
          // silently fail
        }
      }

      // On session update (e.g., after profile change), refresh the ID
      if (trigger === 'update' && token.uid) {
        // uid is already set, no need to re-lookup by email
      }

      // ─── STRIP the large "picture" field from the token ───────────
      // This is the main fix. The Google picture URL is 100-200 chars
      // and is the biggest contributor to cookie bloat.
      // We fetch the avatar from DB in the session callback instead.
      // IMPORTANT: Do NOT delete token.email — NextAuth v4 uses it
      // internally for session management and account linking.
      delete token.picture

      return token
    },
    async session({ session, token }) {
      // ─── Fetch fresh user data from DB on every session read ────
      // This keeps the JWT small and avoids 431 errors.
      // The session callback is called on every useSession() / getSession().
      if (session.user && token.uid) {
        session.user.id = token.uid as string

        try {
          const dbUser = await db.user.findUnique({
            where: { id: token.uid as string },
            select: { name: true, avatar: true, email: true },
          })
          if (dbUser) {
            session.user.name = dbUser.name as string | null
            session.user.image = dbUser.avatar as string | null
            if (dbUser.email) {
              session.user.email = dbUser.email
            }
          }
        } catch {
          // If DB lookup fails, still return basic session
        }
      }
      return session
    },
    async redirect({ url, baseUrl }) {
      // Redirect to our app's root after sign-in
      if (url.startsWith('/')) return `${baseUrl}${url}`
      if (new URL(url).origin === baseUrl) return url
      return `${baseUrl}?google_auth=success`
    },
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  // ─── Cookie settings to prevent 431 errors ──────────────────────
  // Use STANDARD cookie names (no __Host- prefix).
  // The __Host- prefix can cause DUPLICATE cookies because:
  //   - Old sessions had "next-auth.session-token" (without prefix)
  //   - New sessions have "__Host-next-auth.session-token" (with prefix)
  //   - Both cookies get sent → double the cookie size → HTTP 431
  // Standard names ensure no duplicates and smaller total cookie size.
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
    callbackUrl: {
      name: `next-auth.callback-url`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
    csrfToken: {
      name: `next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
  debug: false,
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }