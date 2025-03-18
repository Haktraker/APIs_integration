"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { toast } from "sonner"
import { Loader2, AlertTriangle, ShieldAlert, AlertCircle, ExternalLink } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { runNiktoScan, NiktoScanResult, NiktoVulnerability } from "@/lib/api/services/nikto"
import { PageContainer } from "@/components/page-container"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Switch } from "@/components/ui/switch"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const scanSchema = z.object({
  target: z.string().min(1, "Please enter a target domain or IP"),
  port: z.string().min(1, "Please enter a port number"),
  scanOption: z.string(),
  ssl: z.boolean().default(false),
  timeout: z.string()
})

type ScanFormData = z.infer<typeof scanSchema>

export default function NiktoScanPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [scanResult, setScanResult] = useState<NiktoScanResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [scanProgress, setScanProgress] = useState(0)
  const [activeTab, setActiveTab] = useState<string>("vulnerabilities")

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ScanFormData>({
    resolver: zodResolver(scanSchema),
    defaultValues: {
      target: "",
      port: "80",
      scanOption: "scan5min",
      ssl: false,
      timeout: "120"
    }
  })

  const ssl = watch("ssl")
  const scanOption = watch("scanOption")

  // Update port when SSL is toggled
  const handleSslToggle = (checked: boolean) => {
    setValue("ssl", checked)
    if (checked && watch("port") === "80") {
      setValue("port", "443")
    } else if (!checked && watch("port") === "443") {
      setValue("port", "80")
    }
  }

  // Update scan option when SSL is toggled
  const handleScanOptionChange = (value: string) => {
    const sslValue = watch("ssl")
    
    // Remove any existing ssl suffix first
    const baseOption = value.replace("ssl", "")
    
    // Then add ssl suffix if SSL is enabled
    if (sslValue) {
      setValue("scanOption", `${baseOption}ssl`)
    } else {
      setValue("scanOption", baseOption)
    }
  }

  const performScan = async (data: ScanFormData) => {
    setIsLoading(true)
    setError(null)
    setScanResult(null)
    setScanProgress(5)
    
    try {
      const portNumber = parseInt(data.port, 10)
      if (isNaN(portNumber) || portNumber < 1 || portNumber > 65535) {
        setError("Invalid port number. Please enter a number between 1 and 65535.")
        toast.error("Invalid port number")
        setIsLoading(false)
        return
      }
      
      // Start the scan
      toast.info(`Starting Nikto scan for ${data.target}:${data.port} using ${data.scanOption} method. This may take several minutes...`)
      setScanProgress(10)
      
      // Simulate progress updates since the API doesn't provide real-time progress
      const progressInterval = setInterval(() => {
        setScanProgress((prev) => {
          const newProgress = prev + 2
          return newProgress < 95 ? newProgress : prev
        })
      }, 3000)
      
      // Show detailed toast messages based on progress
      const statusCheckInterval = setInterval(() => {
        if (scanProgress > 20 && scanProgress < 40) {
          toast.info("Nikto is probing the target server...")
        } else if (scanProgress > 50 && scanProgress < 70) {
          toast.info("Checking for vulnerabilities...")
        } else if (scanProgress > 80) {
          toast.info("Almost done, finalizing results...")
        }
      }, 20000) // Check every 20 seconds
      
      // Perform the scan
      const response = await runNiktoScan(data.target, portNumber, data.scanOption)
      
      // Clear intervals
      clearInterval(progressInterval)
      clearInterval(statusCheckInterval)
      
      if (!response.success) {
        // Set detailed error message
        let errorMsg = response.error || "Scan failed"
        if (errorMsg.includes("still running")) {
          errorMsg = "The scan is taking longer than expected. Please try viewing the results again in a few minutes."
          toast.warning(errorMsg)
        } else {
          toast.error(`Scan failed: ${errorMsg}`)
        }
        setError(errorMsg)
        setScanProgress(100)
        return
      }
      
      // Display successful scan result
      if (response.scanResult) {
        setScanResult(response.scanResult)
        setActiveTab("vulnerabilities")
        const vulnCount = response.scanResult.totalVulnerabilities;
        let severity = "issues"
        
        if (vulnCount > 10) {
          severity = "significant vulnerabilities"
        } else if (vulnCount > 5) {
          severity = "moderate security issues"
        } else if (vulnCount > 0) {
          severity = "potential vulnerabilities"
        } else {
          severity = "issues"
        }
        
        toast.success(`Scan completed. Found ${response.scanResult.totalVulnerabilities} ${severity}.`)
        
        // If high severity vulnerabilities were found, show warning toast
        const highSeverityCount = response.scanResult.vulnerabilities.filter(
          v => v.severity === 'Critical' || v.severity === 'High'
        ).length
        
        if (highSeverityCount > 0) {
          toast.warning(`Found ${highSeverityCount} high severity vulnerabilities! Immediate attention recommended.`)
        }
      }
      
      setScanProgress(100)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Scan failed due to an unexpected error'
      setError(message)
      toast.error(message)
      console.error("Nikto scan failed:", error)
    } finally {
      setIsLoading(false)
      setScanProgress(100)
    }
  }

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

  const countVulnerabilitiesBySeverity = (vulnerabilities: NiktoVulnerability[], severity: string) => {
    return vulnerabilities.filter(v => v.severity.toLowerCase() === severity.toLowerCase()).length
  }

  const renderVulnerabilityStats = () => {
    if (!scanResult || !scanResult.vulnerabilities.length) return null
    
    const categories = ['Critical', 'High', 'Medium', 'Low', 'Info']
    const counts = categories.map(cat => countVulnerabilitiesBySeverity(scanResult.vulnerabilities, cat))
    const maxCount = Math.max(...counts)
    
    return (
      <div className="grid grid-cols-5 gap-2 mb-4">
        {categories.map((category, idx) => (
          <div key={category} className="flex flex-col items-center">
            <div className="text-xs mb-1">{category}</div>
            <div className={`w-full rounded-lg ${getSeverityColor(category)}`} style={{ 
              height: `${Math.max(20, (counts[idx] / maxCount) * 120)}px` 
            }}>
              <div className="h-full w-full flex items-center justify-center text-white font-bold">
                {counts[idx]}
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <PageContainer
      title="Nikto Web Vulnerability Scanner"
      description="Scan web servers for security vulnerabilities, misconfigurations, and outdated software"
    >
      <div className="space-y-6">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Nikto Scanner</CardTitle>
            <CardDescription>
              Nikto is a comprehensive web server scanner that tests for thousands of dangerous files, outdated software, and version-specific vulnerabilities.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(performScan)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="target">Target Domain or IP</Label>
                  <Input
                    id="target"
                    placeholder="example.com"
                    {...register("target")}
                    className={errors.target ? "border-red-500" : ""}
                    disabled={isLoading}
                  />
                  {errors.target && (
                    <p className="text-red-500 text-sm">{errors.target.message}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="port">Port</Label>
                  <Input
                    id="port"
                    placeholder="80"
                    {...register("port")}
                    className={errors.port ? "border-red-500" : ""}
                    disabled={isLoading}
                  />
                  {errors.port && (
                    <p className="text-red-500 text-sm">{errors.port.message}</p>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="scanOption">Scan Type</Label>
                  <Select
                    value={scanOption}
                    onValueChange={handleScanOptionChange}
                    disabled={isLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a scan type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="simple">Quick Scan (60 sec)</SelectItem>
                      <SelectItem value="scan5min">Standard Scan (5 min)</SelectItem>
                      <SelectItem value="scan10min">Thorough Scan (10 min)</SelectItem>
                      <SelectItem value="scan30min">Deep Scan (30 min)</SelectItem>
                      <SelectItem value="scandb">Database Check Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex flex-col justify-end space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="ssl" className="cursor-pointer">SSL/TLS Scan</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Switch 
                            id="ssl" 
                            checked={ssl}
                            onCheckedChange={handleSslToggle}
                            disabled={isLoading}
                          />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Enable to test HTTPS connections</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
              </div>
              
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
                  "Start Nikto Scan"
                )}
              </Button>
            </form>
            
            {isLoading && (
              <div className="mt-4">
                <Progress value={scanProgress} className="h-2" />
                <p className="text-sm text-center mt-2 text-gray-400">
                  {scanProgress < 20 ? "Initializing scan..." : 
                   scanProgress < 60 ? "Scanning the target..." : 
                   scanProgress < 95 ? "Analyzing results..." : 
                   "Completing scan..."}
                </p>
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

        {/* Results */}
        {scanResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="shadow-lg">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>Scan Results</CardTitle>
                    <CardDescription>
                      Target: {scanResult.target}:{scanResult.targetPort} • 
                      Scan date: {new Date(scanResult.scanDate).toLocaleString()} • 
                      Duration: {scanResult.scanDuration}
                    </CardDescription>
                  </div>
                  {scanResult.publicUrl && (
                    <Button variant="outline" size="sm" asChild>
                      <a 
                        href={scanResult.publicUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center"
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View Full Report
                      </a>
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="font-medium">Server: </span>
                      <span className="text-gray-400">{scanResult.targetServer || "Unknown"}</span>
                    </div>
                    <Badge className="text-md">
                      {scanResult.totalVulnerabilities} {scanResult.totalVulnerabilities === 1 ? 'issue' : 'issues'} found
                    </Badge>
                  </div>
                  
                  {renderVulnerabilityStats()}
                  
                  <Tabs defaultValue="vulnerabilities" value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="vulnerabilities" className="flex items-center justify-center">
                        <ShieldAlert className="w-4 h-4 mr-2" />
                        Vulnerabilities
                      </TabsTrigger>
                      <TabsTrigger value="raw" className="flex items-center justify-center">
                        <AlertCircle className="w-4 h-4 mr-2" />
                        Raw Results
                      </TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="vulnerabilities" className="mt-6">
                      <div className="grid gap-4">
                        {scanResult.vulnerabilities.map((vuln, index) => (
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
                    </TabsContent>
                    
                    <TabsContent value="raw" className="mt-6">
                      {scanResult.rawResult ? (
                        <div className="border border-gray-800 rounded-lg overflow-hidden">
                          <pre className="text-xs text-gray-400 overflow-auto max-h-[500px] p-4 bg-gray-950/50 rounded">
                            {scanResult.rawResult}
                          </pre>
                        </div>
                      ) : (
                        <div className="text-center text-gray-400 py-8">
                          Raw results not available
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between pt-4 border-t border-gray-800">
                <p className="text-sm text-muted-foreground">
                  Nikto is a powerful web server scanner that tests for thousands of potentially dangerous files, outdated versions, and version-specific problems.
                </p>
              </CardFooter>
            </Card>
          </motion.div>
        )}
      </div>
    </PageContainer>
  )
} 