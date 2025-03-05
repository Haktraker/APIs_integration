// app/intelx/page.tsx
"use client"

import React, { useEffect, useState } from "react"
import { intelxSearch, intelxSearchResultWithFiles } from "@/lib/api"
import { IntelXSearchStatisticResponse, IntelXSearchResultWithFiles } from "../../types"

export default function IntelXPage() {
  const [stats, setStats] = useState<IntelXSearchStatisticResponse | null>(null)
  const [files, setFiles] = useState<IntelXSearchResultWithFiles | null>(null)

  useEffect(() => {
    const term = "example.com" // or retrieve from a global store
    intelxSearch(term).then((res) => {
      setStats(res.statistics)
      if (res.id) {
        intelxSearchResultWithFiles(res.id).then(setFiles)
      }
    })
  }, [])

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">IntelX Results</h1>
      {stats && (
        <div>
          <h2 className="text-lg font-semibold mb-2">Statistics</h2>
          {/* Render your PieCharts, LineCharts, etc. */}
        </div>
      )}
      {files && (
        <div>
          <h2 className="text-lg font-semibold mb-2">File Results</h2>
          {/* Render your table of text-based files */}
        </div>
      )}
    </div>
  )
}
