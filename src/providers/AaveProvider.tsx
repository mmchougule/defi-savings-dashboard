'use client'

import { AaveProvider } from "@aave/react"
import { aaveClient } from "../lib/aaveClient"

interface AaveProviderWrapperProps {
  children: React.ReactNode
}

export function AaveProviderWrapper({ children }: AaveProviderWrapperProps) {
  return (
    <AaveProvider client={aaveClient}>
      {children}
    </AaveProvider>
  )
}
