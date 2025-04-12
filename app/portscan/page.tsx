"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Network, Timer, CalendarDays, Binary, Info, ScanLine, Server } from "lucide-react"; // Import icons

import DashboardLayout from "../dashboard-layout"; // Assuming this path is correct
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"; // For error display

// Import the API function and response type
import { runPortScan, type PortScanResponse } from "@/lib/api/services/portscanner"; // Adjust path if needed

// Import the parser function and its result type
import { parseNmapResult, formatDate, type ParsedNmapResult } from "@/lib/utils"; // Adjust path if needed

// Simple reusable Summary Card component
function SummaryCard({ icon: Icon, title, value }: { icon: React.ElementType, title: string, value: string | number | undefined }) {
  return (
    <Card className="shadow-sm">
      <CardContent className="pt-6 flex items-center space-x-4">
        <div className="p-3 rounded-full bg-primary/10 text-primary">
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-xl font-semibold">{value ?? 'N/A'}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Page() {
  const [target, setTarget] = useState("");
  const [loading, setLoading] = useState(false);
  // Store the raw response data
  const [scanResponse, setScanResponse] = useState<PortScanResponse | null>(null);
  // Store the parsed results
  const [parsedResult, setParsedResult] = useState<ParsedNmapResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setScanResponse(null);
    setParsedResult(null);

    if (!target.trim()) {
      toast.error("Please enter a target IP or domain.");
      setLoading(false);
      return;
    }

    try {
      const response = await runPortScan(target);
      setScanResponse(response); // Store the full response

      if (!response.success) {
        const errorMessage = response.error || "An unknown scan error occurred.";
        setError(errorMessage);
        toast.error(errorMessage);
      } else {
        if (response.rawResult) {
          // Parse the raw result
          const parsed = parseNmapResult(response.rawResult);
          setParsedResult(parsed);
          toast.success(`Scan for ${response.target} completed. Found ${parsed.openPorts.length} open port(s).`);
        } else {
           setParsedResult(parseNmapResult(null)); // Ensure parsedResult is not null but has empty data
           toast.info(`Scan for ${response.target} completed, but no output was returned.`);
           setError("Scan finished, but no detailed result data was received."); // Inform user
        }
      }
    } catch (err) {
      console.error("Port Scan component error:", err);
      const errorMessage = err instanceof Error ? err.message : "An unexpected client-side error occurred.";
      setError(errorMessage);
      setScanResponse({ // Create a minimal error response object
        success: false,
        target: target,
        scanDate: new Date().toISOString(),
        // results: [], // Keep interface compatibility if needed elsewhere, though unused here
        error: errorMessage
      });
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Determine the display IP: use parsed IP if available, else fallback to original target or response target
  const displayIp = parsedResult?.ipAddress || scanResponse?.target || target;
  const scanDateFormatted = scanResponse?.scanDate ? formatDate(scanResponse.scanDate) : undefined;

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 space-y-6">
        {/* Input Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ScanLine className="w-6 h-6" /> Port Scanner
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleScan} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="target">Target IP or Domain</Label>
                <div className="flex flex-col sm:flex-row sm:space-x-2 space-y-2 sm:space-y-0">
                  <Input
                    id="target"
                    value={target}
                    onChange={(e) => setTarget(e.target.value)}
                    placeholder="e.g., 192.168.1.1 or example.com"
                    disabled={loading}
                    className="flex-grow"
                  />
                  <Button type="submit" disabled={loading || !target} className="w-full sm:w-auto">
                    {loading ? "Scanning..." : "Scan Target"}
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Error Display */}
        {error && !loading && (
          <Alert variant="destructive">
            <Info className="h-4 w-4" />
            <AlertTitle>Scan Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
            {scanResponse?.scanId && <p className="text-xs mt-1">Scan ID: {scanResponse.scanId}</p>}
          </Alert>
        )}

        {/* Results Area - Show only when not loading and a response exists */}
        {!loading && scanResponse && scanResponse.success && (
          <>
            {/* Summary Section */}
            <div className="space-y-2">
                 <h2 className="text-2xl font-semibold tracking-tight">Summary</h2>
                 <p className="text-muted-foreground">Overview of the scan results for {displayIp}</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <SummaryCard icon={Network} title="Open Ports" value={parsedResult?.openPorts.length ?? 0} />
              <SummaryCard icon={Timer} title="Duration" value={parsedResult?.duration ?? 'N/A'} />
              <SummaryCard icon={CalendarDays} title="Date" value={scanDateFormatted} />
              <SummaryCard icon={Server} title="IP Address" value={displayIp} />
            </div>

            {/* Report Section */}
             <div className="space-y-2 pt-4">
                 <h2 className="text-2xl font-semibold tracking-tight">Report</h2>
                 <p className="text-muted-foreground">
                     {scanResponse.scanCommand
                        ? <>Performing scan using command: <code className="text-xs bg-muted px-1 py-0.5 rounded">{scanResponse.scanCommand}</code></>
                        : "Detailed scan output:"
                     }
                 </p>
            </div>
            <Card>
              <CardContent className="p-0">
                 {/* Use parsedResult.rawOutputLines for potentially better formatting control if needed */}
                 {/* Or stick with rawResult if simpler */}
                <pre className="p-4 bg-gray-900 text-gray-200 rounded-md text-sm font-mono overflow-x-auto whitespace-pre-wrap break-words">
                  {scanResponse.rawResult || "No output available."}
                </pre>
              </CardContent>
            </Card>

            {/* (Optional) Detailed Report Section - Mimicking 2nd screenshot */}
             <div className="space-y-2 pt-4">
                 <h2 className="text-2xl font-semibold tracking-tight">Detailed Information</h2>
            </div>
             <Card>
                 <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-sm">
                     <div><span className="font-semibold text-muted-foreground">Target:</span> {scanResponse.target}</div>
                     <div><span className="font-semibold text-muted-foreground">Target IP:</span> {displayIp}</div>
                     <div><span className="font-semibold text-muted-foreground">Host Status:</span> <span className="capitalize">{parsedResult?.hostStatus ?? 'Unknown'}</span></div>
                     <div><span className="font-semibold text-muted-foreground">Scan Method:</span> {scanResponse.scanCommand ? 'Command Driven' : 'Basic Port Scan'}</div>
                     <div><span className="font-semibold text-muted-foreground">Scan Status:</span> {parsedResult ? `Identified ${parsedResult.openPorts.length} open port(s)` : 'Completed'}</div>
                     <div><span className="font-semibold text-muted-foreground">Run Command:</span> <code className="text-xs bg-muted px-1 py-0.5 rounded">{scanResponse.scanCommand || 'N/A'}</code></div>
                     <div><span className="font-semibold text-muted-foreground">Scan Date:</span> {scanDateFormatted ?? 'N/A'}</div>
                     <div><span className="font-semibold text-muted-foreground">API - Scan ID:</span> <code className="text-xs break-all">{scanResponse.scanId || 'N/A'}</code></div>
                     <div><span className="font-semibold text-muted-foreground">Scan Duration:</span> {parsedResult?.duration ?? 'N/A'}</div>
                 </CardContent>
             </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}