"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import DashboardLayout from "../dashboard-layout"

export default function ShodanPage() {
  return (
    <DashboardLayout>
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold">Shodan Search</h1>
          <p className="text-muted-foreground">
            Search for internet-connected devices and services
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Shodan Search</CardTitle>
            <CardDescription>
              This is a placeholder for the Shodan search page.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>
              The Shodan search page will allow you to:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Search for internet-connected devices</li>
              <li>Find vulnerable services</li>
              <li>Discover exposed infrastructure</li>
              <li>Analyze network security</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
} 