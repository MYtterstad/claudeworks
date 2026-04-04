import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'

// NOTE: We use dynamic import() for @/lib/db inside authorize() to avoid
// pulling better-sqlite3 into the webpack bundle at build time.
// The static import was causing Vercel builds to fail during "Collecting page data".

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Invalid credentials')
        }

        // Dynamic import — only loads lib/db (and better-sqlite3) at request time
        const { getUserByEmail, verifyPassword } = await import('@/lib/db')

        const user = getUserByEmail(credentials.email)

        if (!user) {
          throw new Error('User not found')
        }

        const passwordValid = verifyPassword(credentials.password, user.password_hash)

        if (!passwordValid) {
          throw new Error('Invalid password')
        }

        // Return user object (without password_hash)
        return {
          id: user.id,
          email: user.email,
          name: user.name,
        }
      },
    }),
  ],
  pages: {
    signIn: '/auth',
    error: '/auth',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.email = user.email
        token.name = user.name
      }
      return token
    },
    async session({ session, token }) {
      session.user.id = token.id
      session.user.email = token.email
      session.user.name = token.name
      return session
    },
  },
  secret: process.env.NEXTAUTH_SECRET || 'dev-secret-change-in-production',
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
})

export { handler as GET, handler as POST }
