'use client'

import { ReactNode } from 'react'
import { Web3AuthProvider } from '@/context/web3auth-context'
import { Toaster } from '@/components/ui/toaster'
import LayoutCustom from '@/components/layout-custom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

interface ClientLayoutProps {
  children: ReactNode
}

const queryClient = new QueryClient()

export default function Providers({ children }: ClientLayoutProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <Web3AuthProvider>
          <LayoutCustom>
            {children}
          </LayoutCustom>
          <Toaster />
      </Web3AuthProvider>
    </QueryClientProvider>
  )
} 