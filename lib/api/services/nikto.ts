"use server";

// Removed 'request' import as it wasn't used and fetch is used directly.
// import { request } from "../client"; 
import { isValidIP, isValidDomain } from "@/lib/utils";

// Interfaces remain largely the same, defining the desired output structure.
export interface NiktoVulnerability {
  id: string;
  title: string;
  description: string; // Will be populated by parseNiktoResults if needed
  severity: 'Critical' | 'High' | 'Medium' | 'Low' | 'Info';
  cve?: string[];
  details?: string; // Populated by parseNiktoResults
  recommendation?: string; // Populated by generateRecommendation
}

export interface NiktoScanResult {
  target: string;
  scanDate: string; // ISO format string
  scanDuration: string; // Formatted string like "Xm Ys"
  targetServer?: string; // Extracted from results if available
  targetPort: number;
  totalVulnerabilities: number;
  vulnerabilities: NiktoVulnerability[];
  rawResult?: string; // The raw text output from Nikto API
  publicUrl?: string; // Public URL for the scan result if provided
}

export interface NiktoScanResponse {
  success: boolean;
  scanResult?: NiktoScanResult;
  error?: string;
}

// --- API Response Interfaces (Aligned with Documentation) ---

interface NiktoApiCreateResponse {
  status_code: number; // Expect 201 on success
  scan_datetime: number; // Unix timestamp (seconds)
  scan_id: string;
}

// Interface for scan_info (Optional, but included for completeness)
// interface NiktoApiInfoResponse {
//   status_code: number; // Expect 200
//   scan_datetime: number; // Unix timestamp (seconds)
//   scan_id: string;
//   command: string; // e.g., "simple"
//   target: string;
//   public_url: string;
// }

interface NiktoApiCheckStatusResponse {
  status_code: number; // Expect 200
  scan_id: string;
  scan_status: string; // e.g., "Running", "Finished", "Error"
  // scan_datetime and scan_completed removed as they are not in the docs example
}

interface NiktoApiResultResponse {
  status_code: number; // Expect 200 on success
  scan_datetime: number; // Unix timestamp (seconds) - likely when result was generated/requested
  scan_start_datetime: number; // Unix timestamp (seconds) - Scan start time
  scan_end_datetime: number; // Unix timestamp (seconds) - Scan end time
  scan_id: string;
  target: string; // Target as seen/resolved by the scanner
  command: string; // Scan method/template used (e.g., "simple")
  scan_command: string; // Actual nikto command executed
  ip: string; // Resolved IP address of the target
  result: string; // Raw Nikto output text
  public_url: string; // Public URL for the scan result
}

// --- Helper Functions (Minor adjustments possible, but logic seems sound) ---

function determineSeverity(id: string, title: string): NiktoVulnerability['severity'] {
  const lowerId = id.toLowerCase();
  const lowerTitle = title.toLowerCase();

  // Prioritize critical findings
  if (lowerTitle.includes('rce') || lowerTitle.includes('remote code execution')) return 'Critical';

  // High severity
  if (id.startsWith('CVE-')) return 'High'; // CVEs are generally High or Critical, default High
  if (lowerId.includes('sql') || lowerTitle.includes('sql injection')) return 'High';
  if (lowerId.includes('xss') || lowerTitle.includes('xss')) return 'High'; // Often high impact
  if (lowerTitle.includes('outdated') || lowerTitle.includes('deprecated')) return 'High'; // Can lead to known exploits

  // Medium severity
  if (lowerTitle.includes('directory listing')) return 'Medium';
  if (lowerTitle.includes('information leak') || lowerTitle.includes('information disclosure')) return 'Medium';

   // Low severity
  if (lowerTitle.includes('cookie') && !lowerTitle.includes('secure')) return 'Low'; // Missing secure flag often low
  if (lowerTitle.includes('header') && !lowerTitle.includes('security header')) return 'Low'; // Generic header findings often low

  // Informational
  if (lowerId === 'server' || lowerId === 'retrieved' || lowerTitle.includes('target ip') || lowerTitle.includes('target hostname') || lowerTitle.includes('target port')) return 'Info';

  // Default fallback
  return 'Medium';
}

