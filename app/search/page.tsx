// app/search/page.tsx
"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

export default function SearchPage() {
  const [query, setQuery] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    // ... do something or route to another page
    toast.success(`You searched for: ${query}`)
    setLoading(false)
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Search</h1>
      <form onSubmit={handleSubmit} className="space-y-2">
        <div>
          <Label htmlFor="query">Query</Label>
          <Input
            id="query"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter IP or domain"
          />
        </div>
        <Button type="submit" disabled={loading}>
          {loading ? "Searching..." : "Search"}
        </Button>
      </form>
    </div>
  )
}
