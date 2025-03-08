"use server";

import { request } from "../client";
import { isValidIP, isValidDomain } from "@/lib/utils";

// Base interfaces for LeakIX API responses
interface L9Event {
  event_type: string;
  ip: string;
  host: string;
  port: string;
  protocol: string;
  time: string;
  summary: string;
  http?: {
    url: string;
    status: number;
    title: string;
  };
  ssl?: {
    version: string;
    certificate: {
      cn: string;
      domain: string[];
      issuer_name: string;
      not_before: string;
      not_after: string;
      valid: boolean;
    };
  };
  service: {
    software: {
      name: string;
      version: string;
    };
  };
  geoip?: {
    continent_name: string;
    country_name: string;
    city_name: string;
  };
  network?: {
    organization_name: string;
    asn: number;
    network: string;
  };
}

interface LeakIXResponse {
  Services: L9Event[] | null;
  Leaks: L9Event[] | null;
}

interface FormattedLeakIXResult {
  ips: string[];
  domains: string[];
  error?: string;
}

// Original interface for backward compatibility
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

/**
 * Original function for backward compatibility
 * @param query - IP or domain to search for
 * @returns Formatted results for display
 */
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
        software: service.service?.software.name ? {
          name: service.service?.software.name,
          version: service.service?.software.version || 'Unknown'
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
        severity: 'medium',
        location: leak.geoip ? 
          `${leak.geoip.city_name || ''}, ${leak.geoip.country_name || ''}`.trim().replace(/^,\s*/, '') : 
          undefined,
        ip: leak.ip,
        port: leak.port,
        software: leak.service?.software.name ? {
          name: leak.service?.software.name,
          version: leak.service?.software.version || 'Unknown'
        } : undefined,
        ssl: leak.ssl ? {
          version: leak.ssl.version,
          validUntil: new Date(leak.ssl.certificate.not_after).toLocaleDateString(),
          issuer: leak.ssl.certificate.issuer_name
        } : undefined,
        organization: leak.network?.organization_name
      }));
      formattedResults.push(...leakResults);
    }

    return {
      formattedResults
    };

  } catch (error: any) {
    // Handle rate limiting
    if (error.message?.includes('429')) {
      return {
        formattedResults: [],
        error: 'Rate limited. Please wait before trying again.'
      };
    }

    return {
      formattedResults: [],
      error: error.message || 'Failed to perform lookup'
    };
  }
}

/**
 * Get formatted results for a host (IP) from LeakIX
 * @param ip - IP address to search for
 * @returns Formatted results containing unique IPs and domains
 */
export async function getHostResults(ip: string): Promise<FormattedLeakIXResult> {
  const apiKey = process.env.LEAKX_API_KEY;

  if (!apiKey) {
    return {
      ips: [],
      domains: [],
      error: "LeakIX API key not configured"
    };
  }

  try {
    const data = await request<LeakIXResponse>(
      `https://leakix.net/host/${ip}`,
      {
        headers: {
          'accept': 'application/json',
          'api-key': apiKey
        }
      }
    );

    return formatResults(data);
  } catch (error: any) {
    // Handle rate limiting
    if (error.message?.includes('429')) {
      return {
        ips: [],
        domains: [],
        error: 'Rate limited. Please wait before trying again.'
      };
    }

    return {
      ips: [],
      domains: [],
      error: error.message || 'Failed to perform host lookup'
    };
  }
}

/**
 * Get formatted results for a domain from LeakIX
 * @param domain - Domain to search for
 * @returns Formatted results containing unique IPs and domains
 */
export async function getDomainResults(domain: string): Promise<FormattedLeakIXResult> {
  const apiKey = process.env.LEAKX_API_KEY;

  if (!apiKey) {
    return {
      ips: [],
      domains: [],
      error: "LeakIX API key not configured"
    };
  }

  try {
    const data = await request<LeakIXResponse>(
      `https://leakix.net/domain/${domain}`,
      {
        headers: {
          'accept': 'application/json',
          'api-key': apiKey
        }
      }
    );

    return formatResults(data);
  } catch (error: any) {
    // Handle rate limiting
    if (error.message?.includes('429')) {
      return {
        ips: [],
        domains: [],
        error: 'Rate limited. Please wait before trying again.'
      };
    }

    return {
      ips: [],
      domains: [],
      error: error.message || 'Failed to perform domain lookup'
    };
  }
}

/**
 * Format LeakIX response to extract unique IPs and domains
 * @param data - Raw LeakIX API response
 * @returns Formatted results with unique IPs and domains
 */
function formatResults(data: LeakIXResponse): FormattedLeakIXResult {
  const uniqueIps = new Set<string>();
  const uniqueDomains = new Set<string>();

  // Process Services
  if (data.Services) {
    for (const service of data.Services) {
      if (service.ip) uniqueIps.add(service.ip);
      if (service.host) uniqueDomains.add(service.host);
      if (service.ssl?.certificate?.domain) {
        service.ssl.certificate.domain.forEach(d => uniqueDomains.add(d));
      }
    }
  }

  // Process Leaks
  if (data.Leaks) {
    for (const leak of data.Leaks) {
      if (leak.ip) uniqueIps.add(leak.ip);
      if (leak.host) uniqueDomains.add(leak.host);
      if (leak.ssl?.certificate?.domain) {
        leak.ssl.certificate.domain.forEach(d => uniqueDomains.add(d));
      }
    }
  }

  return {
    ips: Array.from(uniqueIps),
    domains: Array.from(uniqueDomains)
  };
} 