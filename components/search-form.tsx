"use client";

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
  ScatterChart,
  Scatter,
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
import { searchShodan, intelxSearch } from "@/lib/api";
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

export function SearchForm() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ShodanResponse | null>(null);
  const [intelXResults, setIntelXResults] =
    useState<IntelXSearchStatisticResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);

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

      setTimeout(() => {
        setLoading(false);
        setShowResults(true);
        if (shodanResponse.error || intelXResponse.error) {
          toast.error("Some results may be incomplete");
        } else {
          toast.success("Search completed successfully");
        }
      }, 8000);
    } catch (err: any) {
      setTimeout(() => {
        setLoading(false);
        console.error("Search error:", err);
        toast.error(err.message || "Failed to fetch results");
        setResults(null);
        setIntelXResults(null);
      }, 8000);
    }
  };

  const formatBucketData = () => {
    if (!intelXResults?.bucket) return [];
    return intelXResults.bucket.map((bucket) => ({
      name: bucket.bucketh,
      value: bucket.count,
    }));
  };

  const formatDateData = () => {
    if (!intelXResults?.date) return [];
    return intelXResults.date
      .map((d) => ({
        date: new Date(d.day),
        count: d.count,
      }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  };

  const formatHeatmapData = () => {
    if (!intelXResults?.heatmap) return {};
    return Object.entries(intelXResults.heatmap).map(([timestamp, count]) => ({
      date: new Date(parseInt(timestamp) * 1000),
      count,
    }));
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
                <span
                  key={index}
                  className="px-2 py-1 bg-secondary text-secondary-foreground rounded-md text-sm"
                >
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
                {data.data.map((record, index) => (
                  <TableRow key={index}>
                    <TableCell>{record.type}</TableCell>
                    <TableCell>{record.subdomain || "(root)"}</TableCell>
                    <TableCell>{record.value}</TableCell>
                    <TableCell>
                      {new Date(record.last_seen).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {data.subdomains && data.subdomains.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2">Subdomains</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {data.subdomains.map((subdomain, index) => (
                <div
                  key={index}
                  className="p-2 bg-secondary/50 rounded-md text-sm"
                >
                  {subdomain}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  function renderIntelXStatistics() {
    if (!intelXResults) return null;

    // Custom Tooltip for Line Chart
    const LineTooltip = ({ active, payload, label }: any) => {
      if (active && payload && payload.length) {
        return (
          <div className="bg-gray-800 text-white p-3 rounded-lg shadow-lg border border-gray-700">
            <p className="font-medium">{dateFormatter(new Date(label))}</p>
            <p>Count: {payload[0].value}</p>
          </div>
        );
      }
      return null;
    };

    // // Custom Tooltip for Heatmap
    // const HeatmapTooltip = ({ active, payload }: any) => {
    //   if (active && payload && payload.length) {
    //     const data = payload[0].payload;
    //     return (
    //       <div className="bg-gray-800 text-white p-3 rounded-lg shadow-lg border border-gray-700">
    //         <p className="font-medium">{dateFormatter(data.date)}</p>
    //         <p>Occurrences: {data.count}</p>
    //       </div>
    //     );
    //   }
    //   return null;
    // };

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Data Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="w-full overflow-x-auto flex justify-center">
              <PieChart width={1050} height={400}>
                <Pie
                  data={formatBucketData()}
                  cx="50%"
                  cy="50%"
                  outerRadius={150}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) =>
                    `${name}: ${(percent * 100).toFixed(0)}%`
                  }
                >
                  {formatBucketData().map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend
                  layout="vertical"
                  align="right"
                  verticalAlign="middle"
                  wrapperStyle={{ paddingLeft: 20 }}
                />
              </PieChart>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-2">Media Types</h4>
                <ul className="space-y-1">
                  {intelXResults.media.map((m, i) => (
                    <li key={i} className="flex justify-between">
                      <span>{m.mediah}</span>
                      <span>{m.count}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">Data Types</h4>
                <ul className="space-y-1">
                  {intelXResults.type.map((t, i) => (
                    <li key={i} className="flex justify-between">
                      <span>{t.typeh}</span>
                      <span>{t.count}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Temporal Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-96">
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={formatDateData()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={dateFormatter}
                    angle={-30}

                    textAnchor="end"
                    stroke="#9CA3AF"
                  />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip content={<LineTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#3B82F6"
                    strokeWidth={4}
                    dot={{ fill: "#1D4ED8", strokeWidth: 1 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

          {/* <Card>
    <CardHeader>
      <CardTitle>Data Occurrence Heatmap</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="h-96">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 20, right: 20, bottom: 100, left: 50 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis
              dataKey="date"
              type="number"
              domain={['auto', 'auto']}
              tickFormatter={(timestamp) =>
                new Date(timestamp).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })
              }
              angle={-45}
              textAnchor="end"
              stroke="#9CA3AF"
              tick={{ dy: 20 }}
            />
            <YAxis 
              dataKey="count" 
              stroke="#9CA3AF"
              domain={[0, 'auto']}
              allowDecimals={false}
              label={{
                value: 'Occurrences',
                angle: -90,
                position: 'insideLeft',
                fill: '#9CA3AF',
                offset: 45
              }}
            />
            <Tooltip
              content={({ payload }) => {
                if (!payload?.length) return null;
                const data = payload[0].payload;
                return (
                  <div className="bg-gray-800 text-white p-3 rounded-lg shadow-lg border border-gray-700">
                    <p className="font-medium">
                      {new Date(data.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </p>
                    <p>Occurrences: {data.count}</p>
                  </div>
                );
              }}
            />
            <Scatter
              data={formatHeatmapData()}
              fill="#3B82F6"
              shape={({ cx, cy, payload }) => {
                const radius = Math.min(payload.count * 4, 20);
                return (
                  <circle
                    cx={cx}
                    cy={cy}
                    r={radius}
                    fill={
                      payload.count > 5 ? '#EF4444' : 
                      payload.count > 2 ? '#F59E0B' : 
                      '#3B82F6'
                    }
                    opacity={0.9}
                    stroke="#1D4ED8"
                    strokeWidth={1}
                  />
                );
              }}
            />
            <Legend 
              verticalAlign="top"
              wrapperStyle={{ paddingBottom: 20 }}
              payload={[
                { value: 'High Density (>5)', type: 'circle', color: '#EF4444' },
                { value: 'Medium Density (3-5)', type: 'circle', color: '#F59E0B' },
                { value: 'Low Density (1-2)', type: 'circle', color: '#3B82F6' }
              ]}
            />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </CardContent>
  </Card> */}

      </div>
    );
  }

  return (
    <div className="space-y-6">
      <LoadingScreen open={loading} />

      <Card>
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
            <Card>
              <CardHeader>
              </CardHeader>
              <CardContent>{renderIntelXStatistics()}</CardContent>
            </Card>
          )}

      {showResults && (
        <>
          {results && !results.error && (
            <Card>
              <CardHeader></CardHeader>
              <CardContent>
                {results.hostData && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-4">
                      Host Information
                    </h3>
                    {renderHostData(results.hostData)}
                  </div>
                )}

                {results.dnsData && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">
                      DNS Information
                    </h3>
                    {renderDNSData(results.dnsData)}
                  </div>
                )}
              </CardContent>
            </Card>
          )}


        </>
      )}
    </div>
  );
}
