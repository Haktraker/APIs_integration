"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Search, Shield, Database, Globe, Layers } from "lucide-react"
import Link from "next/link"
import DashboardLayout from "./dashboard-layout"

// export const metadata: Metadata = {
//   title: "Login",
//   description: "Sign in to HakTrak Networks - Your AI-powered Cyber Intelligence Platform",
// }

export default function HomePage() {
  return (
    <DashboardLayout>

      <div className="container mx-auto py-6 space-y-6">
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold">Welcome to HakTrak Networks</h1>
          <p className="text-muted-foreground">
            Your AI-powered eXtended Cyber Intelligence Platform
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Search</CardTitle>
              <Search className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Comprehensive Search</div>
              <p className="text-xs text-muted-foreground">
                Search across multiple intelligence sources
              </p>
              <Button asChild className="w-full mt-4">
                <Link href="/search">Start Search</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Dark & Deep Web</CardTitle>
              <Layers className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Dark Web Intelligence</div>
              <p className="text-xs text-muted-foreground">
                Search dark web, deep web, and data leaks
              </p>
              <Button asChild className="w-full mt-4">
                <Link href="/darkweb">Dark Web Search</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Shodan</CardTitle>
              <Globe className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Network Exposure</div>
              <p className="text-xs text-muted-foreground">
                Discover exposed devices and services
              </p>
              <Button asChild className="w-full mt-4">
                <Link href="/shodan">Shodan Search</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">IntelX</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Intelligence Exchange</div>
              <p className="text-xs text-muted-foreground">
                Access intelligence exchange data
              </p>
              <Button asChild className="w-full mt-4">
                <Link href="/intelx">IntelX Search</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>

  )
}

