"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PageContainer } from "@/components/page-container"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function DarkWebSearchPage() {
  return (
    <PageContainer
      title="Dark & Deep Web Search"
      description="Dark web search functionality"
    >
      <Card>
        <CardHeader>
          <CardTitle>Dark & Deep Web Search Functionality Removed</CardTitle>
          <CardDescription>
            The Dark & Deep Web search functionality has been removed from this application.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="warning" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Functionality Removed</AlertTitle>
            <AlertDescription>
              This feature has been removed as requested.
            </AlertDescription>
          </Alert>
          
          <p className="text-muted-foreground mb-4">
            The Dark & Deep Web search functionality previously allowed searching across dark web sources to find leaked data or information.
            This functionality has been completely removed in accordance with application requirements.
          </p>
          
          <p>
            If you need to search for intelligence data, please consider using one of the other available search tools in the application.
          </p>
        </CardContent>
      </Card>
    </PageContainer>
  )
}
