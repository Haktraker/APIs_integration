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

async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeout = 30000
): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}

export async function searchShodan(query: string): Promise<ShodanResponse> {
  try {
    const isIP = isValidIP(query);
    const isDomain = isValidDomain(query);
    if (!isIP && !isDomain) return { error: "Invalid IP or domain format" };

    let hostData: ShodanHostResponse | undefined;
    let dnsData: ShodanDNSResponse | undefined;
    if (isIP) {
      const response = await fetchWithTimeout(
        `https://api.shodan.io/shodan/host/${query}?key=${process.env.SHODAN_API_KEY}`
      );
      if (!response.ok) throw new Error(response.statusText);
      hostData = await response.json();
    }
    if (isDomain) {
      const response = await fetchWithTimeout(
        `https://api.shodan.io/dns/domain/${query}?key=${process.env.SHODAN_API_KEY}`
      );
      if (!response.ok) throw new Error(response.statusText);
      dnsData = await response.json();
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

async function intelXFetch<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const xKey = process.env.X_KEY;
  if (!xKey) throw new Error("IntelX API key not configured");
  const headers = {
    "x-key": xKey,
    Accept: "*/*",
    "Accept-Encoding": "gzip, deflate, br",
    Connection: "keep-alive",
  };
  const response = await fetchWithTimeout(url, { ...options, headers }, 30000);
  if (!response.ok) throw new Error(response.statusText);
  return (await response.json()) as T;
}

export async function intelxSearch(
  term: string,
  sort: number = 4
): Promise<IntelXResponse> {
  try {
    const initResponse = await fetchWithTimeout(
      "https://2.intelx.io/intelligent/search",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "*/*",
          "Accept-Encoding": "gzip, deflate, br",
          Connection: "keep-alive",
          "x-key": process.env.X_KEY!,
        },
        body: JSON.stringify({ term, sort }),
      }
    );
    if (!initResponse.ok) throw new Error(initResponse.statusText);
    const initData: IntelXSearchInitialResponse = await initResponse.json();
    const id = initData.id;
    const [results, statistics] = await Promise.all([
      intelXFetch<IntelXSearchResultResponse>(
        `https://2.intelx.io/intelligent/search/result?id=${id}`
      ),
      intelXFetch<IntelXSearchStatisticResponse>(
        `https://2.intelx.io/intelligent/search/statistic?id=${id}`
      ),
    ]);

    console.log(results.records.length, "results");
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

export async function intelxSearchResultWithFiles(
  id: string
): Promise<IntelXSearchResultWithFiles> {
  try {
    const PAGE_SIZE = 100;
    let offset = 0;
    let allRecords: IntelXFileRecord[] = [];
    let page: IntelXSearchResultResponse;
    do {
      const url = `https://2.intelx.io/intelligent/search/result?id=${id}`;
      page = await intelXFetch<IntelXSearchResultResponse>(url);
      if (page.records) {
        allRecords = allRecords.concat(page.records);
      }
      offset += PAGE_SIZE;
    } while (page.count > offset);

    const results: IntelXSearchResultResponse = {
      records: allRecords,
      status: page.status,
      id: id,
      count: allRecords.length,
    };

    const files: { [storageid: string]: string } = {};
    await Promise.all(
      results.records.map(async (record) => {
        try {
          const url = `https://2.intelx.io/file/view?license=api&f=0&storageid=${encodeURIComponent(
            record.storageid
          )}&bucket=${encodeURIComponent(record.bucket)}&k=${
            process.env.X_KEY
          }`;
          const response = await fetchWithTimeout(url);
          if (!response.ok) {
            files[record.storageid] = "Content unavailable";
          } else {
            files[record.storageid] = await response.text();
          }
        } catch (err) {
          files[record.storageid] = "Content unavailable";
        }
      })
    );

    return { results, files };
  } catch (error: any) {
    return {
      results: { records: [], status: 0, id: id, count: 0 },
      files: {},
      error: error.message || "Failed to fetch IntelX search result.",
    };
  }
}
