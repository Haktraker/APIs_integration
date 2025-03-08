"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import DashboardLayout from "../dashboard-layout"

export default function IntelXPage() {
  return (
    <DashboardLayout>
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold">IntelX Search</h1>
          <p className="text-muted-foreground">
            Search for intelligence data from various sources
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>IntelX Search</CardTitle>
            <CardDescription>
              This is a placeholder for the IntelX search page.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>
              The IntelX search page will allow you to:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Search for intelligence data</li>
              <li>Find information from various sources</li>
              <li>Discover leaked data</li>
              <li>Analyze intelligence reports</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
} 