"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Loader2, AlertTriangle, FileText, MapPin, Building2, Calendar, ShieldAlert, AlertCircle } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

import { FormattedResult } from "@/lib/api/services/leakix";
import { NiktoScanResult } from "@/lib/api/services/nikto";
import { PortScanResult } from "@/lib/api/services/portscanner";
import { ShodanResponse } from "@/types";

const searchSchema = z.object({
  query: z.string().min(1, "Please enter a target"),
  scanType: z.enum(["all", "leakix", "shodan", "nikto", "portscanner"]),
  port: z.string().optional()
});

type SearchFormData = z.infer<typeof searchSchema>;

export default function ScannerPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-4xl font-bold mb-8">Security Scanner</h1>
      <ScannerContent />
    </div>
  );
}

function ScannerContent() {
  const [isLoading, setIsLoading] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [activeTab, setActiveTab] = useState("leakix");
  const [error, setError] = useState<string | null>(null);
  
  // Results state
  const [leakixResults, setLeakixResults] = useState<FormattedResult[]>([]);
  const [niktoResults, setNiktoResults] = useState<NiktoScanResult | null>(null);
  const [portscanResults, setPortscanResults] = useState<PortScanResult[]>([]);
  const [shodanResults, setShodanResults] = useState<ShodanResponse | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SearchFormData>({
    resolver: zodResolver(searchSchema),
    defaultValues: {
      scanType: "all",
      port: "80",
    }
  });

  const selectedScanType = watch("scanType");

  const onSubmit = async (data: SearchFormData) => {
    setIsLoading(true);
    setError(null);
    setScanProgress(0);
    
    // Reset results
    setLeakixResults([]);
    setNiktoResults(null);
    setPortscanResults([]);
    setShodanResults(null);
    
    try {
      const scanTypes = data.scanType === "all" 
        ? ["leakix", "shodan", "nikto", "portscanner"]
        : [data.scanType];
      
      const totalSteps = scanTypes.length;
      let completedSteps = 0;
      
      for (const scanType of scanTypes) {
        switch (scanType) {
          case "leakix":
            const leakixResponse = await fetch(`/api/leakix?target=${data.query}`);
            const leakixData = await leakixResponse.json();
            if (leakixData.error) {
              toast.error(`LeakIX: ${leakixData.error}`);
            } else {
              setLeakixResults(leakixData.formattedResults);
            }
            break;
            
          case "shodan":
            const shodanResponse = await fetch(`/api/shodan?target=${data.query}`);
            const shodanData = await shodanResponse.json();
            if (shodanData.error) {
              toast.error(`Shodan: ${shodanData.error}`);
            } else {
              setShodanResults(shodanData);
            }
            break;
            
          case "nikto":
            const niktoResponse = await fetch(`/api/nikto?target=${data.query}&port=${data.port || '80'}`);
            const niktoData = await niktoResponse.json();
            if (niktoData.error) {
              toast.error(`Nikto: ${niktoData.error}`);
            } else {
              setNiktoResults(niktoData.scanResult);
            }
            break;
            
          case "portscanner":
            const portScanResponse = await fetch(`/api/portscan?target=${data.query}`);
            const portScanData = await portScanResponse.json();
            if (portScanData.error) {
              toast.error(`Port Scanner: ${portScanData.error}`);
            } else {
              setPortscanResults(portScanData.results);
            }
            break;
        }
        
        completedSteps++;
        setScanProgress((completedSteps / totalSteps) * 100);
      }
      
      toast.success("Scan completed");
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Scan failed';
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
      setScanProgress(100);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Integrated Security Scanner</CardTitle>
          <CardDescription>
            Scan targets using multiple security tools including LeakIX, Shodan, Nikto, and Port Scanner.
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
                defaultValue="all" 
                className="flex flex-wrap gap-4"
                {...register("scanType")}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="all" id="all" />
                  <Label htmlFor="all">All Services</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="leakix" id="leakix" />
                  <Label htmlFor="leakix">LeakIX</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="shodan" id="shodan" />
                  <Label htmlFor="shodan">Shodan</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="nikto" id="nikto" />
                  <Label htmlFor="nikto">Nikto</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="portscanner" id="portscanner" />
                  <Label htmlFor="portscanner">Port Scanner</Label>
                </div>
              </RadioGroup>
            </div>

            {(selectedScanType === "nikto" || selectedScanType === "all") && (
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
              className="w-full"
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

            {isLoading && (
              <Progress value={scanProgress} className="h-2" />
            )}
          </form>
        </CardContent>
      </Card>

      {error && (
        <div className="bg-red-500/20 rounded-lg p-4 flex items-center justify-center">
          <AlertTriangle className="w-5 h-5 mr-2" />
          <span>{error}</span>
        </div>
      )}

      {(leakixResults.length > 0 || niktoResults || portscanResults.length > 0 || shodanResults) && (
        <Card>
          <CardContent className="pt-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-4">
                <TabsTrigger value="leakix">LeakIX</TabsTrigger>
                <TabsTrigger value="shodan">Shodan</TabsTrigger>
                <TabsTrigger value="nikto">Nikto</TabsTrigger>
                <TabsTrigger value="portscanner">Ports</TabsTrigger>
              </TabsList>
              
              <TabsContent value="leakix" className="mt-6">
                {/* LeakIX Results */}
                {leakixResults.length === 0 ? (
                  <p className="text-center text-gray-500">No LeakIX results available</p>
                ) : (
                  <div className="space-y-4">
                    {leakixResults.map((result, index) => (
                      <div key={index} className="p-4 border rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-medium">{result.title}</h3>
                          <Badge>{result.severity}</Badge>
                        </div>
                        <div className="text-sm text-gray-500 space-y-2">
                          {result.ip && <p>IP: {result.ip}</p>}
                          {result.port && <p>Port: {result.port}</p>}
                          {result.organization && <p>Organization: {result.organization}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="shodan" className="mt-6">
                {/* Shodan Results */}
                {!shodanResults ? (
                  <p className="text-center text-gray-500">No Shodan results available</p>
                ) : (
                  <div className="space-y-4">
                    {shodanResults.hostData && (
                      <div className="p-4 border rounded-lg">
                        <h3 className="font-medium mb-2">Host Information</h3>
                        <div className="text-sm text-gray-500 space-y-2">
                          <p>IP: {shodanResults.hostData.ip_str}</p>
                          {shodanResults.hostData.org && <p>Organization: {shodanResults.hostData.org}</p>}
                          {shodanResults.hostData.os && <p>Operating System: {shodanResults.hostData.os}</p>}
                          {shodanResults.hostData.ports && (
                            <p>Open Ports: {shodanResults.hostData.ports.join(", ")}</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="nikto" className="mt-6">
                {/* Nikto Results */}
                {!niktoResults ? (
                  <p className="text-center text-gray-500">No Nikto results available</p>
                ) : (
                  <div className="space-y-4">
                    <div className="p-4 border rounded-lg">
                      <h3 className="font-medium mb-2">Scan Summary</h3>
                      <div className="text-sm text-gray-500 space-y-2">
                        <p>Target: {niktoResults.target}:{niktoResults.targetPort}</p>
                        <p>Scan Date: {new Date(niktoResults.scanDate).toLocaleString()}</p>
                        <p>Duration: {niktoResults.scanDuration}</p>
                        <p>Total Issues: {niktoResults.totalVulnerabilities}</p>
                      </div>
                    </div>
                    
                    {niktoResults.vulnerabilities.map((vuln, index) => (
                      <Collapsible key={index} className="border rounded-lg">
                        <CollapsibleTrigger className="w-full p-4 flex justify-between items-center">
                          <span className="font-medium">{vuln.title}</span>
                          <Badge>{vuln.severity}</Badge>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="p-4 border-t">
                          <div className="space-y-2 text-sm text-gray-500">
                            <p>{vuln.description}</p>
                            {vuln.recommendation && (
                              <div className="mt-2">
                                <strong>Recommendation:</strong>
                                <p>{vuln.recommendation}</p>
                              </div>
                            )}
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    ))}
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="portscanner" className="mt-6">
                {/* Port Scanner Results */}
                {portscanResults.length === 0 ? (
                  <p className="text-center text-gray-500">No port scan results available</p>
                ) : (
                  <div className="space-y-4">
                    {portscanResults.map((result, index) => (
                      <div key={index} className="p-4 border rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <h3 className="font-medium">Port {result.port}</h3>
                          <Badge>{result.state}</Badge>
                        </div>
                        <div className="text-sm text-gray-500 space-y-1">
                          <p>Service: {result.service}</p>
                          {result.version && <p>Version: {result.version}</p>}
                          {result.banner && <p>Banner: {result.banner}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
}