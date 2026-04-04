import './globals.css'
import AuthProvider from '@/app/_components/AuthProvider'

export const metadata = {
  title: 'Claudeworks!',
  description: 'Explore algorithms, systems, and science through interactive simulations. Each app includes the full prompt walkthrough and source code.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}
