"use client";
import { useState, useRef } from "react";
import { Formik, Form, Field } from "formik";
import { toast } from "sonner";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  searchShodan,
  type ShodanResponse,
  type ShodanHostResponse,
} from "@/lib/api/services/shodan";
/* IntelX functionality has been removed
import {
  intelxSearch,
  intelxSearchResultWithFiles,
  type IntelXSearchResultWithFiles,
  type IntelXSearchStatisticResponse,
} from "@/lib/api/services/intelx";
*/

const PAGE_SIZE = 50;
const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#AF19FF"];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-700 text-white p-2 rounded">
        <p className="font-semibold">
          {new Date(label).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          })}
        </p>
        <p>Count: {payload[0].value}</p>
      </div>
    );
  }
  return null;
};

export function SearchForm() {
  const [results, setResults] = useState<ShodanResponse | null>(null);
  /* IntelX state has been removed
  const [intelXResults, setIntelXResults] = useState<IntelXSearchStatisticResponse | null>(null);
  const [intelXFileResults, setIntelXFileResults] = useState<IntelXSearchResultWithFiles | null>(null);
  */
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState("");
  const [selectedFile, setSelectedFile] = useState<{ name: string; content: string } | null>(null);
  const [currentPage, setCurrentPage] = useState({ dns: 1, subdomains: 1, files: 1 });
  const abortControllerRef = useRef<AbortController | null>(null);

  /* IntelX chart data formatting function has been removed
  const formatLineChartData = () => {
    if (!intelXResults?.date) return [];
    return intelXResults.date
      .map(d => ({
        date: new Date(d.day),
        count: d.count,
      }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  };
  */

  const dateFormatter = (date: Date) =>
    date.toLocaleDateString("en-US", { month: "short", day: "numeric" });

  const renderPagination = (type: keyof typeof currentPage, total: number) => {
    const page = currentPage[type];
    const maxPage = Math.ceil(total / PAGE_SIZE);
    return (
      <div className="flex justify-between items-center mt-4">
        <Button
          variant="outline"
          onClick={() => setCurrentPage(prev => ({ ...prev, [type]: Math.max(prev[type] - 1, 1) }))}
          disabled={page === 1}
        >
          Previous
        </Button>
        <span>
          Page {page} of {maxPage}
        </span>
        <Button
          variant="outline"
          onClick={() =>
            setCurrentPage(prev => ({ ...prev, [type]: Math.min(prev[type] + 1, maxPage) }))
          }
          disabled={page >= maxPage}
        >
          Next
        </Button>
      </div>
    );
  };

  const renderHostData = (data: ShodanHostResponse) => (
    <div className="space-y-6">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Property</TableHead>
            <TableHead>Value</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>IP</TableCell>
            <TableCell>{data.ip_str || "N/A"}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Organization</TableCell>
            <TableCell>{data.org || "N/A"}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Country</TableCell>
            <TableCell>{data.country_name || "N/A"}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>ISP</TableCell>
            <TableCell>{data.isp || "N/A"}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Operating System</TableCell>
            <TableCell>{data.os || "N/A"}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Open Ports</TableCell>
            <TableCell>{data.ports?.join(", ") || "N/A"}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );

  const renderDNSData = (data: any) => (
    <div className="space-y-6">
      {data.data?.length > 0 && (
        <div>
          <h4 className="text-sm font-medium mb-2">DNS Records</h4>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Subdomain</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Last Seen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.data
                .slice((currentPage.dns - 1) * PAGE_SIZE, currentPage.dns * PAGE_SIZE)
                .map((record: any, index: number) => (
                  <TableRow key={index}>
                    <TableCell>{record.type}</TableCell>
                    <TableCell>{record.subdomain || "(root)"}</TableCell>
                    <TableCell>{record.value}</TableCell>
                    <TableCell>{new Date(record.last_seen).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
          {renderPagination("dns", data.data.length)}
        </div>
      )}
      {data.subdomains && data.subdomains.length > 0 && (
        <div>
          <h4 className="text-sm font-medium mb-2">Subdomains</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {data.subdomains
              .slice((currentPage.subdomains - 1) * PAGE_SIZE, currentPage.subdomains * PAGE_SIZE)
              .map((subdomain: string, index: number) => (
                <div key={index} className="p-2 bg-secondary/50 rounded-md text-sm">
                  {subdomain}
                </div>
              ))}
          </div>
          {renderPagination("subdomains", data.subdomains.length)}
        </div>
      )}
    </div>
  );

  /* IntelX stats rendering function has been removed 
  const renderIntelXStats = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Data Sources</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={
                      intelXResults?.bucket?.map(b => ({
                        name: b.bucketh,
                        value: b.count,
                      })) || []
                    }
                    dataKey="value"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, percent }) =>
                      `${name}: ${(percent * 100).toFixed(2)}%`
                    }
                  >
                    {intelXResults?.bucket?.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend layout="vertical" verticalAlign="middle" align="right" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>File Types</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={
                      intelXResults?.media?.map(m => ({
                        name: m.mediah,
                        value: m.count,
                      })) || []
                    }
                    dataKey="value"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, percent }) =>
                      `${name}: ${(percent * 100).toFixed(2)}%`
                    }
                  >
                    {intelXResults?.media?.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend layout="vertical" verticalAlign="middle" align="right" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Data Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={formatLineChartData()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={dateFormatter}
                  domain={["auto", "auto"]}
                />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#8884d8"
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
  */

  /* IntelX file rendering function has been removed
  const renderIntelXFile = () => {
    if (!selectedFile) return null;
    return (
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>{selectedFile.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="bg-secondary p-4 rounded-md whitespace-pre-wrap text-sm max-h-[500px] overflow-auto">
            {selectedFile.content}
          </pre>
        </CardContent>
      </Card>
    );
  };
  */

  /* IntelX files section rendering function has been removed
  const renderIntelXFiles = () => {
    if (!intelXFileResults?.results?.records?.length)
      return <p>No text files found for this search.</p>;

    const paginatedResults = intelXFileResults.results.records.slice(
      (currentPage.files - 1) * PAGE_SIZE,
      currentPage.files * PAGE_SIZE
    );

    return (
      <div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>File Name</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Size</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedResults.map((file, index) => {
              const fileContent = intelXFileResults.files[file.storageid];
              return (
                <TableRow key={index}>
                  <TableCell>{file.name}</TableCell>
                  <TableCell>
                    {new Date(file.added).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {(file.size / 1024).toFixed(2)} KB
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedFile({ name: file.name, content: fileContent || "Content not available" })}
                    >
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        {renderPagination("files", intelXFileResults.results.records.length)}
      </div>
    );
  };
  */

  async function handleSubmit(values: { query: string }) {
    try {
      setLoading(true);
      setResults(null);
      /* IntelX results reset has been removed
      setIntelXResults(null);
      setIntelXFileResults(null);
      */
      setSelectedFile(null);
      setProgress(0);
      setStatusMessage("Starting search...");

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      const query = values.query.trim();

      // Artificially simulate progress for better UX
      const interval = setInterval(() => {
        setProgress((prevProgress) => {
          if (prevProgress >= 90) {
            clearInterval(interval);
            return prevProgress;
          }
          return prevProgress + 10;
        });

        // Update status message based on progress
        setStatusMessage((prevStatus) => {
          if (prevStatus === "Starting search...") return "Searching for data...";
          if (prevStatus === "Searching for data...") return "Processing results...";
          return "Finalizing results...";
        });
      }, 1000);

      // Shodan search
      if (isIP(query) || isDomain(query)) {
        const shodanResults = await searchShodan(query);
        setResults(shodanResults);
      }

      /* IntelX search has been removed
      // IntelX search for data leaks
      try {
        // Only attempt intelX search if it's a domain
        if (isDomain(query)) {
          const intelXResponse = await intelxSearch(query);
          setIntelXResults(intelXResponse.statistics);

          if (intelXResponse.id) {
            const fileResults = await intelxSearchResultWithFiles(intelXResponse.id);
            setIntelXFileResults(fileResults);
          }
        }
      } catch (error) {
        console.error("IntelX search error:", error);
        toast.error("Error fetching IntelX data. Some results may be missing.");
      }
      */

      clearInterval(interval);
      setProgress(100);
      setStatusMessage("Search complete!");
      toast.success("Search completed successfully!");
    } catch (error) {
      console.error("Search error:", error);
      toast.error("An error occurred during the search.");
    } finally {
      setLoading(false);
    }
  }

  // Helper function to check if string is an IP address
  function isIP(str: string) {
    const ipRegex = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/;
    return ipRegex.test(str);
  }

  // Helper function to check if string is a domain
  function isDomain(str: string) {
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9](?:\.[a-zA-Z]{2,})+$/;
    return domainRegex.test(str);
  }

  return (
    <div className="space-y-8">
      <Formik initialValues={{ query: "" }} onSubmit={handleSubmit}>
        <Form className="space-y-4">
          <div className="grid grid-cols-1 gap-2">
            <Label htmlFor="query">Search Query (IP Address or Domain)</Label>
            <Field
              id="query"
              name="query"
              as={Input}
              placeholder="Enter an IP address, domain, or search term..."
              disabled={loading}
            />
          </div>

          {loading ? (
            <div className="space-y-2">
              <div className="flex justify-between text-xs mb-1">
                <span>Search Progress:</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1">{statusMessage}</p>
            </div>
          ) : (
            <Button type="submit" className="w-full sm:w-auto">
              Search
            </Button>
          )}
        </Form>
      </Formik>

      {/* Results section */}
      {results && (
        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Shodan Results</CardTitle>
            </CardHeader>
            <CardContent>
              {results.error ? (
                <p className="text-red-500">{results.error}</p>
              ) : (
                <div className="space-y-6">
                  {results.ip && renderHostData(results.ip)}
                  {results.domain && renderDNSData(results.domain)}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* IntelX results section has been removed
      {intelXResults && (
        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Intelligence X Data Analysis</CardTitle>
            </CardHeader>
            <CardContent>{renderIntelXStats()}</CardContent>
          </Card>

          {intelXFileResults && (
            <Card>
              <CardHeader>
                <CardTitle>Intelligence X Files</CardTitle>
              </CardHeader>
              <CardContent>
                {intelXFileResults.error && (
                  <p className="text-amber-500 mb-4">{intelXFileResults.error}</p>
                )}
                {renderIntelXFiles()}
              </CardContent>
            </Card>
          )}

          {selectedFile && renderIntelXFile()}
        </div>
      )}
      */}
    </div>
  );
}