"use client"

import { useState } from "react"
import { Formik, Form, Field } from "formik"
import { toast } from "sonner"
import {
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  Legend,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  intelxSearch,
  intelxSearchResultWithFiles,
  type IntelXSearchResultWithFiles,
  type IntelXSearchStatisticResponse,
} from "@/lib/api"
import DashboardLayout from "../dashboard-layout"

const PAGE_SIZE = 50
const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#AF19FF"]

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

export default function DarkWebSearchPage() {
  const [intelXResults, setIntelXResults] = useState<IntelXSearchStatisticResponse | null>(null)
  const [intelXFileResults, setIntelXFileResults] = useState<IntelXSearchResultWithFiles | null>(null)
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [statusMessage, setStatusMessage] = useState("")
  const [selectedFile, setSelectedFile] = useState<{ name: string; content: string } | null>(null)
  const [currentPage, setCurrentPage] = useState({ files: 1 })
  const [abortController, setAbortController] = useState<AbortController | null>(null)

  const formatLineChartData = () => {
    if (!intelXResults?.date) return [];
    return intelXResults.date
      .map(d => ({
        date: new Date(d.day),
        count: d.count,
      }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  };

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
                  <RechartsTooltip />
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
                  <RechartsTooltip />
                  <Legend layout="vertical" verticalAlign="middle" align="right" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Temporal Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={formatLineChartData()} margin={{ top: 20, right: 20, bottom: 100, left: 40 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(date: Date) => dateFormatter(date)}
                  angle={-45}
                  textAnchor="end"
                  tick={{ fontSize: 12 }}
                />
                <YAxis />
                <RechartsTooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="count" stroke="#3B82F6" strokeWidth={2} dot={{ fill: "#1D4ED8" }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderIntelXFiles = () => {
    // Add more detailed debugging to understand the structure of intelXFileResults
    console.log('IntelX Files Debug:', { 
      hasResults: !!intelXFileResults,
      recordsLength: intelXFileResults?.results?.records?.length || 0,
      filesCount: intelXFileResults?.files ? Object.keys(intelXFileResults.files).length : 0,
      resultsStructure: intelXFileResults ? Object.keys(intelXFileResults) : [],
      error: intelXFileResults?.error
    });
    
    // Show error message if there's an error
    if (intelXFileResults?.error) {
      return (
        <Card>
          <CardHeader>
            <CardTitle>Files</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-500">Error: {intelXFileResults.error}</p>
          </CardContent>
        </Card>
      );
    }
    
    // Early return if no results are available
    if (!intelXFileResults || !intelXFileResults.results || !intelXFileResults.results.records) {
      return (
        <Card>
          <CardHeader>
            <CardTitle>Files</CardTitle>
          </CardHeader>
          <CardContent>
            <p>No files found.</p>
          </CardContent>
        </Card>
      );
    }
    
    const records = intelXFileResults.results.records;
    
    // Check if records array is empty
    if (records.length === 0) {
      return (
        <Card>
          <CardHeader>
            <CardTitle>Files</CardTitle>
          </CardHeader>
          <CardContent>
            <p>No files found in the search results.</p>
          </CardContent>
        </Card>
      );
    }
    
    // Calculate paginated records
    const paginatedRecords = records.slice(
      (currentPage.files - 1) * PAGE_SIZE,
      currentPage.files * PAGE_SIZE
    );
    
    return (
      <Card>
        <CardHeader>
          <CardTitle>Files ({records.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Filename</TableHead>
                <TableHead>Date Added</TableHead>
                <TableHead>Preview</TableHead>
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
                    className="cursor-pointer hover:bg-accent"
                  >
                    <TableCell className="underline text-blue-600">{record.name}</TableCell>
                    <TableCell>{new Date(record.added).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <pre className="text-xs line-clamp-2">
                        {content
                          ? content.substring(0, 200) + (content.length > 200 ? "..." : "")
                          : "N/A"}
                      </pre>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          {renderPagination("files", records.length)}
        </CardContent>
      </Card>
    );
  };
  
  // Separate function to determine if we should show the files section
  const shouldShowFilesSection = () => {
    if (!intelXFileResults) return false;
    
    // Show if we have records
    if (intelXFileResults.results?.records?.length > 0) return true;
    
    // Show if we have an error (to display the error message)
    if (intelXFileResults.error) return true;
    
    return false;
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold">Dark & Deep Web Search</h1>
          <p className="text-muted-foreground">
            Search the dark web, deep web, and data leaks for sensitive information related to your target.
          </p>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Search the Dark Web</CardTitle>
            <CardDescription>
              Enter a domain, email, username, or any other identifier to search across dark web sources.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <Formik
              initialValues={{ query: "" }}
              onSubmit={async (values, { setSubmitting }) => {
                if (!values.query) return;
                
                const controller = new AbortController();
                setAbortController(controller);
                setLoading(true);
                setProgress(0);
                setStatusMessage("Starting search...");
                
                // Reset previous results
                setIntelXResults(null);
                setIntelXFileResults(null);
                
                try {
                  // Step 1: Query IntelX
                  setStatusMessage("Querying Dark Web sources...");
                  const intelXResponse = await intelxSearch(values.query);
                  console.log('IntelX search response:', {
                    id: intelXResponse.id,
                    recordsCount: intelXResponse.results?.records?.length || 0,
                    hasError: !!intelXResponse.error
                  });
                  
                  if (intelXResponse.error) {
                    toast.error(`Search error: ${intelXResponse.error}`);
                    setProgress(100);
                    setStatusMessage("Search failed");
                    return;
                  }
                  
                  // Set the statistics even if there are no results
                  setIntelXResults(intelXResponse.statistics);
                  setProgress(60);

                  // Step 2: Fetch file contents if we have an ID
                  setStatusMessage("Fetching file contents...");
                  if (!intelXResponse.id) {
                    const errorMsg = "No search ID returned, cannot fetch files";
                    toast.error(errorMsg);
                    setIntelXFileResults({
                      results: { records: [], status: 0, id: "", count: 0 },
                      files: {},
                      error: errorMsg
                    });
                    setProgress(100);
                    setStatusMessage("Search partially complete (files unavailable)");
                    return;
                  }
                  
                  // Check if we have records before trying to fetch files
                  if (!intelXResponse.results || !intelXResponse.results.records || intelXResponse.results.records.length === 0) {
                    const warningMsg = "Search returned no records, skipping file content fetch";
                    toast.warning(warningMsg);
                    setIntelXFileResults({
                      results: { records: [], status: 0, id: intelXResponse.id, count: 0 },
                      files: {},
                      error: warningMsg
                    });
                    setProgress(100);
                    setStatusMessage("Search complete (no files found)");
                    return;
                  }
                  
                  // Fetch file contents
                  const intelXFilesResponse = await intelxSearchResultWithFiles(intelXResponse.id);
                  console.log('IntelX files response:', {
                    hasError: !!intelXFilesResponse.error,
                    recordsCount: intelXFilesResponse.results?.records?.length || 0,
                    filesCount: Object.keys(intelXFilesResponse.files || {}).length
                  });
                  
                  // Set the results even if there's an error
                  setIntelXFileResults(intelXFilesResponse);
                  
                  if (intelXFilesResponse.error) {
                    toast.error(`Files error: ${intelXFilesResponse.error}`);
                    setProgress(100);
                    setStatusMessage("Search partially complete (files failed)");
                    return;
                  }
                  
                  // All steps completed successfully
                  setProgress(100);
                  setStatusMessage("Search complete");
                  toast.success("Search completed successfully");
                } catch (err: any) {
                  if (err.name === "AbortError") {
                    setStatusMessage("Search cancelled");
                    toast.info("Search was cancelled");
                    return;
                  }
                  const errorObj = err instanceof Error 
                    ? { message: err.message, name: err.name } 
                    : { message: "Unknown error occurred", name: "UnknownError" };
                  const plainError = JSON.parse(JSON.stringify(errorObj));
                  toast.error(plainError.message);
                  console.error("Search error:", plainError);
                } finally {
                  setLoading(false);
                  setSubmitting(false);
                }
              }}
            >
              {({ isSubmitting }) => (
                <Form className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="query">Search Term</Label>
                    <Field
                      as={Input}
                      id="query"
                      name="query"
                      placeholder="Enter domain, email, username, or keyword..."
                      className="text-md py-6"
                    />
                  </div>
                  <Button type="submit" className="w-full" size="lg" disabled={loading || isSubmitting}>
                    {loading ? "Searching..." : "Search Dark Web"}
                  </Button>
                </Form>
              )}
            </Formik>
          </CardContent>
        </Card>

        {loading && (
          <Card className="shadow-lg">
            <CardContent className="pt-6">
              <Progress value={progress} className="h-2" />
              <p className="text-sm text-muted-foreground text-center mt-2">
                {statusMessage} {Math.floor(progress)}% complete
              </p>
              <Button 
                variant="outline" 
                onClick={() => abortController?.abort()} 
                className="w-full mt-4"
              >
                Cancel Search
              </Button>
            </CardContent>
          </Card>
        )}

        {intelXResults && (
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Dark Web Intelligence Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {renderIntelXStats()}
            </CardContent>
          </Card>
        )}

        {shouldShowFilesSection() && (
          <div className="mt-6">
            {renderIntelXFiles()}
          </div>
        )}

        {selectedFile && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-background rounded-lg p-6 max-w-2xl max-h-[80vh] overflow-auto">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-bold">{selectedFile.name}</h2>
                <Button variant="ghost" size="sm" onClick={() => setSelectedFile(null)}>
                  Close
                </Button>
              </div>
              <pre className="whitespace-pre-wrap text-sm">{selectedFile.content}</pre>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
