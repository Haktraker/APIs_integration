import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// --- Existing Shadcn utility ---
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Existing Validation utilities ---
export const isValidIP = (input: string) =>
  /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(input);

export const isValidDomain = (input: string) =>
  /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i.test(input);


// --- NEWLY ADDED CODE BELOW ---

// 1. Interface for the parsed Nmap data
export interface ParsedNmapResult {
  openPorts: Array<{ port: number; protocol: string; state: string; service: string }>;
  duration: string | null;
  hostStatus: string | null;
  ipAddress: string | null; // Extracted IP if resolved from domain
  rawOutputLines: string[]; // Keep the original lines for display
}

// 2. Function to parse the Nmap raw text output
export function parseNmapResult(rawText: string | null | undefined): ParsedNmapResult {
  const result: ParsedNmapResult = {
    openPorts: [],
    duration: null,
    hostStatus: null,
    ipAddress: null,
    rawOutputLines: [],
  };

  if (!rawText) {
    return result;
  }

  const lines = rawText.trim().split('\n');
  result.rawOutputLines = lines; // Store lines for the <pre> tag

  // Regex explanations:
  // Port Line: ^(\d+)\/(tcp|udp)\s+(open)\s+([\w\-/?#\s]+)$
  //  - ^(\d+): Port number at the start of the line
  //  - \/(tcp|udp): Protocol (tcp or udp)
  //  - \s+(open)\s+: State ("open") surrounded by spaces
  //  - ([\w\-/?#\s.]+)$: Service name (allows alphanumeric, hyphen, slash, ?, #, space, dot until end) - updated to include dot
  const portRegex = /^(\d+)\/(tcp|udp)\s+(open)\s+([\w\-/?#\s.]+)$/i;

  // Duration Line: /Nmap done:.*?in ([\d.]+) seconds/
  //  - Looks for "Nmap done:" and captures digits/dots within "in X seconds"
  const durationRegex = /Nmap done:.*?in ([\d.]+) seconds/i;

  // Host Status: /Host is (up|down)/
  const hostStatusRegex = /Host is (up|down)/i;

   // IP Address from report line: /Nmap scan report for .*?\((\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})\)/
   const ipRegex = /Nmap scan report for .*?\((\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})\)/i;

  lines.forEach(line => {
    line = line.trim();

    // Check for IP Address
    const ipMatch = line.match(ipRegex);
    if (ipMatch && !result.ipAddress) { // Take the first match
        result.ipAddress = ipMatch[1];
    }

    // Check for Host Status
    const statusMatch = line.match(hostStatusRegex);
    if (statusMatch) {
      result.hostStatus = statusMatch[1].toLowerCase(); // 'up' or 'down'
    }

    // Check for Open Ports
    const portMatch = line.match(portRegex);
    if (portMatch) {
      result.openPorts.push({
        port: parseInt(portMatch[1], 10),
        protocol: portMatch[2].toLowerCase(),
        state: portMatch[3].toLowerCase(), // Should always be 'open' based on regex
        service: portMatch[4].trim(),
      });
    }

    // Check for Duration
    const durationMatch = line.match(durationRegex);
    if (durationMatch) {
      result.duration = `${durationMatch[1]}sec`; // Format like screenshot
    }
  });

  return result;
}

// 3. Helper to format date as YYYY-MM-DD
export function formatDate(isoDateString: string): string {
    try {
        const date = new Date(isoDateString);
        // Adjust for timezone offset to get local date parts
        // This ensures we get the YYYY-MM-DD in the user's local timezone
        const offset = date.getTimezoneOffset() * 60000; // Offset in milliseconds
        const localDate = new Date(date.getTime() - offset);
        return localDate.toISOString().split('T')[0];
    } catch (e) {
        console.error("Error formatting date:", e);
        return "Invalid Date";
    }
}