function generateRecommendation(id: string, title: string): string {
    const lowerTitle = title.toLowerCase();
    const lowerId = id.toLowerCase();

    if (lowerTitle.includes('rce') || lowerTitle.includes('remote code execution')) {
        return 'Immediately investigate and patch the vulnerability enabling remote code execution. Review application logic and dependencies.';
    }
    if (lowerTitle.includes('sql injection')) {
        return 'Use parameterized queries or prepared statements. Implement input validation and sanitization. Apply least privilege principle for database access.';
    }
    if (lowerTitle.includes('xss') || lowerId.includes('xss')) {
        return 'Implement context-aware output encoding (e.g., HTML entity encoding). Use Content Security Policy (CSP). Validate and sanitize user input.';
    }
    if (lowerTitle.includes('directory listing')) {
        return 'Disable directory listing/browsing in the web server configuration (e.g., `Options -Indexes` in Apache, `autoindex off;` in Nginx).';
    }
    if (lowerTitle.includes('outdated') || lowerTitle.includes('deprecated')) {
        return 'Update the identified software component (server, library, framework) to the latest stable and supported version. Regularly schedule patch management.';
    }
    if (lowerTitle.includes('information leak') || lowerTitle.includes('information disclosure')) {
        return 'Review server and application configuration to prevent exposure of sensitive information (e.g., stack traces, version numbers, internal paths). Remove or restrict access to unnecessary files/endpoints.';
    }
    if (lowerTitle.includes('cookie') && !lowerTitle.includes('secure')) {
         return 'Set the `Secure` flag for all sensitive cookies to ensure they are only transmitted over HTTPS.';
    }
     if (lowerTitle.includes('cookie') && !lowerTitle.includes('httponly')) {
         return 'Set the `HttpOnly` flag for cookies where appropriate to prevent access via client-side scripts, mitigating certain XSS attacks.';
    }
    if (lowerTitle.includes('anti-clickjacking header')) {
         return 'Implement the `X-Frame-Options` header (e.g., `DENY` or `SAMEORIGIN`) or use the `frame-ancestors` directive in Content Security Policy (CSP) to prevent clickjacking.';
    }
     if (lowerTitle.includes('x-content-type-options')) {
         return 'Set the `X-Content-Type-Options: nosniff` header to prevent browsers from MIME-sniffing the content-type away from the declared one.';
    }

    return 'Review the finding details and vendor documentation. Remediate according to security best practices and organizational policies.';
}

// Parsing function seems okay, but Nikto output format can vary.
// Added logic to capture multi-line details better.
function parseNiktoResults(rawResults: string): NiktoVulnerability[] {
  const vulnerabilities: NiktoVulnerability[] = [];
  const lines = rawResults.split('\n');
  let currentVuln: NiktoVulnerability | null = null;

  for (const line of lines) {
    const trimmedLine = line.trim();

    // Standard Nikto finding line starts with '+'
    if (trimmedLine.startsWith('+ ')) {
      // Push the previous vulnerability before starting a new one
      if (currentVuln) {
        currentVuln.description = currentVuln.title; // Use title as base description
        currentVuln.details = currentVuln.details?.trim(); // Clean up details
        vulnerabilities.push(currentVuln);
      }

      const content = trimmedLine.slice(2).trim();
      // Find the first colon to separate potential ID/OSVDB from the title/description
      const colonIndex = content.indexOf(':');
      let id = 'Info'; // Default ID if no colon
      let title = content;

      if (colonIndex > 0) {
           // Check if the part before colon looks like a potential ID (e.g., OSVDB, CVE)
           const potentialId = content.substring(0, colonIndex).trim();
           // Simple check: Avoid taking long phrases as IDs
           if (potentialId.match(/^[\w-]+$/) && potentialId.length < 20) {
                id = potentialId;
                title = content.slice(colonIndex + 1).trim();
           } else {
                // If it doesn't look like an ID, treat the whole line as the title
                id = 'Info'; // Reset to Info or similar default
                title = content;
           }
      } else {
          // Handle lines like "+ Server: Apache/2.4.41 (Ubuntu)"
          if (content.startsWith('Server:')) {
            id = 'Server';
            title = content.substring('Server:'.length).trim();
          } else if (content.startsWith('Target IP:')) {
            id = 'Target IP';
            title = content.substring('Target IP:'.length).trim();
          } else if (content.startsWith('Target Hostname:')) {
            id = 'Target Hostname';
            title = content.substring('Target Hostname:'.length).trim();
          } else if (content.startsWith('Target Port:')) {
             id = 'Target Port';
             title = content.substring('Target Port:'.length).trim();
          }
          // Add more specific checks if needed
      }


      const cve = [...(title.match(/CVE-\d{4}-\d{4,}/g) || [])]; // Extract CVEs

      currentVuln = {
        id: id,
        title: title,
        description: title, // Initial description
        severity: determineSeverity(id, title),
        details: '', // Reset details for the new vulnerability
        recommendation: generateRecommendation(id, title),
        cve: cve.length > 0 ? cve : undefined
      };
    } else if (currentVuln && trimmedLine.length > 0 && !trimmedLine.startsWith('-')) {
        // Append indented lines or subsequent non-finding lines as details
        // Avoid adding lines starting with '-' which are often summary lines
       if (line.startsWith('  ') || line.startsWith('\t') || !trimmedLine.startsWith('+')) {
          // Check if it looks like a URI path before appending
           if (trimmedLine.startsWith('/')) {
                currentVuln.details += line + '\n'; // Keep original indentation
           } else {
                currentVuln.details += trimmedLine + '\n'; // Append trimmed line
           }
       }
    }
    // No 'else if (currentVuln)' needed here, as we push *before* creating the new one.
  }

  // Push the last vulnerability found
  if (currentVuln) {
      currentVuln.description = currentVuln.title;
      currentVuln.details = currentVuln.details?.trim();
      vulnerabilities.push(currentVuln);
  }

  // Post-processing: Refine description (optional)
  // For example, if details contain useful summary, append it to description.
  // This part is highly dependent on exact Nikto output variations.
  vulnerabilities.forEach(v => {
      if (v.details && v.details.length > v.title.length) {
           // Example: If details start with the title, maybe description is fine.
           // If details add significant info, consider updating description.
           // For now, keep description = title.
      }
      // Ensure details are undefined if empty after trimming
      if (!v.details || v.details.trim() === '') {
          v.details = undefined;
      }
  });

  return vulnerabilities;
}


