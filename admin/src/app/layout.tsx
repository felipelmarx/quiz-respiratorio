import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'iBreathwork - Painel de Administração',
  description: 'Plataforma de gestão do quiz respiratório iBreathwork',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  )
}
