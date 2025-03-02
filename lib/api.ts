"use server";
import axios from "axios";

/* ==================== Shodan Section ==================== */

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
  error?: string;
}

interface ShodanResponse {
  hostData?: ShodanHostResponse;
  dnsData?: ShodanDNSResponse;
  error?: string;
}

const isValidIP = (input: string) =>
  /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(input);
const isValidDomain = (input: string) =>
  /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i.test(input);

async function fetchShodanData<T>(url: string): Promise<T> {
  const apiKey = process.env.SHODAN_API_KEY;
  if (!apiKey) throw new Error("Shodan API key not configured");
  try {
    const response = await axios.get<T>(url);
    return response.data;
  } catch (err: any) {
    if (err.response && err.response.status === 404) {
      throw new Error("Resource not found");
    }
    throw new Error(`API Error: ${err.response?.statusText || err.message}`);
  }
}

export async function searchShodan(query: string): Promise<ShodanResponse> {
  try {
    const isIP = isValidIP(query);
    const isDomain = isValidDomain(query);
    if (!isIP && !isDomain) {
      return { error: "Invalid IP or domain format" };
    }
    const [hostData, dnsData] = await Promise.all([
      isIP
        ? fetchShodanData<ShodanHostResponse>(
            `https://api.shodan.io/shodan/host/${query}?key=${process.env.SHODAN_API_KEY}`
          )
        : Promise.resolve(undefined),
      isDomain
        ? fetchShodanData<ShodanDNSResponse>(
            `https://api.shodan.io/dns/domain/${query}?key=${process.env.SHODAN_API_KEY}`
          )
        : Promise.resolve(undefined),
    ]);
    return { hostData, dnsData };
  } catch (error: any) {
    console.error("Shodan search failed:", error);
    return {
      error: error.message || "Failed to fetch Shodan data. Please try again.",
    };
  }
}

/* ==================== IntelX Section ==================== */

interface IntelXSearchInitialResponse {
  id: string;
  status?: number;
  name?: string;
}

interface IntelXFileRecord {
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
}

