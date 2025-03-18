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
import { Loader2, AlertTriangle, MapPin, Calendar, Building2, FileText, ShieldAlert, HelpCircle, AlertCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { getFormattedLeakIXResults } from "@/lib/api/services/leakix"
import { runNiktoScan, NiktoScanResult, NiktoVulnerability } from "@/lib/api/services/nikto"
import { PageContainer } from "@/components/page-container"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Progress } from "@/components/ui/progress"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

const searchSchema = z.object({
  query: z.string().min(1, "Please enter a search term"),
  scanType: z.enum(["leakix", "nikto", "both"]).default("both"),
  port: z.string().optional(),
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
  const [leakixResults, setLeakixResults] = useState<FormattedResult[]>([])
  const [niktoResults, setNiktoResults] = useState<NiktoScanResult | null>(null)
  const [activeTab, setActiveTab] = useState("leakix")
  const [error, setError] = useState<string | null>(null)
  const [scanProgress, setScanProgress] = useState(0)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SearchFormData>({
    resolver: zodResolver(searchSchema),
    defaultValues: {
      query: initialQuery || '',
      scanType: "both",
      port: "80",
    }
  })

  const selectedScanType = watch("scanType")

  const performLeakIXSearch = async (searchTerm: string) => {
    try {
      const response = await getFormattedLeakIXResults(searchTerm)

      if (response.error) {
        toast.error(`LeakIX: ${response.error}`)
        return
      }

      if (response.formattedResults.length === 0) {
        toast.info("LeakIX: No vulnerabilities found")
      }

      setLeakixResults(response.formattedResults)
      return true
    } catch (error) {
      const message = error instanceof Error ? error.message : 'LeakIX search failed'
      toast.error(message)
      console.error('LeakIX error:', error);
      return false
    }
  }

  const performNiktoScan = async (target: string, port: string) => {
    try {
      const portNumber = parseInt(port, 10) || 80
      const response = await runNiktoScan(target, portNumber)

      if (!response.success) {
        toast.error(`Nikto: ${response.error}`)
        return false
      }

      if (response.scanResult) {
        setNiktoResults(response.scanResult)
        return true
      }

      return false
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Nikto scan failed'
      toast.error(message)
      console.error('Nikto error:', error);
      return false
    }
  }

  const onSubmit = async (data: SearchFormData) => {
    setIsLoading(true)
    setError(null)
    setLeakixResults([])
    setNiktoResults(null)
    setScanProgress(0)
    
    try {
      if (data.scanType === "leakix" || data.scanType === "both") {
        setScanProgress(10)
        await performLeakIXSearch(data.query)
        setScanProgress(data.scanType === "both" ? 50 : 100)
      }
      
      if (data.scanType === "nikto" || data.scanType === "both") {
        setScanProgress(data.scanType === "both" ? 50 : 30)
        toast.info("Starting Nikto scan. This may take several minutes...")
        
        setScanProgress(data.scanType === "both" ? 60 : 40)
        const niktoSuccess = await performNiktoScan(data.query, data.port || "80")
        
        setScanProgress(100)
        
        if (niktoSuccess && data.scanType === "both") {
          setActiveTab("nikto")
        }
      }
      
      toast.success("Vulnerability scan completed")
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Scan failed'
      setError(message)
      toast.error(message)
    } finally {
      setIsLoading(false)
      setScanProgress(100)
    }
  }

  // Perform initial search if query parameter exists
  useEffect(() => {
    if (initialQuery) {
      performLeakIXSearch(initialQuery)
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

  const renderLeakIXResults = () => {
    if (leakixResults.length === 0) {
      return (
        <div className="text-center text-gray-400 mt-8">
          No LeakIX vulnerabilities found for this search.
        </div>
      )
    }

    return (
      <div className="space-y-6">
        <div className="grid gap-6">
          {leakixResults.map((result, index) => (
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
    )
  }

  const renderNiktoResults = () => {
    if (!niktoResults) {
      return (
        <div className="text-center text-gray-400 mt-8">
          No Nikto scan results available. Run a scan to see results.
        </div>
      )
    }

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Nikto Scan Summary</CardTitle>
            <CardDescription>
              Target: {niktoResults.target}:{niktoResults.targetPort} • 
              Scan date: {new Date(niktoResults.scanDate).toLocaleString()} • 
              Duration: {niktoResults.scanDuration}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span>Target server: {niktoResults.targetServer || "Unknown"}</span>
                <Badge variant="outline">
                  {niktoResults.totalVulnerabilities} {niktoResults.totalVulnerabilities === 1 ? 'issue' : 'issues'} found
                </Badge>
              </div>
              
              {niktoResults.publicUrl && (
                <div>
                  <p className="text-sm text-muted-foreground">
                    View full results: <a href={niktoResults.publicUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">{niktoResults.publicUrl}</a>
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4">
          {niktoResults.vulnerabilities.map((vuln, index) => (
            <Collapsible key={index} className="border border-gray-800 rounded-lg overflow-hidden">
              <CollapsibleTrigger className="w-full flex justify-between items-center p-4 hover:bg-gray-800/30 transition-colors">
                <div className="flex items-center">
                  <Badge className={`mr-3 ${getSeverityColor(vuln.severity)}`}>
                    {vuln.severity}
                  </Badge>
                  <span className="font-medium">{vuln.title}</span>
                </div>
                <div className="text-sm text-gray-400">ID: {vuln.id}</div>
              </CollapsibleTrigger>
              <CollapsibleContent className="p-4 border-t border-gray-800 bg-gray-900/30">
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium mb-1 text-gray-300">Description</h4>
                    <p className="text-sm text-gray-400">{vuln.description}</p>
                  </div>
                  
                  {vuln.details && (
                    <div>
                      <h4 className="text-sm font-medium mb-1 text-gray-300">Details</h4>
                      <p className="text-sm text-gray-400">{vuln.details}</p>
                    </div>
                  )}
                  
                  {vuln.recommendation && (
                    <div>
                      <h4 className="text-sm font-medium mb-1 text-gray-300">Recommendation</h4>
                      <p className="text-sm text-gray-400">{vuln.recommendation}</p>
                    </div>
                  )}
                  
                  {vuln.cve && vuln.cve.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-1 text-gray-300">CVE References</h4>
                      <div className="flex flex-wrap gap-2">
                        {vuln.cve.map((cve, idx) => (
                          <Badge key={idx} variant="outline" className="bg-gray-800/50">
                            {cve}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>
          ))}
        </div>

        {niktoResults.rawResult && (
          <Collapsible className="border border-gray-800 rounded-lg overflow-hidden">
            <CollapsibleTrigger className="w-full flex justify-between items-center p-4 hover:bg-gray-800/30 transition-colors">
              <div className="flex items-center">
                <span className="font-medium">Raw Scan Results</span>
              </div>
              <AlertCircle className="h-4 w-4" />
            </CollapsibleTrigger>
            <CollapsibleContent className="p-4 border-t border-gray-800 bg-gray-900/30">
              <pre className="text-xs text-gray-400 overflow-auto max-h-96 p-4 bg-gray-950/50 rounded">
                {niktoResults.rawResult}
              </pre>
            </CollapsibleContent>
          </Collapsible>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Vulnerability Scanner</CardTitle>
          <CardDescription>
            Scan for vulnerabilities using different scanning engines. Nikto provides comprehensive web server security testing, while LeakIX searches for exposed services and data leaks.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="query">Target Domain or IP</Label>
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

            <div className="space-y-2">
              <Label>Scan Type</Label>
              <RadioGroup 
                defaultValue="both" 
                className="flex space-x-4"
                {...register("scanType")}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="leakix" id="leakix" />
                  <Label htmlFor="leakix" className="cursor-pointer">LeakIX</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="nikto" id="nikto" />
                  <Label htmlFor="nikto" className="cursor-pointer">Nikto</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="both" id="both" />
                  <Label htmlFor="both" className="cursor-pointer">Both</Label>
                </div>
              </RadioGroup>
            </div>

            {(selectedScanType === "nikto" || selectedScanType === "both") && (
              <div className="space-y-2">
                <Label htmlFor="port">Port (for Nikto scan)</Label>
                <Input
                  id="port"
                  placeholder="80"
                  {...register("port")}
                  disabled={isLoading}
                />
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Scanning... ({Math.round(scanProgress)}%)
                </>
              ) : (
                "Start Scan"
              )}
            </Button>
          </form>
          
          {isLoading && (
            <div className="mt-4">
              <Progress value={scanProgress} className="h-2" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Error Message */}
      {error && (
        <div className="bg-red-500/20 rounded-lg p-4 mt-4 flex items-center justify-center">
          <AlertTriangle className="w-5 h-5 mr-2" />
          <span>{error}</span>
        </div>
      )}

      {/* Results Tabs */}
      {(leakixResults.length > 0 || niktoResults) && (
        <Card>
          <CardContent className="pt-6">
            <Tabs defaultValue="leakix" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="leakix" className="flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  LeakIX Results
                </TabsTrigger>
                <TabsTrigger value="nikto" className="flex items-center justify-center">
                  <ShieldAlert className="w-4 h-4 mr-2" />
                  Nikto Results
                </TabsTrigger>
              </TabsList>
              <div className="mt-6">
                <TabsContent value="leakix">
                  {renderLeakIXResults()}
                </TabsContent>
                <TabsContent value="nikto">
                  {renderNiktoResults()}
                </TabsContent>
              </div>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// Main page component
export default function VulnScanPage() {
  return (
    <PageContainer
      title="Vulnerability Scanner"
      description="Scan websites and servers for security vulnerabilities using multiple scanning engines including Nikto and LeakIX"
    >
      <Suspense fallback={
        <div className="flex items-center justify-center p-6">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      }>
        <VulnScanContent />
      </Suspense>
    </PageContainer>
  )
} 