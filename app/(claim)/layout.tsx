import type React from "react"
import { Inter } from "next/font/google"
import { Toaster } from "@/components/ui/toaster"
import './globals.css'

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  generator: 'x.dropx'
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
          {children}
          <Toaster />
      </body>
    </html>
  )
}