// --- Main Scan Function (Updated based on Docs) ---

export async function runNiktoScan(
  target: string,
  port: number = 80, // Port might influence scan if not default HTTP/HTTPS, but isn't sent in add_scan
  scanMethod: string = "simple" // Changed default to 'simple' as seen in docs examples
): Promise<NiktoScanResponse> {
  try {
    if (!isValidDomain(target) && !isValidIP(target)) {
      return { success: false, error: "Invalid target address" };
    }

    const apiKey = process.env.NIKTO_API_KEY;
    if (!apiKey) {
      console.error("NIKTO_API_KEY environment variable not set.");
      return { success: false, error: "API key not configured" };
    }

    // --- 1. Add Scan (Initiate) ---
    const addScanForm = new FormData();
    addScanForm.append('host', target);
    // The API doc uses 'method'. Let's align with that.
    // Common methods might be 'simple', 'full', maybe related to Nikto tuning options.
    addScanForm.append('method', scanMethod);
    addScanForm.append('visibility', 'private'); // Or 'public' if intended

    console.log(`Initiating Nikto scan for ${target} using method ${scanMethod}`);

    const createResponse = await fetch("https://api.nikto.online/v01/add_scan", {
      method: "POST",
      headers: {
        "NIKTO-API-KEY": apiKey
        // Content-Type is set automatically by fetch when using FormData
      },
      body: addScanForm
    });

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      console.error(`Nikto API Error (add_scan): ${createResponse.status} ${createResponse.statusText}`, errorText);
      return {
        success: false,
        error: `Scan initiation failed: ${createResponse.status} ${createResponse.statusText}`
      };
    }

    const createData: NiktoApiCreateResponse = await createResponse.json();
    if (createData.status_code !== 201) {
      console.error(`Scan creation failed via API: Status ${createData.status_code}`, createData);
      return {
        success: false,
        error: `Scan creation failed: API Status ${createData.status_code}`
      };
    }

    const scanId = createData.scan_id;
    console.log(`Scan initiated successfully. Scan ID: ${scanId}`);

    // --- 2. Check Scan Status (Polling) ---
    let scanCompleted = false;
    let attempts = 0;
    const maxAttempts = 30; // Max 30 attempts (e.g., 5 minutes if polling every 10s)
    const pollInterval = 10000; // Poll every 10 seconds

    console.log("Polling for scan completion...");

    while (!scanCompleted && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, pollInterval));
      attempts++;

      const statusForm = new FormData();
      statusForm.append('scan_id', scanId);

      try {
        const statusResponse = await fetch("https://api.nikto.online/v01/check_scan_status", {
          method: "POST",
          headers: {
            "NIKTO-API-KEY": apiKey
          },
          body: statusForm
        });

        if (!statusResponse.ok) {
          console.warn(`Polling attempt ${attempts}/${maxAttempts}: Status check failed (${statusResponse.status}), retrying...`);
          continue; // Try again on next interval
        }

        const statusData: NiktoApiCheckStatusResponse = await statusResponse.json();

        if (statusData.status_code !== 200) {
            console.warn(`Polling attempt ${attempts}/${maxAttempts}: API returned status ${statusData.status_code} for status check. Scan ID: ${scanId}`);
            continue; // Try again
        }

        console.log(`Polling attempt ${attempts}/${maxAttempts}: Scan status: ${statusData.scan_status}`);

        if (statusData.scan_status === "Finished") {
          scanCompleted = true;
          console.log("Scan finished.");
          break;
        } else if (statusData.scan_status === "Error" || statusData.scan_status === "Timeout") {
           console.error(`Scan ${scanId} failed with status: ${statusData.scan_status}`);
           return { success: false, error: `Scan failed with status: ${statusData.scan_status}` };
        }
        // Add handling for other potential statuses if needed ("Queued", "Running", etc.)

      } catch (pollError) {
          console.warn(`Polling attempt ${attempts}/${maxAttempts}: Error during status check:`, pollError);
          // Decide whether to continue polling or bail after network errors
      }
    } // End polling loop

    if (!scanCompleted) {
      console.error(`Scan ${scanId} did not complete within the allotted time (${maxAttempts * pollInterval / 1000} seconds).`);
      return { success: false, error: "Scan timed out waiting for results." };
    }

    // --- 3. Get Scan Result ---
    console.log(`Fetching results for scan ID: ${scanId}`);
    const resultForm = new FormData();
    resultForm.append('scan_id', scanId);

    const resultResponse = await fetch("https://api.nikto.online/v01/scan_result", {
      method: "POST",
      headers: {
        "NIKTO-API-KEY": apiKey
      },
      body: resultForm
    });

    if (!resultResponse.ok) {
       const errorText = await resultResponse.text();
       console.error(`Nikto API Error (scan_result): ${resultResponse.status} ${resultResponse.statusText}`, errorText);
      return {
        success: false,
        error: `Result fetch failed: ${resultResponse.status} ${resultResponse.statusText}`
      };
    }

    const resultData: NiktoApiResultResponse = await resultResponse.json();

    if (resultData.status_code !== 200) {
      console.error(`Failed to retrieve results: API Status ${resultData.status_code}`, resultData);
      return {
        success: false,
        error: `Failed to retrieve results: API Status ${resultData.status_code}`
      };
    }

    console.log("Scan results received. Parsing...");

    // --- 4. Parse and Format Results ---
    const vulnerabilities = parseNiktoResults(resultData.result);
    const serverInfo = vulnerabilities.find(v => v.id === 'Server'); // Find server info if parsed

    // Calculate duration
    const durationSeconds = resultData.scan_end_datetime - resultData.scan_start_datetime;
    const durationMinutes = Math.floor(durationSeconds / 60);
    const remainingSeconds = durationSeconds % 60;
    const formattedDuration = `${durationMinutes}m ${remainingSeconds}s`;

    const scanResult: NiktoScanResult = {
      target: target, // Use the original input target
      // Use scan_start_datetime as the primary date/time of the scan execution
      scanDate: new Date(resultData.scan_start_datetime * 1000).toISOString(),
      scanDuration: formattedDuration,
      // targetServer: serverInfo?.title, // Get server from parsed results
      targetServer: vulnerabilities.find(v => v.id === 'Server')?.title, // More concise way
      targetPort: port, // Use the input port
      totalVulnerabilities: vulnerabilities.filter(v => v.severity !== 'Info').length, // Count non-info vulnerabilities
      vulnerabilities: vulnerabilities,
      rawResult: resultData.result,
      publicUrl: resultData.public_url // Get public URL from result
    };

    console.log(`Parsing complete. Found ${scanResult.totalVulnerabilities} potential vulnerabilities (excluding Info).`);

    return {
      success: true,
      scanResult: scanResult
    };

  } catch (error) {
    console.error("Unexpected error during Nikto scan:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred during the scan process."
    };
  }
}