interface IntelXSearchResultResponse {
  records: IntelXFileRecord[];
  status: number;
  id: string;
  count: number;
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

interface IntelXResponse {
  id: string;
  results: IntelXSearchResultResponse;
  statistics: IntelXSearchStatisticResponse;
  error?: string;
}

interface IntelXSearchResultWithFiles {
  results: IntelXSearchResultResponse;
  files: { [storageid: string]: string };
  error?: string;
}

/**
 * Generic fetch for IntelX requests using axios.
 */
async function intelXFetch<T>(url: string, config = {}): Promise<T> {
  const xKey = process.env.X_KEY;
  if (!xKey) throw new Error("IntelX API key not configured");
  try {
    const response = await axios.get<T>(url, {
      headers: { "x-key": xKey },
      ...config,
    });
    return response.data;
  } catch (err: any) {
    throw new Error(`IntelX API Error: ${err.response?.statusText || err.message}`);
  }
}

/**
 * Helper to read full file content using the read endpoint.
 * Endpoint: https://2.intelx.io/file/read?storageid=xxxx&type=0&bucket=xxxx
 */
async function readIntelXFile(
  storageid: string,
  bucket: string
): Promise<string> {
  const url = `https://2.intelx.io/file/read?storageid=${storageid}&type=0&bucket=${bucket}`;
  return intelXFetch<string>(url);
}

/**
 * Helper to get a file preview using the preview endpoint.
 * Endpoint: https://2.intelx.io/file/preview?sid=xxxx&f=0&l=8&c=1&m=32&b=xxxx&k=${process.env.X_KEY}
 */
async function previewIntelXFile(
  storageid: string,
  bucket: string
): Promise<string> {
  const url = `https://2.intelx.io/file/preview?sid=${storageid}&f=0&l=8&c=1&m=32&b=${bucket}&k=${process.env.X_KEY}`;
  return intelXFetch<string>(url);
}

/**
 * Retrieves the IntelX search results using the provided id and then, for each record,
 * it fetches a file preview using the preview endpoint—without filtering by file extension.
 */
export async function intelxSearchResultWithFiles(
  id: string,
  term: string
): Promise<IntelXSearchResultWithFiles> {
  try {
    const results = await intelXFetch<IntelXSearchResultResponse>(
      `https://2.intelx.io/intelligent/search/result?id=${id}`
    );

    const files: { [storageid: string]: string } = {};

    await Promise.all(
      results.records.map(async (record) => {
        try {
          const previewContent = await previewIntelXFile(record.storageid, record.bucket);
          files[record.storageid] = previewContent;
        } catch (fileErr) {
          // Ignore errors for individual files.
        }
      })
    );

    // Optionally, you could filter records based on the preview content if desired.
    // Here we return all records along with their preview.
    return {
      results,
      files,
    };
  } catch (error: any) {
    return {
      results: { records: [], status: 0, id: "", count: 0 },
      files: {},
      error: error.message || "Failed to fetch IntelX search result.",
    };
  }
}

export async function intelxSearch(term: string): Promise<IntelXResponse> {
  try {
    const initResponse = await axios.post<IntelXSearchInitialResponse>(
      "https://2.intelx.io/intelligent/search",
      { term },
      {
        headers: {
          "Content-Type": "application/json",
          "x-key": process.env.X_KEY!,
        },
      }
    );
    const { id } = initResponse.data;
    const [results, statistics] = await Promise.all([
      intelXFetch<IntelXSearchResultResponse>(
        `https://2.intelx.io/intelligent/search/result?id=${id}`
      ),
      intelXFetch<IntelXSearchStatisticResponse>(
        `https://2.intelx.io/intelligent/search/statistic?id=${id}`
      ),
    ]);
    return { id, results, statistics };
  } catch (error: any) {
    return {
      id: "",
      results: { records: [], status: 0, id: "", count: 0 },
      statistics: {} as IntelXSearchStatisticResponse,
      error: error.message || "Failed to perform IntelX search",
    };
  }
}

/* ==================== LeakX Section ==================== */

interface LeakXService {
  port: number;
  protocol: string;
  service_name: string;
  software?: string;
  version?: string;
  vulnerabilities?: string[];
}

interface LeakXLeak {
  leak_type: string;
  description: string;
  entries?: number;
  severity?: "low" | "medium" | "high";
  last_seen?: string;
}

interface LeakXResponse {
  services?: LeakXService[];
  leaks?: LeakXLeak[];
  message?: string;
  error?: string;
}

async function leakXFetch<T>(endpoint: string): Promise<T> {
  const apiKey = process.env.LEAKIX_API_KEY;
  if (!apiKey) throw new Error("LeakX API key not configured");
  try {
    const response = await axios.get<T>(`https://leakix.net/${endpoint}`, {
      headers: {
        "api-key": apiKey,
        Accept: "application/json",
      },
    });
    return response.data;
  } catch (err: any) {
    if (err.response && err.response.status === 404) {
      throw new Error("Resource not found");
    }
    throw new Error(`API Error: ${err.response?.statusText || err.message}`);
  }
}

export async function searchLeakX(domain: string): Promise<LeakXResponse> {
  try {
    const data = await leakXFetch<{
      Services?: LeakXService[];
      Leaks?: LeakXLeak[];
    }>(`domain/${domain}`);
    if (!data.Services?.length && !data.Leaks?.length) {
      return { message: "No services or leaks found for this domain" };
    }
    return {
      services: data.Services,
      leaks: data.Leaks,
    };
  } catch (error: any) {
    if (error.message.includes("Resource not found")) {
      return { message: "No results found for this domain" };
    }
    return {
      error: error.message || "Failed to fetch LeakX data. Please try again later.",
    };
  }
}
