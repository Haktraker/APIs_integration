"use server";

import { isValidIP, isValidDomain } from "@/lib/utils"; // Assuming these functions exist

// NOTE: The API's /scan_result endpoint seems to return raw text output (like Nmap).
// We are removing the structured PortScanResult[] and returning the raw text.
// If you need structured data, you'll have to parse the rawResult string.


export interface PortScanResponse {
  success: boolean;
  target: string;
  scanDate: string; // ISO timestamp when the scan function was initiated
  scanId?: string; // The ID returned by the API
  scanCommand?: string; // The actual command run by the scanner (from /scan_result)
  rawResult?: string; // The raw output from the scan (from /scan_result)
  error?: string;
}

// Helper function to handle API errors and return a descriptive string
async function getApiError(response: Response): Promise<string> {
  // Start with the HTTP status text
  let errorMsg = `API request failed with status ${response.status} ${response.statusText}`;
  try {
    // Try to parse JSON error first (common pattern)
    const errorData = await response.json();
    // Use specific fields if available, otherwise stringify the object
    errorMsg = errorData?.error || errorData?.message || (typeof errorData === 'object' ? JSON.stringify(errorData) : errorData) || errorMsg;
  } catch (e) {
    // If JSON parsing fails, try getting text (maybe plain text error)
    try {
      const textError = await response.text();
      if (textError) {
        // Combine status with text error if available
        errorMsg = `API request failed with status ${response.status} ${response.statusText}: ${textError}`;
      }
    } catch (textE) {
      // Ignore error reading text body, stick with the original status code message
    }
  }
  return errorMsg; // Ensure a string is always returned
}

