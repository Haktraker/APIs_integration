"use server";

import { request } from "../client";
import { isValidIP, isValidDomain } from "@/lib/utils";

// Base interfaces for LeakIX API responses
interface GeoIP {
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
}

interface Network {
  organization_name: string;
  asn: number;
  network: string;
}

interface Certificate {
  cn: string;
  domain: string[];
  issuer_name: string;
  not_before: string;
  not_after: string;
  valid: boolean;
}

interface SSL {
  version: string;
  certificate: Certificate;
}

interface HTTP {
  url: string;
  status: number;
  title: string;
  server?: string;
}

interface EventItem {
  event_type: string;
  event_source: string;
  ip: string;
  host: string;
  port: string;
  protocol: string;
  time: string;
  summary: string;
  http?: HTTP;
  ssl?: SSL;
  tags?: string[];
  geoip?: GeoIP;
  network?: Network;
  service?: {
    software?: {
      name?: string;
      version?: string;
    }
  };
  leak?: {
    severity?: string;
    type?: string;
  };
  [key: string]: any;
}

interface LeakItem {
  Summary?: string;
  Ip: string;
  resource_id: string;
  open_ports: string[];
  leak_count?: number;
  leak_event_count?: number;
  events: EventItem[];
  plugins?: string[];
  geoip?: GeoIP;
  network?: Network;
  creation_date: string;
  update_date: string;
  fresh: boolean;
  record_age: number;
  hidden: boolean;
}

interface LeakIXResponse {
  Services: any[] | null;
  Leaks: LeakItem[] | null;
}

interface DetailedLeakIXResult {
  leaks: LeakItem[] | null;
  error?: string;
}

// Original interface for backward compatibility
export interface FormattedResult {
  title: string;
  eventSummaries?: string[];
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
 * Format date string safely
 * @param dateStr - Date string to format
 * @returns Formatted date string or fallback
 */
function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      return 'Date unavailable';
    }
    return date.toLocaleDateString();
  } catch (error) {
    return 'Date unavailable';
  }
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

    // If no leaks found
    if (!data.Leaks || data.Leaks.length === 0) {
      return {
        formattedResults: [],
        error: "No vulnerabilities found"
      };
    }

    const formattedResults: FormattedResult[] = [];

    // Format Leaks data
    data.Leaks.forEach(leak => {
      // Process each event in the leak
      if (leak.events && leak.events.length > 0) {
        leak.events.forEach(event => {
          // Extract event summaries
          const eventSummary = event.summary || '';
          
          // Determine title with fallbacks
          let title = event.host || '';
          if (!title && event.event_source) {
            title = `${event.event_source} Vulnerability`;
          }
          if (!title) {
            title = leak.resource_id || 'Unknown Resource';
          }
          
          // Determine severity
          let severity = 'medium';
          if (event.leak && event.leak.severity) {
            severity = event.leak.severity;
          }
          
          // Get software info
          let software = undefined;
          if (event.service && event.service.software && event.service.software.name) {
            software = {
              name: event.service.software.name,
              version: event.service.software.version || 'Unknown'
            };
          }
          
          // Get SSL info
          let ssl = undefined;
          if (event.ssl && event.ssl.certificate) {
            ssl = {
              version: event.ssl.version || 'Unknown',
              validUntil: formatDate(event.ssl.certificate.not_after),
              issuer: event.ssl.certificate.issuer_name || 'Unknown'
            };
          }
          
          formattedResults.push({
            title: title,
            eventSummaries: eventSummary ? [eventSummary] : undefined,
            date: formatDate(event.time || leak.creation_date),
            severity: severity,
            location: event.geoip ? 
              `${event.geoip.city_name || ''}, ${event.geoip.country_name || ''}`.trim().replace(/^,\s*/, '') : 
              undefined,
            ip: event.ip || leak.Ip,
            port: event.port || (leak.open_ports && leak.open_ports.length > 0 ? leak.open_ports[0] : undefined),
            software: software,
            ssl: ssl,
            organization: event.network?.organization_name || leak.network?.organization_name
          });
        });
      } else {
        // If no events, create a single result from the leak itself
        formattedResults.push({
          title: leak.resource_id || 'Unknown Resource',
          eventSummaries: leak.Summary ? [leak.Summary] : undefined,
          date: formatDate(leak.creation_date),
          severity: 'info',
          location: leak.geoip ? 
            `${leak.geoip.city_name || ''}, ${leak.geoip.country_name || ''}`.trim().replace(/^,\s*/, '') : 
            undefined,
          ip: leak.Ip,
          port: leak.open_ports && leak.open_ports.length > 0 ? leak.open_ports[0] : undefined,
          organization: leak.network?.organization_name
        });
      }
    });

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
 * Get detailed leak results from LeakIX for a host
 * @param ip - IP address to search for
 * @returns Detailed leak information
 */
export async function getHostResults(ip: string): Promise<DetailedLeakIXResult> {
  const apiKey = process.env.LEAKX_API_KEY;

  if (!apiKey) {
    return {
      leaks: null,
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

    return {
      leaks: data.Leaks
    };
  } catch (error: any) {
    // Handle rate limiting
    if (error.message?.includes('429')) {
      return {
        leaks: null,
        error: 'Rate limited. Please wait before trying again.'
      };
    }

    return {
      leaks: null,
      error: error.message || 'Failed to perform host lookup'
    };
  }
}

/**
 * Get detailed leak results from LeakIX for a domain
 * @param domain - Domain to search for
 * @returns Detailed leak information
 */
export async function getDomainResults(domain: string): Promise<DetailedLeakIXResult> {
  const apiKey = process.env.LEAKX_API_KEY;

  if (!apiKey) {
    return {
      leaks: null,
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

    return {
      leaks: data.Leaks
    };
  } catch (error: any) {
    // Handle rate limiting
    if (error.message?.includes('429')) {
      return {
        leaks: null,
        error: 'Rate limited. Please wait before trying again.'
      };
    }

    return {
      leaks: null,
      error: error.message || 'Failed to perform domain lookup'
    };
  }
} 