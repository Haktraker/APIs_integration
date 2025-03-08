"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { toast } from "sonner"
import { Loader2, Shield, Server, Globe, AlertTriangle } from "lucide-react"
import { searchShodan, type ShodanResponse, type ShodanHostResponse, type ShodanDNSResponse } from "@/lib/api/services/shodan"
import DashboardLayout from "../dashboard-layout"
import { Badge } from "@/components/ui/badge"

const searchSchema = z.object({
  target: z.string().min(1, "Please enter an IP or domain"),
})

type SearchFormData = z.infer<typeof searchSchema>

export default function SurfacePage() {
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<ShodanResponse | null>(null)
  const [selectedIP, setSelectedIP] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SearchFormData>({
    resolver: zodResolver(searchSchema),
  })

  const onSubmit = async (data: SearchFormData) => {
    setIsLoading(true)
    setResults(null)
    setSelectedIP(null)
    
    try {
      const response = await searchShodan(data.target)
      console.log("Shodan response:", response)
      
      if (response.error) {
        toast.error(response.error)
        return
      }
      
      setResults(response)
      
      if (!response.hostData && !response.dnsData) {
        toast.info("No results found")
      }
    } catch (error) {
      console.error("Search error:", error)
      toast.error("Search failed. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleIPClick = async (ip: string) => {
    if (ip === selectedIP) {
      setSelectedIP(null)
      return
    }
    
    setSelectedIP(ip)
    setIsLoading(true)
    
    try {
      const response = await searchShodan(ip)
      setResults(prev => ({
        ...prev,
        hostData: response.hostData
      }))
    } catch (error) {
      console.error("IP lookup error:", error)
      toast.error("Failed to get details for this IP")
    } finally {
      setIsLoading(false)
    }
  }

  const handleHostnameClick = async (hostname: string) => {
    setIsLoading(true)
    
    try {
      const response = await searchShodan(hostname)
      setResults(response)
    } catch (error) {
      console.error("Hostname lookup error:", error)
      toast.error("Failed to get details for this hostname")
    } finally {
      setIsLoading(false)
    }
  }

  const getCVSSColor = (score: number) => {
    if (score >= 9) return "bg-red-500"
    if (score >= 7) return "bg-orange-500"
    if (score >= 4) return "bg-yellow-500"
    return "bg-blue-500"
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-2xl font-bold mb-6">Surface Scan</h1>

          {/* Search Form */}
          <div className="bg-gray-800/30 rounded-lg p-6 mb-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="target">Domain or IP Address</Label>
                <Input
                  id="target"
                  placeholder="Enter domain or IP to scan"
                  {...register("target")}
                  className={errors.target ? "border-red-500" : ""}
                  disabled={isLoading}
                />
                {errors.target && (
                  <p className="text-red-500 text-sm">{errors.target.message}</p>
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
          {results && (
            <div className="space-y-6">
              {/* Host Information */}
              {results.hostData && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="bg-gray-800/30 rounded-lg p-6"
                >
                  <h2 className="text-xl font-semibold mb-4 flex items-center">
                    <Server className="w-5 h-5 mr-2" />
                    Host Information
                  </h2>
                  
                  {results.hostData.error ? (
                    <div className="flex items-center text-amber-400">
                      <AlertTriangle className="w-5 h-5 mr-2" />
                      {results.hostData.error}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="space-y-1">
                          <p className="text-sm text-gray-400">IP Address</p>
                          <p className="font-medium">{results.hostData.ip_str}</p>
                        </div>
                        
                        {results.hostData.org && (
                          <div className="space-y-1">
                            <p className="text-sm text-gray-400">Organization</p>
                            <p className="font-medium">{results.hostData.org}</p>
                          </div>
                        )}
                        
                        {results.hostData.isp && (
                          <div className="space-y-1">
                            <p className="text-sm text-gray-400">ISP</p>
                            <p className="font-medium">{results.hostData.isp}</p>
                          </div>
                        )}
                        
                        {results.hostData.country_name && (
                          <div className="space-y-1">
                            <p className="text-sm text-gray-400">Location</p>
                            <p className="font-medium">{results.hostData.country_name}</p>
                          </div>
                        )}
                        
                        {results.hostData.os && (
                          <div className="space-y-1">
                            <p className="text-sm text-gray-400">Operating System</p>
                            <p className="font-medium">{results.hostData.os}</p>
                          </div>
                        )}
                        
                        {results.hostData.last_update && (
                          <div className="space-y-1">
                            <p className="text-sm text-gray-400">Last Updated</p>
                            <p className="font-medium">
                              {new Date(results.hostData.last_update).toLocaleDateString()}
                            </p>
                          </div>
                        )}
                      </div>
                      
                      {/* Hostnames */}
                      {results.hostData.hostnames && results.hostData.hostnames.length > 0 && (
                        <div className="mt-4">
                          <p className="text-sm text-gray-400 mb-2">Hostnames</p>
                          <div className="flex flex-wrap gap-2">
                            {results.hostData.hostnames.map((hostname, index) => (
                              <Badge 
                                key={index} 
                                className="bg-blue-600 hover:bg-blue-700 cursor-pointer"
                                onClick={() => handleHostnameClick(hostname)}
                              >
                                {hostname}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Ports */}
                      {results.hostData.ports && results.hostData.ports.length > 0 && (
                        <div className="mt-4">
                          <p className="text-sm text-gray-400 mb-2">Open Ports</p>
                          <div className="flex flex-wrap gap-2">
                            {results.hostData.ports.map((port, index) => (
                              <Badge key={index} className="bg-gray-600">
                                {port}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Vulnerabilities */}
                      {results.hostData.vulns && results.hostData.vulns.length > 0 && (
                        <div className="mt-6">
                          <h3 className="text-lg font-semibold mb-3 flex items-center">
                            <Shield className="w-4 h-4 mr-2" />
                            Vulnerabilities
                          </h3>
                          <div className="flex flex-wrap gap-2">
                            {results.hostData.vulns.map((vuln, index) => (
                              <Badge 
                                key={index} 
                                className="bg-red-600 hover:bg-red-700"
                              >
                                {vuln}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Services */}
                      {results.hostData.data && results.hostData.data.length > 0 && (
                        <div className="mt-6">
                          <h3 className="text-lg font-semibold mb-3">Services</h3>
                          <div className="overflow-x-auto">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Port</TableHead>
                                  <TableHead>Transport</TableHead>
                                  <TableHead>Product</TableHead>
                                  <TableHead>Version</TableHead>
                                  <TableHead>Vulnerabilities</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {results.hostData.data.map((service, index) => (
                                  <TableRow key={index}>
                                    <TableCell className="font-medium">{service.port}</TableCell>
                                    <TableCell>{service.transport}</TableCell>
                                    <TableCell>{service.product || "Unknown"}</TableCell>
                                    <TableCell>{service.version || "Unknown"}</TableCell>
                                    <TableCell>
                                      {service.vulns ? (
                                        <div className="flex flex-wrap gap-1">
                                          {Object.entries(service.vulns).map(([id, vuln], i) => (
                                            <Badge 
                                              key={i} 
                                              className={`${getCVSSColor(vuln.cvss)}`}
                                              title={vuln.summary}
                                            >
                                              {id} ({vuln.cvss})
                                            </Badge>
                                          ))}
                                        </div>
                                      ) : (
                                        "None"
                                      )}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              )}
              
              {/* DNS Information */}
              {results.dnsData && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                  className="bg-gray-800/30 rounded-lg p-6"
                >
                  <h2 className="text-xl font-semibold mb-4 flex items-center">
                    <Globe className="w-5 h-5 mr-2" />
                    DNS Information
                  </h2>
                  
                  {results.dnsData.error ? (
                    <div className="flex items-center text-amber-400">
                      <AlertTriangle className="w-5 h-5 mr-2" />
                      {results.dnsData.error}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <p className="text-sm text-gray-400">Domain</p>
                        <p className="font-medium">{results.dnsData.domain}</p>
                      </div>
                      
                      {/* DNS Records */}
                      {results.dnsData.data && results.dnsData.data.length > 0 && (
                        <div className="mt-4">
                          <h3 className="text-lg font-semibold mb-3">DNS Records</h3>
                          <div className="overflow-x-auto">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Subdomain</TableHead>
                                  <TableHead>Type</TableHead>
                                  <TableHead>Value</TableHead>
                                  <TableHead>Last Seen</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {results.dnsData.data.map((record, index) => (
                                  <TableRow key={index}>
                                    <TableCell className="font-medium">{record.subdomain}</TableCell>
                                    <TableCell>{record.type}</TableCell>
                                    <TableCell>
                                      {record.type === 'A' || record.type === 'AAAA' ? (
                                        <span 
                                          className="text-blue-400 cursor-pointer hover:underline"
                                          onClick={() => handleIPClick(record.value)}
                                        >
                                          {record.value}
                                        </span>
                                      ) : (
                                        record.value
                                      )}
                                    </TableCell>
                                    <TableCell>
                                      {new Date(record.last_seen).toLocaleDateString()}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </div>
                      )}
                      
                      {/* Subdomains */}
                      {results.dnsData.subdomains && results.dnsData.subdomains.length > 0 && (
                        <div className="mt-4">
                          <p className="text-sm text-gray-400 mb-2">Subdomains</p>
                          <div className="flex flex-wrap gap-2">
                            {results.dnsData.subdomains.map((subdomain, index) => (
                              <Badge 
                                key={index} 
                                className="bg-green-600 hover:bg-green-700 cursor-pointer"
                                onClick={() => handleHostnameClick(`${subdomain}.${results.dnsData?.domain}`)}
                              >
                                {subdomain}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </DashboardLayout>
  )
} 