import type React from "react"
import "./globals.css"
import { Inter } from "next/font/google"
import "./i18n"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "CryptoArb Pro - Advanced Cryptocurrency Arbitrage Bot",
  description:
    "A production-ready cryptocurrency arbitrage bot with machine learning, advanced risk management, and a professional UI/UX design.",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>{children}</body>
    </html>
  )
}
