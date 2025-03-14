"use client"

import { useState, useEffect, Suspense } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useSearchParams } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { toast } from "sonner"
import { Loader2, AlertTriangle, MapPin, Calendar, Building2, FileText } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { getFormattedLeakIXResults } from "@/lib/api/services/leakix"
import DashboardLayout from "../dashboard-layout"

const searchSchema = z.object({
  query: z.string().min(1, "Please enter a search term"),
})

type SearchFormData = z.infer<typeof searchSchema>

type FormattedResult = {
  title: string;
  eventSummaries?: string[];
  date: string;
  severity: string;
  location?: string;
  ip?: string;
  port?: string;
  software?: {
    name: string;
    version: string;
  };
  ssl?: {
    version: string;
    validUntil: string;
    issuer: string;
  };
  organization?: string;
}

// Create a separate component for the search functionality
function VulnScanContent() {
  const searchParams = useSearchParams()
  const initialQuery = searchParams.get('q')
  
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<FormattedResult[]>([])
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
      console.log('Searching for:', searchTerm);
      const response = await getFormattedLeakIXResults(searchTerm)
      console.log('Search response:', response);

      if (response.error) {
        setError(response.error)
        toast.error(response.error)
        return
      }

      if (response.formattedResults.length === 0) {
        toast.info("No vulnerabilities found")
      }

      setResults(response.formattedResults)
      console.log('Setting results:', response.formattedResults);
      
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Search failed'
      setError(message)
      toast.error(message)
      console.error('Search error:', error);
    } finally {
      setIsLoading(false)
    }
  }

  const onSubmit = async (data: SearchFormData) => {
    await performSearch(data.query)
  }

  // Perform initial search if query parameter exists
  useEffect(() => {
    if (initialQuery) {
      console.log('Initial query:', initialQuery);
      performSearch(initialQuery)
    }
  }, [initialQuery])

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical': return 'bg-red-500'
      case 'high': return 'bg-orange-500'
      case 'medium': return 'bg-yellow-500'
      case 'low': return 'bg-blue-500'
      case 'info': return 'bg-blue-400'
      default: return 'bg-gray-500'
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
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
      {results && results.length > 0 && (
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
                  <div>
                    <h3 className="text-lg font-semibold">
                      {result.title}
                    </h3>
                    {result.ip && result.port && (
                      <p className="text-sm text-gray-400">
                        {result.ip}:{result.port}
                      </p>
                    )}
                  </div>
                  <Badge className={`${getSeverityColor(result.severity)}`}>
                    {result.severity}
                  </Badge>
                </div>

                <div className="grid gap-4">
                  {/* Event Summaries Section */}
                  {result.eventSummaries && result.eventSummaries.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center text-sm font-medium text-gray-300">
                        <FileText className="w-4 h-4 mr-2" />
                        Event Summaries
                      </div>
                      <div className="pl-6 space-y-2">
                        {result.eventSummaries.map((summary, idx) => (
                          <div key={idx} className="text-sm text-gray-300 p-2 bg-gray-800/50 rounded-md">
                            {summary}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {result.software && (
                    <div className="text-sm text-gray-400">
                      Software: {result.software.name} {result.software.version}
                    </div>
                  )}

                  {result.ssl && (
                    <div className="text-sm text-gray-400">
                      SSL: {result.ssl.version} (Valid until {result.ssl.validUntil})
                      <br />
                      Issuer: {result.ssl.issuer}
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-400">
                    {result.location && (
                      <div className="flex items-center">
                        <MapPin className="w-4 h-4 mr-2" />
                        {result.location}
                      </div>
                    )}
                    {result.organization && (
                      <div className="flex items-center">
                        <Building2 className="w-4 h-4 mr-2" />
                        {result.organization}
                      </div>
                    )}
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-2" />
                      {result.date}
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
      {!isLoading && (!results || results.length === 0) && !error && initialQuery && (
        <div className="text-center text-gray-400 mt-8">
          No vulnerabilities found for this search.
        </div>
      )}
    </motion.div>
  )
}

// Loading fallback component
function LoadingFallback() {
  return (
    <div className="container mx-auto p-6 flex items-center justify-center">
      <Loader2 className="w-6 h-6 animate-spin" />
    </div>
  )
}

// Main page component
export default function VulnScanPage() {
  return (
    <DashboardLayout>
      <div className="container mx-auto p-6">
        <Suspense fallback={<LoadingFallback />}>
          <VulnScanContent />
        </Suspense>
      </div>
    </DashboardLayout>
  )
} 