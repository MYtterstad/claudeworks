export const dynamic = 'force-dynamic'

import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'

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
        const { getUserByEmail, verifyPassword } = await import('@/lib/db')
        const user = getUserByEmail(credentials.email)
        if (!user) throw new Error('User not found')
        const passwordValid = verifyPassword(credentials.password, user.password_hash)
        if (!passwordValid) throw new Error('Invalid password')
        return { id: user.id, email: user.email, name: user.name }
      },
    }),
  ],
  pages: { signIn: '/auth', error: '/auth' },
  callbacks: {
    async jwt({ token, user }) {
      if (user) { token.id = user.id; token.email = user.email; token.name = user.name }
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
  session: { strategy: 'jwt', maxAge: 30 * 24 * 60 * 60 },
  jwt: { maxAge: 30 * 24 * 60 * 60 },
})

export { handler as GET, handler as POST }
