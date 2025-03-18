// "use server";
// import { get, post, request } from "../client";

/**
 * IntelX API functionality has been removed as requested.
 * All code below is commented out but preserved for reference.
 */

// export interface IntelXSearchInitialResponse {
//   id: string;
//   status?: number;
//   name?: string;
// }

// export interface IntelXFileRecord {
//   systemid: string;
//   owner: string;
//   storageid: string;
//   instore: boolean;
//   size: number;
//   accesslevel: number;
//   type: number;
//   media: number;
//   added: string;
//   date: string;
//   name: string;
//   description: string;
//   xscore: number;
//   simhash: number;
//   bucket: string;
// }

// export interface IntelXSearchResultResponse {
//   records: IntelXFileRecord[];
//   status: number;
//   id: string;
//   count: number;
// }

// export interface IntelXSearchStatisticResponse {
//   date: Array<{ day: string; count: number }>;
//   type: Array<{ type: number; typeh: string; count: number }>;
//   media: Array<{
//     media: number;
//     mediah: string;
//     count: number;
//     filter: boolean;
//   }>;
//   bucket: Array<{
//     bucket: string;
//     bucketh: string;
//     count: number;
//     filter: boolean;
//   }>;
//   heatmap: Record<string, number>;
//   total: number;
//   status: number;
//   terminated: boolean;
// }

// export interface IntelXResponse {
//   id: string;
//   results: IntelXSearchResultResponse;
//   statistics: IntelXSearchStatisticResponse;
//   error?: string;
// }

// export interface IntelXSearchResultWithFiles {
//   results: IntelXSearchResultResponse;
//   files: { [storageid: string]: string };
//   error?: string;
// }

// interface CacheEntry {
//   timestamp: number;
//   data: IntelXResponse;
// }

// const searchCache: { [key: string]: CacheEntry } = {};
// const CACHE_DURATION = 1000 * 60 * 30; // 30 minutes
// const searchResultsCache: Record<string, IntelXSearchResultResponse> = {};
// const fileResultsCache: { [key: string]: { timestamp: number, data: IntelXSearchResultWithFiles } } = {};

// const intelXFetch = async <T>(url: string, options: RequestInit = {}): Promise<T> => {
//   const xKey = process.env.X_KEY;

//   if (!xKey) {
//     throw new Error("IntelX API key not configured");
//   }

//   const headers = {
//     "x-key": xKey,
//     "Accept": "*/*",
//     "Accept-Encoding": "gzip, deflate, br",
//     "Connection": "keep-alive",
//     ...options.headers,
//   };

//   return request<T>(url, { ...options, headers });
// };

// export async function intelxSearch(term: string, sort: number = 4): Promise<IntelXResponse> {
//   const cacheKey = `${term}_${sort}`;
//   const cachedResult = searchCache[cacheKey];
//   const now = Date.now();

//   if (cachedResult && (now - cachedResult.timestamp) < CACHE_DURATION) {
//     console.log('Returning cached results for:', term);
//     return cachedResult.data;
//   }

//   try {
//     const initData = await post<IntelXSearchInitialResponse>(
//       "https://2.intelx.io/intelligent/search",
//       { term, sort },
//       {
//         headers: {
//           "x-key": process.env.X_KEY!,
//         }
//       }
//     );

//     const id = initData.id;

//     const [results, statistics] = await Promise.all([
//       intelXFetch<IntelXSearchResultResponse>(
//         `https://2.intelx.io/intelligent/search/result?id=${id}`
//       ),
//       intelXFetch<IntelXSearchStatisticResponse>(
//         `https://2.intelx.io/intelligent/search/statistic?id=${id}`
//       ),
//     ]);

//     const response: IntelXResponse = { id, results, statistics };

//     searchCache[cacheKey] = {
//       timestamp: now,
//       data: response
//     };

//     if (results.records && results.records.length > 0) {
//       searchResultsCache[id] = results;
//     }

//     return response;
//   } catch (error: any) {
//     if (cachedResult) {
//       console.log('Request failed, returning expired cache for:', term);
//       return cachedResult.data;
//     }

