import { Geist, Geist_Mono } from "next/font/google"

import "./globals.css"
import { AuthHeader } from "@/components/auth-header"
import { cn } from "@/lib/utils"
import { Providers } from "@/providers"

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" })

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "antialiased",
        fontMono.variable,
        "font-sans",
        geist.variable
      )}
    >
      <body>
        <Providers>
          <AuthHeader />
          {children}
        </Providers>
      </body>
    </html>
  )
}
