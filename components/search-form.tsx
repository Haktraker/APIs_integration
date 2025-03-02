"use client";
import CalendarHeatmap from "react-calendar-heatmap"; // still imported in case you need it later
import "react-calendar-heatmap/dist/styles.css";
import type React from "react";
import { useState, useEffect } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  searchShodan,
  intelxSearch,
  intelxSearchResultWithFiles,
} from "@/lib/api";
import { LoadingScreen } from "./loading-screen";
import { Button } from "./ui/button";

interface ShodanDNSRecord {
  subdomain: string;
  type: string;
  value: string;
  last_seen: string;
}

interface ShodanDNSResponse {
  domain: string;
  tags?: string[];
  data: ShodanDNSRecord[];
  subdomains?: string[];
  more?: boolean;
}

interface ShodanHostResponse {
  ip_str?: string;
  ports?: number[];
  hostnames?: string[];
  org?: string;
  country_name?: string;
  isp?: string;
  os?: string;
  vulns?: string[];
  data?: Array<{
    port: number;
    transport: string;
    product?: string;
    version?: string;
    cpe?: string[];
    vulns?: {
      [key: string]: {
        verified: boolean;
        cvss: number;
        summary: string;
      };
    };
  }>;
  last_update?: string;
}

interface ShodanResponse {
  hostData?: ShodanHostResponse;
  dnsData?: ShodanDNSResponse;
  error?: string;
}

interface IntelXSearchStatisticResponse {
  date: Array<{ day: string; count: number }>;
  type: Array<{ type: number; typeh: string; count: number }>;
  media: Array<{
    media: number;
    mediah: string;
    count: number;
    filter: boolean;
  }>;
  bucket: Array<{
    bucket: string;
    bucketh: string;
    count: number;
    filter: boolean;
  }>;
  heatmap: Record<string, number>;
  total: number;
  status: number;
  terminated: boolean;
}

/**
 * This interface represents the enriched IntelX response that includes file results.
 */
