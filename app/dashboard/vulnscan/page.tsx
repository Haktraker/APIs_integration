"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useSearchParams } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { toast } from "sonner"
import { Loader2, AlertTriangle, Shield, MapPin, Calendar } from "lucide-react"
import { Badge } from "@/components/ui/badge"

// LeakIX Types
interface LeakIXResult {
  event_type: string;
  ip: string;
  host: string;
  port: string;
  summary: string;
  time: string;
  leak: {
    stage: string;
    severity: string;
    dataset: {
      rows: number;
      files: number;
      size: number;
    }
  };
  http?: {
    url: string;
    title: string;
  };
  geoip?: {
    country_name: string;
    city_name: string;
  };
}

const searchSchema = z.object({
  query: z.string().min(1, "Please enter a search term"),
})

type SearchFormData = z.infer<typeof searchSchema>

export default function VulnScanPage() {
  const searchParams = useSearchParams()
  const initialQuery = searchParams.get('q')
  
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<LeakIXResult[]>([])
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SearchFormData>({
    resolver: zodResolver(searchSchema),
    defaultValues: {
      query: initialQuery || '',
    }
  })

  const performSearch = async (searchTerm: string) => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch(
        `/api/leakix?q=${encodeURIComponent(searchTerm)}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Search failed')
      }

      const data = await response.json()
      setResults(data.results)
      
      if (data.results.length === 0) {
        toast.info("No results found")
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Search failed'
      setError(message)
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  const onSubmit = async (data: SearchFormData) => {
    await performSearch(data.query)
  }

  // Perform initial search if query parameter exists
  useState(() => {
    if (initialQuery) {
      performSearch(initialQuery)
    }
  }, [])

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical': return 'bg-red-500'
      case 'high': return 'bg-orange-500'
      case 'medium': return 'bg-yellow-500'
      case 'low': return 'bg-blue-500'
      default: return 'bg-gray-500'
    }
  }

  return (
    <div className="container mx-auto p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-2xl font-bold mb-6">Vulnerability Scan</h1>

        {/* Search Form */}
        <div className="bg-gray-800/30 rounded-lg p-6 mb-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="query">Domain or IP Address</Label>
              <Input
                id="query"
                placeholder="Enter domain or IP to scan"
                {...register("query")}
                className={errors.query ? "border-red-500" : ""}
                disabled={isLoading}
              />
              {errors.query && (
                <p className="text-red-500 text-sm">{errors.query.message}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Scanning...
                </>
              ) : (
                "Scan"
              )}
            </Button>
          </form>
        </div>

        {/* Results Section */}
        {results.length > 0 && (
          <div className="space-y-6">
            <div className="grid gap-6">
              {results.map((result, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-gray-800/30 rounded-lg p-6"
                >
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-semibold">
                      {result.http?.title || result.host}
                    </h3>
                    <Badge className={`${getSeverityColor(result.leak.severity)}`}>
                      {result.leak.severity}
                    </Badge>
                  </div>

                  <div className="grid gap-4">
                    <div className="text-gray-300">
                      {result.summary}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-400">
                      {result.geoip && (
                        <div className="flex items-center">
                          <MapPin className="w-4 h-4 mr-2" />
                          {result.geoip.city_name}, {result.geoip.country_name}
                        </div>
                      )}
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-2" />
                        {new Date(result.time).toLocaleDateString()}
                      </div>
                      <div className="flex items-center">
                        <Shield className="w-4 h-4 mr-2" />
                        {result.leak.stage}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/20 rounded-lg p-4 mt-4 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 mr-2" />
            <span>{error}</span>
          </div>
        )}

        {/* No Results Message */}
        {!isLoading && results.length === 0 && !error && initialQuery && (
          <div className="text-center text-gray-400 mt-8">
            No vulnerabilities found for this search.
          </div>
        )}
      </motion.div>
    </div>
  )
} 