export async function runPortScan(target: string): Promise<PortScanResponse> {
  const scanDate = new Date().toISOString();

  try {
    // 1. Validate Input Target
    if (!isValidDomain(target) && !isValidIP(target)) {
      return {
        success: false,
        target,
        scanDate,
        error: "Invalid target address. Must be a valid domain or IP address.",
      };
    }

    // 2. Check for API Key
    const apiKey = process.env.PORTSCANNER_API_KEY;
    if (!apiKey) {
      console.error("PORTSCANNER_API_KEY environment variable is not set.");
      return {
        success: false,
        target,
        scanDate,
        error: "API key not configured on the server.",
      };
    }

    // 3. Start the Scan (/start_scan using FormData)
    // Using 'command: simple' as seen in the /scan_result example.
    // Adjust 'scan_type', 'command', 'options' if needed for different scan types.
    const startForm = new FormData();
    startForm.append('target', target);
    startForm.append('command', 'simple'); // Basic fast scan often covers common ports
    // startForm.append('options', '-p 1-65535'); // Example: If you need *all* ports, add options

    console.log(`Starting port scan for target: ${target}`);
    const startResponse = await fetch('https://api.portscanner.online/v01/start_scan', {
      method: 'POST',
      headers: {
        'PORTSCANNER-API-KEY': apiKey,
        // DO NOT set Content-Type manually for FormData
      },
      body: startForm,
      cache: 'no-store', // Ensure fresh request/response
    });

    if (!startResponse.ok || startResponse.status !== 201) { // API uses 201 Created for success
      // Get the detailed error message using the helper
      const errorMsg = await getApiError(startResponse);
      console.error(`Failed to start scan for ${target}: ${errorMsg}`); // Log the detailed message
      return {
        success: false,
        target,
        scanDate,
        // FIX: Use the errorMsg string directly, don't try to access .status on it
        error: `Failed to start scan: ${errorMsg}`,
      };
    }

    // Assuming the response body is JSON if status is 201
    const startData = await startResponse.json();
    const scanId = startData?.scan_id;

    if (!scanId) {
      console.error(`API did not return a scan_id for target: ${target}`, startData);
      return {
        success: false,
        target,
        scanDate,
        error: "API did not return a scan ID after starting the scan.",
      };
    }
    console.log(`Scan started successfully for ${target}. Scan ID: ${scanId}`);

    // 4. Poll for Status (/check_scan_status using application/x-www-form-urlencoded)
    let attempts = 0;
    const maxAttempts = 45; // Increased polling time (e.g., 45 * 3s = ~2.25 mins)
    const delayMs = 3000; // Wait 3 seconds between polls

    let scanStatus = 'Pending'; // Initial assumption
    let statusData: any = null; // To store the last successful status data

    while (attempts < maxAttempts) {
      attempts++;
      console.log(`Polling attempt ${attempts}/${maxAttempts} for scan status ID: ${scanId}`);

      await new Promise(resolve => setTimeout(resolve, delayMs));

      // Prepare data for x-www-form-urlencoded
      const statusParams = new URLSearchParams();
      statusParams.append('scan_id', scanId);

      const statusResponse = await fetch('https://api.portscanner.online/v01/check_scan_status', {
        method: 'POST',
        headers: {
          'PORTSCANNER-API-KEY': apiKey,
          'Content-Type': 'application/x-www-form-urlencoded', // MUST set for URLSearchParams
        },
        body: statusParams,
        cache: 'no-store', // Ensure fresh request/response
      });

      if (!statusResponse.ok) {
        const errorMsg = await getApiError(statusResponse);
        console.warn(`Polling status attempt ${attempts} failed for scan ${scanId}: ${errorMsg}. Retrying...`);
        // Potentially add logic here to stop polling on certain errors (e.g., 404 Not Found if scan ID is invalid)
        if (statusResponse.status === 404) {
            return {
                success: false,
                target,
                scanDate,
                scanId,
                error: `Scan ID ${scanId} not found during polling. It might have expired or been invalid.`
            }
        }
        continue; // Continue to next attempt
      }

      try {
        statusData = await statusResponse.json();
        scanStatus = statusData?.scan_status; // e.g., "Pending", "Running", "Finished", "Error"

        console.log(`Scan ${scanId} status: ${scanStatus}`);

        if (scanStatus === 'Finished') {
          console.log(`Scan ${scanId} completed successfully.`);
          break; // Exit polling loop
        } else if (scanStatus === 'Error' || scanStatus === 'Failed') { // Added 'Failed' as a possible error state
          console.error(`Scan ${scanId} failed with status: ${scanStatus}`);
          // Attempt to get more error details if available in the status response
          const detailError = statusData?.error || statusData?.message || `Scan failed with status: ${scanStatus}`;
          return {
              success: false,
              target,
              scanDate,
              scanId,
              error: detailError,
          };
        }
        // Otherwise, status is likely "Pending" or "Running", continue polling
      } catch (jsonError) {
        console.warn(`Polling status attempt ${attempts} for scan ${scanId}: Failed to parse JSON response. Status: ${statusResponse.status}. Retrying...`, jsonError);
        // Continue polling, maybe it was a temporary glitch
        continue;
      }

    } // End of while loop

    // Check if polling finished because of success or timeout
    if (scanStatus !== 'Finished') {
      console.error(`Scan ${scanId} timed out after ${attempts} attempts. Last status: ${scanStatus}`);
      return {
        success: false,
        target,
        scanDate,
        scanId,
        error: `Scan timed out after ${attempts * (delayMs / 1000)} seconds. Last known status: ${scanStatus || 'Unknown'}`,
      };
    }

    // 5. Get Scan Results (/scan_result using FormData)
    console.log(`Fetching results for completed scan ID: ${scanId}`);
    const resultForm = new FormData();
    resultForm.append('scan_id', scanId);

    const resultResponse = await fetch('https://api.portscanner.online/v01/scan_result', {
        method: 'POST',
        headers: {
          'PORTSCANNER-API-KEY': apiKey,
           // DO NOT set Content-Type manually for FormData
        },
        body: resultForm,
        cache: 'no-store', // Ensure fresh request/response
      });

    if (!resultResponse.ok) {
         const errorMsg = await getApiError(resultResponse);
         console.error(`Failed to fetch results for scan ${scanId}: ${errorMsg}`);
         return {
           success: false,
           target,
           scanDate,
           scanId,
           // Provide the detailed error message
           error: `Scan completed, but failed to fetch results: ${errorMsg}`,
         };
    }

    let resultData: any;
    try {
      resultData = await resultResponse.json();
    } catch (jsonError) {
        console.error(`Failed to parse JSON results for scan ${scanId}:`, jsonError);
         return {
           success: false,
           target,
           scanDate,
           scanId,
           error: `Scan completed, but failed to parse the results JSON.`,
         };
    }

    // Successfully got results
    return {
        success: true,
        target,
        scanDate,
        scanId,
        scanCommand: resultData?.scan_command,
        rawResult: resultData?.result, // Return the raw result string
    };

  } catch (error: unknown) {
    console.error(`Unexpected error during port scan process for ${target}:`, error);
    // Try to determine target even in case of early error, might be undefined
    const currentTarget = typeof target === 'string' ? target : 'Unknown';
    return {
      success: false,
      target: currentTarget,
      scanDate, // scanDate should be defined
      error: error instanceof Error ? error.message : "An unknown server error occurred during the port scan process.",
    };
  }
}