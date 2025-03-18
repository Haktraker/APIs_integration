"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PageContainer } from "@/components/page-container"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function IntelXPage() {
  return (
    <PageContainer
      title="IntelX Search"
      description="Intelligence data functionality"
    >
      <Card>
        <CardHeader>
          <CardTitle>IntelX Functionality Disabled</CardTitle>
          <CardDescription>
            The IntelX functionality has been removed from this application.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="warning" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Functionality Removed</AlertTitle>
            <AlertDescription>
              This feature has been disabled as requested.
            </AlertDescription>
          </Alert>
          
          <p className="text-muted-foreground mb-4">
            The IntelX search functionality previously allowed searching across intelligence sources to find leaked data or information.
            This functionality has been removed in accordance with application requirements.
          </p>
          
          <p>
            If you need to search for intelligence data, please consider using one of the other available search tools in the application.
          </p>
        </CardContent>
      </Card>
    </PageContainer>
  )
} 