import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '真需求脑暴室',
  description: '帮你用AI一步步挖出产品真卖点，告别自卖自夸',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  )
}
