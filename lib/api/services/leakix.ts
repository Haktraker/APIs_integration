"use server";

import { apiClient, isValidIP, isValidDomain } from "../client";

export interface LeakIXResult {
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

export interface LeakIXDetails {
  Services?: Array<{
    event_type: string;
    ip: string;
    host: string;
    port: string;
    protocol: string;
    summary: string;
    time: string;
    http?: {
      title: string;
      header: {
        server?: string;
      };
    };
    ssl?: {
      version: string;
      certificate: {
        cn: string;
        domain: string[];
        key_algo: string;
        key_size: number;
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
        os: string;
      };
    };
    geoip?: {
      continent_name: string;
      country_name: string;
      city_name: string;
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
  }>;
  Leaks?: LeakIXResult[] | null;
}

export async function getFormattedLeakIXResults(query: string): Promise<{
  formattedResults: Array<{
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
  }>;
  error?: string;
}> {
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

    const endpoint = isIP ? `host/${query}` : `domain/${query}`;
    const response = await fetch(
      `https://leakix.net/${endpoint}`,
      {
        headers: {
          'accept': 'application/json',
          'api-key': apiKey
        },
        
      }
    );
    console.log(response,"response leakIX file")
    if (response.status === 429) {
      const waitTime = response.headers.get('x-limited-for');
      return {
        formattedResults: [],
        error: `Rate limited. Please wait ${waitTime} before trying again.`
      };
    }

    if (!response.ok) {
      return {
        formattedResults: [],
        error: `Error: ${response.statusText}`
      };
    }

    const data = await response.json() as LeakIXDetails;

    const formattedResults = (data.Services || []).map(service => ({
      title: service.http?.title || service.host || 'Unknown Service',
      summary: service.summary,
      date: new Date(service.time).toLocaleDateString(),
      severity: 'info',
      location: service.geoip ? 
        `${service.geoip.city_name}, ${service.geoip.country_name}`.trim() : 
        undefined,
      ip: service.ip,
      port: service.port,
      software: {
        name: service.service.software.name || 'Unknown',
        version: service.service.software.version || 'Unknown'
      },
      ssl: service.ssl ? {
        version: service.ssl.version,
        validUntil: new Date(service.ssl.certificate.not_after).toLocaleDateString(),
        issuer: service.ssl.certificate.issuer_name
      } : undefined,
      organization: service.network?.organization_name
    }));

    if (data.Leaks) {
      const leakResults = data.Leaks.map(leak => ({
        title: leak.http?.title || leak.host || 'Unknown Leak',
        summary: leak.summary,
        date: new Date(leak.time).toLocaleDateString(),
        severity: leak.leak.severity,
        location: leak.geoip ? 
          `${leak.geoip.city_name}, ${leak.geoip.country_name}`.trim() : 
          undefined,
        ip: leak.ip,
        port: leak.port,
        software: {
          name: 'Unknown',
          version: 'Unknown'
        },
        ssl: undefined,
        organization: undefined
      }));

      formattedResults.push(...leakResults);
    }

    return {
      formattedResults
    };

  } catch (error) {
    console.error('LeakIX lookup error:', error);
    return {
      formattedResults: [],
      error: 'Failed to perform lookup'
    };
  }
}

export async function getLeakIXHostDetails(ip: string): Promise<{
  services?: LeakIXDetails['Services'];
  leaks?: LeakIXResult[];
  error?: string;
}> {
  const apiKey = process.env.LEAKX_API_KEY;
  
  if (!apiKey) {
    return {
      error: "LeakIX API key not configured"
    };
  }

  try {
    const response = await fetch(
      `https://leakix.net/host/${ip}`,
      {
        headers: {
          'accept': 'application/json',
          'api-key': apiKey
        },
        
      }
    );

    if (response.status === 429) {
      const waitTime = response.headers.get('x-limited-for');
      return {
        error: `Rate limited. Please wait ${waitTime} before trying again.`
      };
    }

    if (!response.ok) {
      return {
        error: `Error: ${response.statusText}`
      };
    }

    const data = await response.json() as LeakIXDetails;

    return {
      services: data.Services,
      leaks: data.Leaks || [],
    };

  } catch (error) {
    console.error('LeakIX host details error:', error);
    return {
      error: 'Failed to fetch host details'
    };
  }
}

export async function getFormattedLeakIXHostDetails(ip: string): Promise<{
  formattedDetails: Array<{
    host: string;
    port: string;
    software: {
      name: string;
      version: string;
    };
    location?: string;
    organization?: string;
    lastSeen: string;
    protocol: string;
    summary: string;
  }>;
  leaks: Array<{
    title: string;
    summary: string;
    date: string;
    severity: string;
    location?: string;
  }>;
  error?: string;
}> {
  const response = await getLeakIXHostDetails(ip);

  if (response.error) {
    return {
      formattedDetails: [],
      leaks: [],
      error: response.error
    };
  }

  const formattedDetails = (response.services || []).map(service => ({
    host: service.host,
    port: service.port,
    software: {
      name: service.service.software.name || 'Unknown',
      version: service.service.software.version || 'Unknown'
    },
    location: service.geoip ? 
      `${service.geoip.city_name}, ${service.geoip.country_name}`.trim() : 
      undefined,
    organization: service.network?.organization_name,
    lastSeen: new Date(service.time).toLocaleDateString(),
    protocol: service.protocol,
    summary: service.summary
  }));

  const formattedLeaks = (response.leaks || []).map(leak => ({
    title: leak.http?.title || leak.host || 'Untitled',
    summary: leak.summary,
    date: new Date(leak.time).toLocaleDateString(),
    severity: leak.leak.severity,
    location: leak.geoip ? 
      `${leak.geoip.city_name}, ${leak.geoip.country_name}`.trim() : 
      undefined
  }));

  return {
    formattedDetails,
    leaks: formattedLeaks
  };
} 