//     return {
//       id: "",
//       results: { records: [], status: 0, id: "", count: 0 },
//       statistics: {} as IntelXSearchStatisticResponse,
//       error: error.message || "Failed to perform IntelX search",
//     };
//   }
// }

// export async function intelxSearchResultWithFiles(id: string): Promise<IntelXSearchResultWithFiles> {
//   const cachedResult = fileResultsCache[id];
//   const now = Date.now();

//   if (cachedResult && (now - cachedResult.timestamp) < CACHE_DURATION) {
//     console.log('Returning cached file results for ID:', id);
//     return cachedResult.data;
//   }

//   try {
//     console.log('Starting intelxSearchResultWithFiles with ID:', id);
//     let allRecords: IntelXFileRecord[] = [];
//     let page: IntelXSearchResultResponse;

//     const url = `https://2.intelx.io/intelligent/search/result?id=${id}`;
//     console.log('Fetching IntelX results from:', url);

//     try {
//       page = await intelXFetch<IntelXSearchResultResponse>(url);
//       console.log('Received page with records count:', page.records?.length || 0);
//     } catch (error) {
//       if (searchResultsCache[id]) {
//         page = searchResultsCache[id];
//       } else {
//         throw new Error('Failed to fetch results and no cached results available');
//       }
//     }

//     if (!page.records || page.records.length === 0) {
//       if (searchResultsCache[id]) {
//         page = searchResultsCache[id];
//       }
//     }

//     if (page.records) {
//       allRecords = page.records.filter(record => {
//         const fileName = record.name.toLowerCase();
//         return fileName.endsWith('.txt') || fileName.endsWith('.text');
//       });
//     }

//     const results: IntelXSearchResultResponse = {
//       records: allRecords,
//       status: page.status,
//       id: id,
//       count: allRecords.length,
//     };

//     if (allRecords.length === 0) {
//       return {
//         results,
//         files: {},
//         error: "No text files found to fetch contents for"
//       };
//     }

//     const files: { [storageid: string]: string } = {};
//     const BATCH_SIZE = 10;

//     for (let i = 0; i < results.records.length; i += BATCH_SIZE) {
//       const batch = results.records.slice(i, i + BATCH_SIZE);
//       await Promise.all(
//         batch.map(async (record) => {
//           try {
//             if (!record.name.toLowerCase().match(/\.(txt|text)$/)) {
//               return;
//             }

//             const url = `https://2.intelx.io/file/view?f=0&license=api&storageid=${encodeURIComponent(record.storageid)
//               }&bucket=${encodeURIComponent(record.bucket)}`;

//             const content = await request<string>(url, {
//               headers: {
//                 "x-key": process.env.X_KEY!,
//                 "Accept": "*/*",
//                 "Accept-Encoding": "gzip, deflate, br",
//                 "Connection": "keep-alive"
//               }
//             });

//             if (typeof content === 'string') {
//               files[record.storageid] = content;
//             } else {
//               files[record.storageid] = "Content format not supported";
//             }
//           } catch (err: any) {
//             console.error(`Failed to fetch content for file ${record.name}:`, err);

//             if (err.message?.includes('Payment Required')) {
//               files[record.storageid] = 'Premium content - Subscription required';
//             } else {
//               files[record.storageid] = `Unable to fetch content: ${err.message || 'Unknown error'}`;
//             }
//           }
//         })
//       );
//     }

//     const response = {
//       results,
//       files,
//       error: Object.values(files).every(content =>
//         content.includes('Premium content') || content.includes('Unable to fetch')
//       ) ? 'Some or all content requires premium access' : undefined
//     };

//     fileResultsCache[id] = {
//       timestamp: Date.now(),
//       data: response
//     };

//     return response;
//   } catch (error: any) {
//     if (cachedResult) {
//       console.log('Request failed, returning expired cache for ID:', id);
//       return cachedResult.data;
//     }

//     return {
//       results: { records: [], status: 0, id: id, count: 0 },
//       files: {},
//       error: error.message || "Failed to fetch IntelX text file contents.",
//     };
//   }
// } 