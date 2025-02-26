"use server"

// =============== Shodan Interfaces & Implementation ===============
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

// Unified network validation
const isValidIP = (input: string) => /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(input);
const isValidDomain = (input: string) => 
  /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i.test(input);

async function fetchShodanData<T>(url: string): Promise<T> {
  const apiKey = process.env.SHODAN_API_KEY;
  if (!apiKey) throw new Error("Shodan API key not configured");
  
  const response = await fetch(url);
  if (!response.ok) {
    if (response.status === 404) throw new Error("Resource not found");
    throw new Error(`API Error: ${response.statusText}`);
  }
  return response.json();
}

export async function searchShodan(query: string): Promise<ShodanResponse> {
  try {
    const isIP = isValidIP(query);
    const isDomain = isValidDomain(query);
    
    if (!isIP && !isDomain) {
      return { error: "Invalid IP or domain format" };
    }

    const [hostData, dnsData] = await Promise.all([
      isIP ? fetchShodanData<ShodanHostResponse>(
        `https://api.shodan.io/shodan/host/${query}?key=${process.env.SHODAN_API_KEY}`
      ) : Promise.resolve(undefined),
      
      isDomain ? fetchShodanData<ShodanDNSResponse>(
        `https://api.shodan.io/dns/domain/${query}?key=${process.env.SHODAN_API_KEY}`
      ) : Promise.resolve(undefined)
    ]);

    return { hostData, dnsData };
  } catch (error: any) {
    console.error("Shodan search failed:", error);
    return {
      error: error.message || "Failed to fetch Shodan data. Please try again."
    };
  }
}

// =============== IntelX Interfaces & Implementation ===============
interface IntelXSearchInitialResponse {
  id: string;
  status?: number;
  name?: string;
}

interface IntelXRecordPreview {
  preview: string;
  date: string;
  bucket: string;
  typeh: string;
  mediah: string;
  size: string;
}

interface IntelXSearchResultResponse {
  records: IntelXRecordPreview[];
  status: number;
  id: string;
  count: number;
}

interface IntelXSearchStatisticResponse {
  date: Array<{ day: string; count: number }>;
  type: Array<{ type: number; typeh: string; count: number }>;
  media: Array<{ media: number; mediah: string; count: number; filter: boolean }>;
  bucket: Array<{ bucket: string; bucketh: string; count: number; filter: boolean }>;
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

async function intelXFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const xKey = process.env.X_KEY;
  if (!xKey) throw new Error("IntelX API key not configured");
  
  const response = await fetch(url, {
    ...init,
    headers: { ...init?.headers, "x-key": xKey }
  });
  
  if (!response.ok) {
    throw new Error(`IntelX API Error: ${response.statusText}`);
  }
  return response.json();
}

export async function intelxSearch(term: string): Promise<IntelXResponse> {
  try {
    // Phase 1: Initiate search
    const { id } = await intelXFetch<IntelXSearchInitialResponse>(
      "https://2.intelx.io/intelligent/search",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" ,"x-key":`${process.env.X_KEY}`},
        body: JSON.stringify({ term })
      }
    );

    // Phase 2: Fetch results and statistics in parallel
    const [results, statistics] = await Promise.all([
      intelXFetch<IntelXSearchResultResponse>(
        `https://2.intelx.io/intelligent/search/result?id=${id}&limit=10&statistics=1&previewlines=8`
      ),
      intelXFetch<IntelXSearchStatisticResponse>(
        `https://2.intelx.io/intelligent/search/statistic?id=${id}&k=${process.env.X_KEY}`
      )
    ]);


    return { id, results, statistics };
  } catch (error: any) {
    console.error("IntelX search failed:", error);
    return {
      id: "",
      results: { records: [], status: 0, id: "", count: 0 },
      statistics: {} as IntelXSearchStatisticResponse,
      error: error.message || "Failed to perform IntelX search"
    };
  }
}


// =============== LeakX Interfaces & Implementation ===============
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
  severity?: 'low' | 'medium' | 'high';
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
  
  const response = await fetch(`https://leakix.net/${endpoint}`, {
    headers: {
      "api-key": apiKey,
      "Accept": "application/json",
    }
  });

  if (!response.ok) {
    if (response.status === 404) throw new Error("Resource not found");
    throw new Error(`API Error: ${response.statusText} (${response.status})`);
  }

  return response.json();
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
    console.error("LeakX search failed:", error);
    
    if (error.message.includes("Resource not found")) {
      return { message: "No results found for this domain" };
    }

    return {
      error: error.message || "Failed to fetch LeakX data. Please try again later."
    };
  }
}