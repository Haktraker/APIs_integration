"use server";

import { request } from "../client";
import { isValidIP, isValidDomain } from "@/lib/utils";

// Based on l9event schema from LeakIX API docs
export interface L9Event {
  event_type: string;
  event_source: string;
  event_pipeline: string[];
  event_fingerprint: string;
  ip: string;
  host: string;
  reverse: string;
  port: string;
  mac: string;
  vendor: string;
  transport: string[];
  protocol: string;
  http?: {
    root: string;
    url: string;
    status: number;
    length: number;
    header: {
      [key: string]: string;
    };
    title: string;
    favicon_hash: string;
  };
  summary: string;
  time: string;
  ssl?: {
    detected: boolean;
    enabled: boolean;
    jarm: string;
    cypher_suite: string;
    version: string;
    certificate: {
      cn: string;
      domain: string[];
      fingerprint: string;
      key_algo: string;
      key_size: number;
      issuer_name: string;
      not_before: string;
      not_after: string;
      valid: boolean;
    };
  };
  ssh?: {
    fingerprint: string;
    version: number;
    banner: string;
    motd: string;
  };
  service: {
    credentials: {
      noauth: boolean;
      username: string;
      password: string;
      key: string;
      raw: null | any;
    };
    software: {
      name: string;
      version: string;
      os: string;
      modules: null | string[];
      fingerprint: string;
    };
  };
  leak: {
    stage: string;
    type: string;
    severity: string;
    dataset: {
      rows: number;
      files: number;
      size: number;
      collections: number;
      infected: boolean;
      ransom_notes: null | string[];
    };
  };
  tags: string[];
  geoip?: {
    continent_name: string;
    region_iso_code: string;
    city_name: string;
    country_iso_code: string;
    country_name: string;
    region_name: string;
    location: {
      lat: number;
      lon: number;
    };
  };
  network?: {
    organization_name: string;
    asn: number;
    network: string;
  };
}

export interface LeakIXResponse {
  Services: L9Event[] | null;
  Leaks: L9Event[] | null;
}

export interface FormattedResult {
  title: string;
  summary: string;
  date: string;
  severity: string;
  location?: string;
  ip?: string;
  port?: string;
  software?: {
    name: string;
    version: string;
  };
  ssl?: {
    version: string;
    validUntil: string;
    issuer: string;
  };
  organization?: string;
}

export interface FormattedLeakIXResponse {
  formattedResults: FormattedResult[];
  error?: string;
}

export async function getFormattedLeakIXResults(query: string): Promise<FormattedLeakIXResponse> {
  const apiKey = process.env.LEAKX_API_KEY;
  
  if (!apiKey) {
    return {
      formattedResults: [],
      error: "LeakIX API key not configured"
    };
  }

  try {
    const isIP = isValidIP(query);
    const isDomain = isValidDomain(query);
    
    if (!isIP && !isDomain) {
      return {
        formattedResults: [],
        error: "Invalid IP or domain format"
      };
    }

    // Determine endpoint based on input type (host/:ip or domain/:domain)
    const endpoint = isIP ? `host/${query}` : `domain/${query}`;
    
    const data = await request<LeakIXResponse>(
      `https://leakix.net/${endpoint}`,
      {
        headers: {
          'accept': 'application/json',
          'api-key': apiKey
        }
      }
    );

    // If no services or leaks found
    if (!data.Services && !data.Leaks) {
      return {
        formattedResults: [],
        error: "No results found"
      };
    }

    const formattedResults: FormattedResult[] = [];

    // Format Services data
    if (data.Services) {
      const serviceResults = data.Services.map(service => ({
        title: service.http?.title || service.host || 'Unknown Service',
        summary: service.summary,
        date: new Date(service.time).toLocaleDateString(),
        severity: 'info',
        location: service.geoip ? 
          `${service.geoip.city_name || ''}, ${service.geoip.country_name || ''}`.trim().replace(/^,\s*/, '') : 
          undefined,
        ip: service.ip,
        port: service.port,
        software: service.service.software.name ? {
          name: service.service.software.name,
          version: service.service.software.version || 'Unknown'
        } : undefined,
        ssl: service.ssl ? {
          version: service.ssl.version,
          validUntil: new Date(service.ssl.certificate.not_after).toLocaleDateString(),
          issuer: service.ssl.certificate.issuer_name
        } : undefined,
        organization: service.network?.organization_name
      }));
      formattedResults.push(...serviceResults);
    }

    // Format Leaks data
    if (data.Leaks) {
      const leakResults = data.Leaks.map(leak => ({
        title: leak.http?.title || leak.host || 'Unknown Leak',
        summary: leak.summary,
        date: new Date(leak.time).toLocaleDateString(),
        severity: leak.leak.severity || 'unknown',
        location: leak.geoip ? 
          `${leak.geoip.city_name || ''}, ${leak.geoip.country_name || ''}`.trim().replace(/^,\s*/, '') : 
          undefined,
        ip: leak.ip,
        port: leak.port,
        software: undefined,
        ssl: undefined,
        organization: leak.network?.organization_name
      }));
      formattedResults.push(...leakResults);
    }

    return {
      formattedResults
    };

  } catch (error: any) {
    // Check for rate limiting error (429)
    if (error.message?.includes('429')) {
      return {
        formattedResults: [],
        error: 'Rate limited. Please wait before trying again.'
      };
    }

    console.error('LeakIX lookup error:', error);
    return {
      formattedResults: [],
      error: 'Failed to perform lookup'
    };
  }
} 