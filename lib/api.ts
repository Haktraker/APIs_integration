"use server";

interface ShodanDNSRecord {
  subdomain: string;
  type: string;
  value: string;
  last_seen: string;
}

export interface ShodanDNSResponse {
  domain: string;
  tags?: string[];
  data: ShodanDNSRecord[];
  subdomains?: string[];
  more?: boolean;
}

export interface ShodanHostResponse {
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

export interface ShodanResponse {
  hostData?: ShodanHostResponse;
  dnsData?: ShodanDNSResponse;
  error?: string;
}

const isValidIP = (input: string) =>
  /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(input);
const isValidDomain = (input: string) =>
  /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i.test(input);

/**
 * API client for making fetch requests with proper error handling
 */
const apiClient = {
  /**
   * Make a GET request to the specified URL
   */
  async get<T>(url: string, options: RequestInit = {}): Promise<T> {
    try {
      const response = await fetch(url, {
        ...options,
        method: 'GET',
        next: { revalidate: 0 }
      });
      
      if (!response.ok) {
        throw new Error(response.statusText || `Request failed with status ${response.status}`);
      }
      
      return await response.json() as T;
    } catch (error: any) {
      console.error(`GET request failed: ${url}`, error);
      throw error;
    }
  },
  
  /**
   * Make a POST request to the specified URL
   */
  async post<T>(url: string, data: any, options: RequestInit = {}): Promise<T> {
    try {
      const response = await fetch(url, {
        ...options,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        body: JSON.stringify(data),
        next: { revalidate: 0 }
      });
      
      if (!response.ok) {
        throw new Error(response.statusText || `Request failed with status ${response.status}`);
      }
      
      return await response.json() as T;
    } catch (error: any) {
      console.error(`POST request failed: ${url}`, error);
      throw error;
    }
  },
  
  /**
   * Make a request with custom options
   */
  async request<T>(url: string, options: RequestInit = {}): Promise<T> {
    try {
      const response = await fetch(url, {
        ...options,
        next: { revalidate: 0 }
      });
      
      if (!response.ok) {
        throw new Error(response.statusText || `Request failed with status ${response.status}`);
      }
      
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json() as T;
      } else {
        const text = await response.text();
        return text as unknown as T;
      }
    } catch (error: any) {
      console.error(`Request failed: ${url}`, error);
      throw error;
    }
  }
};

export async function searchShodan(query: string): Promise<ShodanResponse> {
  try {
    const isIP = isValidIP(query);
    const isDomain = isValidDomain(query);
    
    if (!isIP && !isDomain) {
      return { error: "Invalid IP or domain format" };
    }

    let hostData: ShodanHostResponse | undefined;
    let dnsData: ShodanDNSResponse | undefined;
    
    if (isIP) {
      hostData = await apiClient.get<ShodanHostResponse>(
        `https://api.shodan.io/shodan/host/${query}?key=${process.env.SHODAN_API_KEY}`
      );
    }
    
    if (isDomain) {
      dnsData = await apiClient.get<ShodanDNSResponse>(
        `https://api.shodan.io/dns/domain/${query}?key=${process.env.SHODAN_API_KEY}`
      );
    }
    
    return { hostData, dnsData };
  } catch (err: any) {
    return {
      error: err.message || "Failed to fetch Shodan data. Please try again.",
    };
  }
}

export interface IntelXSearchInitialResponse {
  id: string;
  status?: number;
  name?: string;
}

