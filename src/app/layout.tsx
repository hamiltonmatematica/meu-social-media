import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ContentPlatformCore',
  description: 'Motor Inteligente de Gestão e Criação de Conteúdo Full-Stack',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className="antialiased min-h-screen py-10 px-4">
        {children}
      </body>
    </html>
  )
}
