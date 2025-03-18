"use server";

import { request } from "../client";
import { isValidIP, isValidDomain } from "@/lib/utils";

export interface NiktoVulnerability {
  id: string;
  title: string;
  description: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low' | 'Info';
  cve?: string[];
  details?: string;
  recommendation?: string;
}

export interface NiktoScanResult {
  target: string;
  scanDate: string;
  scanDuration: string;
  targetServer?: string;
  targetPort: number;
  totalVulnerabilities: number;
  vulnerabilities: NiktoVulnerability[];
  rawResult?: string;
  publicUrl?: string;
}

export interface NiktoScanResponse {
  success: boolean;
  scanResult?: NiktoScanResult;
  error?: string;
}

interface NiktoApiCreateResponse {
  status_code: number;
  scan_datetime: number;
  scan_id: string;
}

interface NiktoApiCheckStatusResponse {
  status_code: number;
  scan_status: string;
  scan_datetime?: number;
  scan_completed?: boolean;
}

interface NiktoApiResultResponse {
  status_code: number;
  scan_datetime: number;
  scan_start_datetime: number;
  scan_end_datetime: number;
  scan_id: string;
  target: string;
  command: string;
  scan_command: string;
  ip: string;
  result: string;
  public_url: string;
}

function determineSeverity(id: string, title: string): NiktoVulnerability['severity'] {
  const lowerId = id.toLowerCase();
  const lowerTitle = title.toLowerCase();

  if (id.startsWith('CVE-')) return 'High';
  if (lowerId.includes('xss') || lowerTitle.includes('xss')) return 'High';
  if (lowerId.includes('sql') || lowerTitle.includes('sql injection')) return 'High';
  if (lowerTitle.includes('rce') || lowerTitle.includes('remote code execution')) return 'Critical';
  if (lowerId === 'server' || lowerId === 'retrieved') return 'Info';
  if (lowerTitle.includes('directory listing') || lowerTitle.includes('information leak')) return 'Medium';
  if (lowerTitle.includes('outdated') || lowerTitle.includes('deprecated')) return 'High';
  if (lowerTitle.includes('cookie') || lowerTitle.includes('header')) return 'Low';
  
  return 'Medium';
}

function generateRecommendation(id: string, title: string): string {
  const lowerTitle = title.toLowerCase();
  
  if (lowerTitle.includes('xss')) {
    return 'Implement input validation and output encoding to prevent XSS attacks.';
  }
  if (lowerTitle.includes('sql injection')) {
    return 'Use parameterized queries and prepared statements to mitigate SQL injection.';
  }
  if (lowerTitle.includes('directory listing')) {
    return 'Disable directory listing in web server configuration.';
  }
  if (lowerTitle.includes('outdated')) {
    return 'Update software to the latest stable version.';
  }
  if (lowerTitle.includes('information leak')) {
    return 'Configure server to prevent sensitive information disclosure.';
  }
  
  return 'Review and remediate according to security best practices.';
}

function parseNiktoResults(rawResults: string): NiktoVulnerability[] {
  const vulnerabilities: NiktoVulnerability[] = [];
  const lines = rawResults.split('\n');
  let currentVuln: NiktoVulnerability | null = null;

  for (const line of lines) {
    const trimmedLine = line.trim();
    
    if (trimmedLine.startsWith('+ ')) {
      if (currentVuln) vulnerabilities.push(currentVuln);
      
      const content = trimmedLine.slice(2);
      const colonIndex = content.indexOf(':');
      if (colonIndex === -1) continue;

      const id = content.slice(0, colonIndex).trim();
      const title = content.slice(colonIndex + 1).trim();
      const cve = [...(title.match(/CVE-\d{4}-\d{4,}/g) || [])];

      currentVuln = {
        id,
        title,
        description: '',
        severity: determineSeverity(id, title),
        details: '',
        recommendation: generateRecommendation(id, title),
        cve: cve.length > 0 ? cve : undefined
      };
    } else if (currentVuln && (trimmedLine.startsWith(' ') || trimmedLine === '')) {
      currentVuln.details += trimmedLine + '\n';
    } else if (currentVuln) {
      vulnerabilities.push(currentVuln);
      currentVuln = null;
    }
  }

  if (currentVuln) vulnerabilities.push(currentVuln);
  return vulnerabilities;
}

export async function runNiktoScan(
  target: string, 
  port: number = 80, 
  scanMethod: string = "quick_scan"
): Promise<NiktoScanResponse> {
  try {
    if (!isValidDomain(target) && !isValidIP(target)) {
      return { success: false, error: "Invalid target address" };
    }

    const apiKey = process.env.NIKTO_API_KEY;
    if (!apiKey) {
      return { success: false, error: "API key not configured" };
    }

    const params = new URLSearchParams();
    params.append('host', target);
    params.append('port', port.toString());
    params.append('scan_template', scanMethod);
    params.append('visibility', 'private');

    const createResponse = await fetch("https://api.nikto.online/v01/add_scan", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "NIKTO-API-KEY": apiKey
      },
      body: params
    });

    if (!createResponse.ok) {
      return { 
        success: false, 
        error: `Scan initiation failed: ${createResponse.statusText}`
      };
    }

    const createData: NiktoApiCreateResponse = await createResponse.json();
    if (createData.status_code !== 201) {
      return { 
        success: false, 
        error: `Scan creation failed: Status ${createData.status_code}`
      };
    }

    const scanId = createData.scan_id;
    let scanCompleted = false;
    let attempts = 0;

    while (!scanCompleted && attempts < 30) {
      await new Promise(resolve => setTimeout(resolve, 10000));
      attempts++;

      const statusParams = new URLSearchParams({ scan_id: scanId });
      const statusResponse = await fetch("https://api.nikto.online/v01/check_scan_status", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "NIKTO-API-KEY": apiKey
        },
        body: statusParams
      });

      if (!statusResponse.ok) continue;
      
      const statusData: NiktoApiCheckStatusResponse = await statusResponse.json();
      if (statusData.scan_status === "Finished") {
        scanCompleted = true;
        break;
      }
    }

    const resultParams = new URLSearchParams({ scan_id: scanId });
    const resultResponse = await fetch("https://api.nikto.online/v01/scan_result", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "NIKTO-API-KEY": apiKey
      },
      body: resultParams
    });

    if (!resultResponse.ok) {
      return { 
        success: false, 
        error: `Result fetch failed: ${resultResponse.statusText}`
      };
    }

    const resultData: NiktoApiResultResponse = await resultResponse.json();
    if (resultData.status_code !== 200) {
      return { 
        success: false, 
        error: `Scan failed with status: ${resultData.status_code}`
      };
    }

    const vulnerabilities = parseNiktoResults(resultData.result);
    const serverInfo = vulnerabilities.find(v => v.id === 'Server');
    
    return {
      success: true,
      scanResult: {
        target,
        scanDate: new Date(resultData.scan_datetime * 1000).toISOString(),
        scanDuration: `${Math.floor((resultData.scan_end_datetime - resultData.scan_start_datetime) / 60)}m ${(resultData.scan_end_datetime - resultData.scan_start_datetime) % 60}s`,
        targetServer: serverInfo?.title,
        targetPort: port,
        totalVulnerabilities: vulnerabilities.length,
        vulnerabilities,
        rawResult: resultData.result,
        publicUrl: resultData.public_url
      }
    };
  } catch (error) {
    console.error("Nikto scan error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred"
    };
  }
}