export interface IntelXFileRecord {
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

export interface IntelXSearchResultResponse {
  records: IntelXFileRecord[];
  status: number;
  id: string;
  count: number;
}

export interface IntelXSearchStatisticResponse {
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

export interface IntelXResponse {
  id: string;
  results: IntelXSearchResultResponse;
  statistics: IntelXSearchStatisticResponse;
  error?: string;
}

export interface IntelXSearchResultWithFiles {
  results: IntelXSearchResultResponse;
  files: { [storageid: string]: string };
  error?: string;
}

// Add at the top of the file with other interfaces
interface CacheEntry {
  timestamp: number;
  data: IntelXResponse;
}

// Add cache object outside of functions to persist between requests
const searchCache: { [key: string]: CacheEntry } = {};
const CACHE_DURATION = 1000 * 60 * 30; // 30 minutes cache duration

/**
 * Helper function for IntelX API requests
 */
const intelXFetch = async <T>(url: string, options: RequestInit = {}): Promise<T> => {
  const xKey = process.env.X_KEY;
  
  if (!xKey) {
    throw new Error("IntelX API key not configured");
  }
  
  const headers = {
    "x-key": xKey,
    "Accept": "*/*",
    "Accept-Encoding": "gzip, deflate, br",
    "Connection": "keep-alive",
    ...options.headers,
  };
  
  return apiClient.request<T>(url, { ...options, headers });
};

// Cache to store search results by ID
const searchResultsCache: Record<string, IntelXSearchResultResponse> = {};

export async function intelxSearch(
  term: string,
  sort: number = 4
): Promise<IntelXResponse> {
  // Check cache first
  const cacheKey = `${term}_${sort}`;
  const cachedResult = searchCache[cacheKey];
  const now = Date.now();

  // If we have a valid cache entry, return it
  if (cachedResult && (now - cachedResult.timestamp) < CACHE_DURATION) {
    console.log('Returning cached results for:', term);
    return cachedResult.data;
  }

  try {
    const initData = await apiClient.post<IntelXSearchInitialResponse>(
      "https://2.intelx.io/intelligent/search",
      { term, sort },
      {
        headers: {
          "x-key": process.env.X_KEY!,
        }
      }
    );
    
    const id = initData.id;
    
    const [results, statistics] = await Promise.all([
      intelXFetch<IntelXSearchResultResponse>(
        `https://2.intelx.io/intelligent/search/result?id=${id}`
      ),
      intelXFetch<IntelXSearchStatisticResponse>(
        `https://2.intelx.io/intelligent/search/statistic?id=${id}`
      ),
    ]);

    const response: IntelXResponse = { id, results, statistics };

    // Cache the new results
    searchCache[cacheKey] = {
      timestamp: now,
      data: response
    };
    
    if (results.records && results.records.length > 0) {
      searchResultsCache[id] = results;
    }
    
    return response;
  } catch (error: any) {
    // If we have expired cache and the request fails, return expired cache
    if (cachedResult) {
      console.log('Request failed, returning expired cache for:', term);
      return cachedResult.data;
    }

    return {
      id: "",
      results: { records: [], status: 0, id: "", count: 0 },
      statistics: {} as IntelXSearchStatisticResponse,
      error: error.message || "Failed to perform IntelX search",
    };
  }
}

// Also cache the file results
const fileResultsCache: { [key: string]: { timestamp: number, data: IntelXSearchResultWithFiles } } = {};

export async function intelxSearchResultWithFiles(
  id: string
): Promise<IntelXSearchResultWithFiles> {
  // Check file results cache
  const cachedResult = fileResultsCache[id];
  const now = Date.now();

  if (cachedResult && (now - cachedResult.timestamp) < CACHE_DURATION) {
    console.log('Returning cached file results for ID:', id);
    return cachedResult.data;
  }

  try {
    console.log('Starting intelxSearchResultWithFiles with ID:', id);
    let allRecords: IntelXFileRecord[] = [];
    let page: IntelXSearchResultResponse;
    
    const url = `https://2.intelx.io/intelligent/search/result?id=${id}`;
    console.log('Fetching IntelX results from:', url);
    
    try {
      const fullUrl = `${url}`;
      page = await intelXFetch<IntelXSearchResultResponse>(fullUrl);
      console.log('Received page with records count:', page.records?.length || 0);
    } catch (error) {
      if (searchResultsCache[id]) {
        page = searchResultsCache[id];
      } else {
        throw new Error('Failed to fetch results and no cached results available');
      }
    }
    
    if (!page.records || page.records.length === 0) {
      if (searchResultsCache[id]) {
        page = searchResultsCache[id];
      }
    }
    
    if (page.records) {
      allRecords = page.records.filter(record => {
        const fileName = record.name.toLowerCase();
        return fileName.endsWith('.txt') || fileName.endsWith('.text');
      });
    }

    const results: IntelXSearchResultResponse = {
      records: allRecords,
      status: page.status,
      id: id,
      count: allRecords.length,
    };

    if (allRecords.length === 0) {
      return { 
        results, 
        files: {},
        error: "No text files found to fetch contents for"
      };
    }

    const files: { [storageid: string]: string } = {};
    const BATCH_SIZE = 10;
    const batches = [];
    
    for (let i = 0; i < results.records.length; i += BATCH_SIZE) {
      batches.push(results.records.slice(i, i + BATCH_SIZE));
    }
    
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      await Promise.all(
        batch.map(async (record) => {
          try {
            if (!record.name.toLowerCase().match(/\.(txt|text)$/)) {
              return;
            }

            const url = `https://2.intelx.io/file/view?license=api&f=0&storageid=${encodeURIComponent(
              record.storageid
            )}&bucket=${encodeURIComponent(record.bucket)}&k=${
              process.env.X_KEY
            }`;
            
            const content = await apiClient.request<string>(url);
            
            if (typeof content === 'string') {
              files[record.storageid] = content;
            }
          } catch (err) {
            console.error(`Failed to fetch content for text file ${record.name}:`, err);
            files[record.storageid] = "Content unavailable";
          }
        })
      );
    }

    const response = { results, files };

    // Cache the file results
    fileResultsCache[id] = {
      timestamp: now,
      data: response
    };

    return response;
  } catch (error: any) {
    // If we have expired cache and the request fails, return expired cache
    if (cachedResult) {
      console.log('Request failed, returning expired cache for ID:', id);
      return cachedResult.data;
    }

    return {
      results: { records: [], status: 0, id: id, count: 0 },
      files: {},
      error: error.message || "Failed to fetch IntelX text file contents.",
    };
  }
}

// LeakIX Types
interface LeakIXResult {
  event_type: string;
  ip: string;
  host: string;
  port: string;
  summary: string;
  time: string;
  leak: {
    stage: string;
    severity: string;
    dataset: {
      rows: number;
      files: number;
      size: number;
    }
  };
  http?: {
    url: string;
    title: string;
  };
  geoip?: {
    country_name: string;
    city_name: string;
  };
}

interface LeakIXError {
  error: string;
}

interface LeakIXResponse {
  results: LeakIXResult[];
  error?: string;
  total?: number;
}

// LeakIX Search Function
export async function leakIXSearch(query: string, page: number = 0): Promise<LeakIXResponse> {
  const apiKey = process.env.LEAKX_API_KEY;
  
  if (!apiKey) {
    return {
      results: [],
      error: "LeakIX API key not configured"
    };
  }

  try {
    const response = await fetch(
      `https://leakix.net/search?scope=leak&page=${page}&q=${encodeURIComponent(query)}`,
      {
        headers: {
          'accept': 'application/json',
          'api-key': apiKey
        },
        next: { revalidate: 0 } // Disable cache for this request
      }
    );

    // Handle rate limiting
    if (response.status === 429) {
      const waitTime = response.headers.get('x-limited-for');
      return {
        results: [],
        error: `Rate limited. Please wait ${waitTime} before trying again.`
      };
    }

    if (!response.ok) {
      return {
        results: [],
        error: ` error: ${response.statusText}`
      };
    }

    const data = await response.json() as LeakIXResult[];

    // Transform the response to match our expected format
    return {
      results: data,
      total: data.length,
    };

  } catch (error) {
    console.error('LeakIX search error:', error);
    return {
      results: [],
      error: 'Failed to perform LeakIX search'
    };
  }
}

// Helper function to get formatted results
export async function getFormattedLeakIXResults(query: string): Promise<{
  formattedResults: Array<{
    title: string;
    summary: string;
    date: string;
    severity: string;
    location?: string;
  }>;
  error?: string;
}> {
  const response = await leakIXSearch(query);

  if (response.error) {
    return {
      formattedResults: [],
      error: response.error
    };
  }

  const formattedResults = response.results.map(result => ({
    title: result.http?.title || result.host || 'Untitled',
    summary: result.summary,
    date: new Date(result.time).toLocaleDateString(),
    severity: result.leak.severity,
    location: result.geoip ? 
      `${result.geoip.city_name}, ${result.geoip.country_name}`.trim() : 
      undefined
  }));

  return {
    formattedResults
  };
}
