import NextAuth from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      name: string | null
      email: string
      image: string | null
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    dbUserId?: string
    dbUserName?: string
    dbUserAvatar?: string
  }
}
