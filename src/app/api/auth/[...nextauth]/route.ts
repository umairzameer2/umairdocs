import NextAuth, { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import { db } from '@/lib/db'
import { hashPassword } from '@/lib/auth'

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
    async jwt({ token, user, account }) {
      // First time sign in - add user ID from our database
      if (user?.email) {
        try {
          const dbUser = await db.user.findUnique({
            where: { email: user.email },
          })
          if (dbUser) {
            token.dbUserId = dbUser.id
            token.dbUserName = dbUser.name
            token.dbUserAvatar = dbUser.avatar
          }
        } catch {
          // silently fail
        }
      }
      return token
    },
    async session({ session, token }) {
      // Add our database user info to the session
      if (session.user && token.dbUserId) {
        session.user.id = token.dbUserId as string
        session.user.name = (token.dbUserName as string) || session.user.name || null
        session.user.image = (token.dbUserAvatar as string) || session.user.image || null
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
  debug: false,
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
