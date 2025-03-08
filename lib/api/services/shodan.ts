"use server";

import { get, request } from "../client";
import { isValidIP, isValidDomain } from "@/lib/utils";

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
  error?: string;
}

export interface ShodanHostResponse {
  ip_str?: string;
  ports?: number[];
  hostnames?: string[];
  domains?: string[];
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

/**
 * Search Shodan for information about a domain or IP
 * @param query - Domain or IP to search for
 * @returns Shodan response with host and DNS data
 */
export async function searchShodan(query: string): Promise<ShodanResponse> {
  const apiKey = process.env.SHODAN_API_KEY;

  if (!apiKey) {
    return {
      error: "Shodan API key not configured"
    };
  }

  try {
    const isIP = isValidIP(query);
    const isDomain = isValidDomain(query);
    
    if (!isIP && !isDomain) {
      return {
        error: "Invalid IP or domain format"
      };
    }

    // For IP addresses, use the host endpoint
    if (isIP) {
      try {
        const hostData = await get<ShodanHostResponse>(
          `https://api.shodan.io/shodan/host/${query}?key=${apiKey}`
        );
        
        return { hostData };
      } catch (error: any) {
        if (error.message?.includes('404')) {
          return {
            hostData: { ip_str: query, error: "No information found for this IP" }
          };
        }
        throw error;
      }
    }
    
    // For domains, use the DNS endpoint
    if (isDomain) {
      try {
        const dnsData = await get<ShodanDNSResponse>(
          `https://api.shodan.io/dns/domain/${query}?key=${apiKey}`
        );
        
        // Try to get host data for the domain as well
        let hostData: ShodanHostResponse | undefined;
        try {
          hostData = await get<ShodanHostResponse>(
            `https://api.shodan.io/shodan/host/search?query=hostname:${query}&key=${apiKey}`
          );
        } catch (error) {
          // Ignore errors for host search, as DNS data is the primary goal
          console.log("Could not get host data for domain:", error);
        }
        
        return {
          dnsData,
          hostData
        };
      } catch (error: any) {
        if (error.message?.includes('404')) {
          return {
            dnsData: { domain: query, data: [], error: "No DNS information found for this domain" }
          };
        }
        throw error;
      }
    }
    
    return {
      error: "Invalid query type"
    };
  } catch (error: any) {
    console.error('Shodan search error:', error);
    
    // Check for rate limiting
    if (error.message?.includes('429')) {
      return {
        error: 'Rate limited by Shodan. Please try again later.'
      };
    }
    
    return {
      error: error.message || 'Failed to search Shodan'
    };
  }
} 