"use client"

import { ReactNode } from "react"
import DashboardLayout from "@/app/dashboard-layout"

interface PageContainerProps {
  children: ReactNode
  title: string
  description?: string
}

export function PageContainer({ children, title, description }: PageContainerProps) {
  return (
    <DashboardLayout>
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold">{title}</h1>
          {description && (
            <p className="text-muted-foreground">
              {description}
            </p>
          )}
        </div>
        {children}
      </div>
    </DashboardLayout>
  )
} 