interface IntelXSearchResultWithFiles {
  results: {
    records: Array<{
      systemid: string;
      owner: string;
      storageid: string;
      instore: boolean;
      size: number;
      accesslevel: number;
      type: number;
      media: number;
      added: string;
      date: string;
      name: string;
      description: string;
      xscore: number;
      simhash: number;
      bucket: string;
    }>;
    status: number;
    id: string;
    count: number;
  };
  files: { [storageid: string]: string };
  error?: string;
}

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
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ShodanResponse | null>(null);
  const [intelXResults, setIntelXResults] =
    useState<IntelXSearchStatisticResponse | null>(null);
  const [intelXFileResults, setIntelXFileResults] =
    useState<IntelXSearchResultWithFiles | null>(null);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedFile, setSelectedFile] =
    useState<{ name: string; content: string } | null>(null);

  // Pagination states (5 items per page)
  const PAGE_SIZE = 5;
  const [dnsPage, setDnsPage] = useState(1);
  const [subdomainsPage, setSubdomainsPage] = useState(1);
  const [filesPage, setFilesPage] = useState(1);

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#AF19FF"];

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setShowResults(false);

    try {
      const [shodanResponse, intelXResponse] = await Promise.all([
        searchShodan(query),
        intelxSearch(query),
      ]);
      setResults(shodanResponse);
      setIntelXResults(intelXResponse.statistics);

      const intelXFilesResponse = await intelxSearchResultWithFiles(
        intelXResponse.id,
        query
      );
      setIntelXFileResults(intelXFilesResponse);

      setTimeout(() => {
        setLoading(false);
        setShowResults(true);
      }, 8000);
    } catch (err: any) {
      setTimeout(() => {
        setLoading(false);
        console.error("Search error:", err);
        toast.error(err.message || "Failed to fetch results");
        setResults(null);
        setIntelXResults(null);
        setIntelXFileResults(null);
      }, 8000);
    }
  };

  const formatLineChartData = () => {
    if (!intelXResults?.date) return [];
    return intelXResults.date
      .map((d) => ({
        date: new Date(d.day),
        count: d.count,
      }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  };

  const dateFormatter = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  useEffect(() => {
    return () => {
      setLoading(false);
      setShowResults(false);
    };
  }, []);

  function renderHostData(data: ShodanHostResponse) {
    return (
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
              <TableCell className="font-medium">IP</TableCell>
              <TableCell>{data.ip_str || "N/A"}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Organization</TableCell>
              <TableCell>{data.org || "N/A"}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Country</TableCell>
              <TableCell>{data.country_name || "N/A"}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">ISP</TableCell>
              <TableCell>{data.isp || "N/A"}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Operating System</TableCell>
              <TableCell>{data.os || "N/A"}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Open Ports</TableCell>
              <TableCell>{data.ports?.join(", ") || "N/A"}</TableCell>
            </TableRow>
          </TableBody>
        </Table>

        {data.vulns && data.vulns.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Vulnerabilities</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>CVE</TableHead>
                    <TableHead>CVSS</TableHead>
                    <TableHead>Summary</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.vulns.map((cve) => {
                    const vulnData = data.data?.[0]?.vulns?.[cve];
                    return (
                      <TableRow key={cve}>
                        <TableCell className="font-medium">{cve}</TableCell>
                        <TableCell>{vulnData?.cvss || "N/A"}</TableCell>
                        <TableCell>{vulnData?.summary || "N/A"}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  function renderDNSData(data: ShodanDNSResponse) {
    return (
      <div className="space-y-6">
        {data.tags && data.tags.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2">Tags</h4>
            <div className="flex flex-wrap gap-2">
              {data.tags.map((tag, index) => (
                <span key={index} className="px-2 py-1 bg-secondary text-secondary-foreground rounded-md text-sm">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
        {data.data && data.data.length > 0 && (
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
                {data.data.slice((dnsPage - 1) * PAGE_SIZE, dnsPage * PAGE_SIZE).map((record, index) => (
                  <TableRow key={index}>
                    <TableCell>{record.type}</TableCell>
                    <TableCell>{record.subdomain || "(root)"}</TableCell>
                    <TableCell>{record.value}</TableCell>
                    <TableCell>{new Date(record.last_seen).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="flex justify-between mt-2">
              <Button onClick={() => setDnsPage(prev => Math.max(prev - 1, 1))} disabled={dnsPage === 1}>
                Previous
              </Button>
              <Button onClick={() => setDnsPage(prev => (data.data.length > prev * PAGE_SIZE ? prev + 1 : prev))} disabled={data.data.length <= dnsPage * PAGE_SIZE}>
                Next
              </Button>
            </div>
          </div>
        )}
        {data.subdomains && data.subdomains.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2">Subdomains</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {data.subdomains.slice((subdomainsPage - 1) * PAGE_SIZE, subdomainsPage * PAGE_SIZE).map((subdomain, index) => (
                <div key={index} className="p-2 bg-secondary/50 rounded-md text-sm">
                  {subdomain}
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-2">
              <Button onClick={() => setSubdomainsPage(prev => Math.max(prev - 1, 1))} disabled={subdomainsPage === 1}>
                Previous
              </Button>
              <Button onClick={() => setSubdomainsPage(prev => (data?.subdomains?.length > prev * PAGE_SIZE ? prev + 1 : prev))} disabled={data.subdomains.length <= subdomainsPage * PAGE_SIZE}>
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  function renderIntelXStatistics() {
    if (!intelXResults) return null;
    const dataSourceData = intelXResults.bucket.map((b) => ({
      name: b.bucketh,
      value: b.count,
    }));
    const fileTypeData = intelXResults.media.map((m) => ({
      name: m.mediah,
      value: m.count,
    }));
    const lineChartData = formatLineChartData();
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1  gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Results per Data Source</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={dataSourceData} dataKey="value" cx="50%" cy="50%" outerRadius={80} >
                      {dataSourceData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
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
              <CardTitle className="text-lg">Results per File Type</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={fileTypeData} dataKey="value" cx="50%" cy="50%" outerRadius={80} >
                      {fileTypeData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
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
            <CardTitle className="text-lg">Results per Day (Last 12 Months)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={lineChartData} margin={{ top: 20, right: 20, bottom: 100, left: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#555" />
                  <XAxis dataKey="date" tickFormatter={(date: Date) => dateFormatter(date)} angle={-45} textAnchor="end" tick={{ fontSize: 12 }} />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="count" stroke="#3B82F6" strokeWidth={2} dot={{ fill: "#1D4ED8", strokeWidth: 2 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  function renderIntelXFiles() {
    if (!intelXFileResults) return null;
    const records = intelXFileResults.results.records;
    const paginatedRecords = records.slice((filesPage - 1) * PAGE_SIZE, filesPage * PAGE_SIZE);

    if (records.length === 0) {
      return (
        <Card>
          <CardHeader>
            <CardTitle>IntelX Files</CardTitle>
          </CardHeader>
          <CardContent>
            <p>No files found.</p>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card>
        <CardHeader>
          <CardTitle>IntelX Files</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>File Name</TableHead>
                <TableHead>Added</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedRecords.map((record) => {
                const content = intelXFileResults.files[record.storageid] || "";
                return (
                  <TableRow
                    key={record.storageid}
                    onClick={() =>
                      setSelectedFile({
                        name: record.name,
                        content: content || "No content available",
                      })
                    }
                    className="cursor-pointer hover:bg-[#131c4f]"
                  >
                    <TableCell className="underline text-blue-600">{record.name}</TableCell>
                    <TableCell>{new Date(record.added).toLocaleDateString()}</TableCell>

                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          <div className="flex justify-between mt-2">
            <Button onClick={() => setFilesPage(prev => Math.max(prev - 1, 1))} disabled={filesPage === 1}>
              Previous
            </Button>
            <Button onClick={() => setFilesPage(prev => (records.length > prev * PAGE_SIZE ? prev + 1 : prev))} disabled={records.length <= filesPage * PAGE_SIZE}>
              Next
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 p-4">
      <LoadingScreen open={loading} />
      <Card className="shadow-lg">
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="query">Search Query</Label>
              <Input
                id="query"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Enter IP address or domain"
                className="w-full"
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Searching..." : "Search"}
            </Button>
          </form>
        </CardContent>
      </Card>
      {intelXResults && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Statistics</CardTitle>
          </CardHeader>
          <CardContent>{renderIntelXStatistics()}</CardContent>
        </Card>
      )}
      {intelXFileResults && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Files</CardTitle>
          </CardHeader>
          <CardContent>{renderIntelXFiles()}</CardContent>
        </Card>
      )}
      {showResults && (
        <>
          {results && !results.error && (
            <Card className="shadow-lg">
              <CardHeader />
              <CardContent>
                {results.hostData && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-4">Host Information</h3>
                    {renderHostData(results.hostData)}
                  </div>
                )}
                {results.dnsData && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">DNS Information</h3>
                    {renderDNSData(results.dnsData)}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}
      {selectedFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-[#131c4f] p-6 rounded-md max-w-3xl max-h-screen overflow-auto shadow-2xl">
            <h2 className="text-xl font-bold mb-4">{selectedFile.name}</h2>
            <pre className="whitespace-pre-wrap text-sm">{selectedFile.content}</pre>
            <div className="mt-4 flex justify-end">
              <Button onClick={() => setSelectedFile(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
