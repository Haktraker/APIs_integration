// src/types.ts

export interface ShodanDNSRecord {
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
  }
  
  export interface ShodanResponse {
    hostData?: ShodanHostResponse;
    dnsData?: ShodanDNSResponse;
    error?: string;
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
  