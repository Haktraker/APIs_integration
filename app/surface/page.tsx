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
import { Loader2 } from "lucide-react"
import { searchShodan, type ShodanResponse, type ShodanHostResponse, type ShodanDNSResponse } from "@/lib/api/services/shodan"
import DashboardLayout from "../dashboard-layout"

const searchSchema = z.object({
  target: z.string().min(1, "Please enter an IP or domain"),
})

type SearchFormData = z.infer<typeof searchSchema>

export default function SurfacePage() {
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<ShodanResponse | null>(null)
  const [selectedIP, setSelectedIP] = useState<string | null>(null)
console.log(results,"results")
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SearchFormData>({
    resolver: zodResolver(searchSchema),
  })

  const onSubmit = async (data: SearchFormData) => {
    setIsLoading(true)
    try {
      const response = await searchShodan(data.target)
      setResults(response)
      if (response.error) {
        toast.error(response.error)
      }
    } catch (error) {
      toast.error("Failed to perform search")
    } finally {
      setIsLoading(false)
    }
  }

  const handleIPClick = async (ip: string) => {
    setSelectedIP(ip)
    setIsLoading(true)
    try {
      const response = await searchShodan(ip)
      setResults(response)
      if (response.error) {
        toast.error(response.error)
      }
    } catch (error) {
      toast.error("Failed to fetch IP details")
    } finally {
      setIsLoading(false)
    }
  }

  const handleHostnameClick = async (hostname: string) => {
    // Redirect to IntelX search for the hostname
    window.location.href = `/dashboard/darkweb?q=${encodeURIComponent(hostname)}`
  }

  return (
    <DashboardLayout>

    <div className="container mx-auto p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-2xl font-bold mb-6">Attack Surface Analysis</h1>

        {/* Search Form */}
        <div className="bg-gray-800/30 rounded-lg p-6 mb-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="target">IP Address or Domain</Label>
              <Input
                id="target"
                placeholder="Enter IP or domain (e.g., 8.8.8.8 or example.com)"
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
                  Searching...
                </>
              ) : (
                "Search"
              )}
            </Button>
          </form>
        </div>

        {/* Results Section */}
        {results && !results.error && (
          <div className="space-y-6">
            {/* DNS Results Table */}
            {results.dnsData && results.dnsData.data.length > 0 && (
              <div className="bg-gray-800/30 rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">DNS Records</h2>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead>Last Seen</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.dnsData.data.map((record, index) => (
                      <TableRow key={index}>
                        <TableCell>{record.type}</TableCell>
                        <TableCell>
                          {record.type === 'A' ? (
                            <Button
                              variant="link"
                              className="p-0 h-auto text-blue-400 hover:text-blue-300"
                              onClick={() => handleIPClick(record.value)}
                            >
                              {record.value}
                            </Button>
                          ) : record.type === 'CNAME' ? (
                            <Button
                              variant="link"
                              className="p-0 h-auto text-blue-400 hover:text-blue-300"
                              onClick={() => handleHostnameClick(record.value)}
                            >
                              {record.value}
                            </Button>
                          ) : (
                            record.value
                          )}
                        </TableCell>
                        <TableCell>{new Date(record.last_seen).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Host Information */}
            {results.hostData && (
              <div className="bg-gray-800/30 rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">Host Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold mb-2">General Information</h3>
                    <dl className="space-y-2">
                      <div>
                        <dt className="text-gray-400">IP Address</dt>
                        <dd>{results.hostData.ip_str}</dd>
                      </div>
                      <div>
                        <dt className="text-gray-400">Host Names</dt>
                      {results.hostData.hostnames?.map((hostname) => (
                        <>

                        <dd
                          key={hostname}
                          className="px-2 py-1 my-1 bg-blue-500/20 rounded text-sm"
                        >
                          {hostname}
                        </dd>
                        </>
                      ))}
                      </div>
                      <div>
                        <dt className="text-gray-400">Domains</dt>
                      {results.hostData.domains?.map((domain) => (
                        <>

                        <dd
                          key={domain}
                          className="px-2 py-1 my-1 bg-blue-500/20 rounded text-sm"
                        >
                          {domain}
                        </dd>
                        </>
                      ))}
                      </div>
                      <div>
                        <dt className="text-gray-400">Organization</dt>
                        <dd>{results.hostData.org || 'N/A'}</dd>
                      </div>
                      <div>
                        <dt className="text-gray-400">Country</dt>
                        <dd>{results.hostData.country_name || 'N/A'}</dd>
                      </div>
                      <div>
                        <dt className="text-gray-400">ISP</dt>
                        <dd>{results.hostData.isp || 'N/A'}</dd>
                      </div>
                      <div>
                        <dt className="text-gray-400">OS</dt>
                        <dd>{results.hostData.os || 'N/A'}</dd>
                      </div>
                    </dl>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold mb-2">Open Ports</h3>
                    <div className="flex flex-wrap gap-2">
                      {results.hostData.ports?.map((port) => (
                        <span
                          key={port}
                          className="px-2 py-1 bg-blue-500/20 rounded text-sm"
                        >
                          {port}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Vulnerabilities Section */}
                {results.hostData.vulns && results.hostData.vulns.length > 0 && (
                  <div className="mt-6">
                    <h3 className="font-semibold mb-2">Vulnerabilities</h3>
                    <div className="space-y-2">
                      {results.hostData.vulns.map((vuln) => (
                        <div
                          key={vuln}
                          className="p-2 bg-red-500/20 rounded"
                        >
                          {vuln}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Error Message */}
        {results?.error && (
          <div className="bg-red-500/20 rounded-lg p-4 text-center">
            {results.error}
          </div>
        )}
      </motion.div>
    </div>
    </DashboardLayout>

  )
} 