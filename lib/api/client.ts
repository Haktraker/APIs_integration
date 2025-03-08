"use server";

export async function get<T>(url: string, options: RequestInit = {}): Promise<T> {
  try {
    const response = await fetch(url, {
      ...options,
      method: 'GET',
      next: { revalidate: 0 }
    });
    
    if (!response.ok) {
      throw new Error(response.statusText || `Request failed with status ${response.status}`);
    }
    
    return await response.json() as T;
  } catch (error: any) {
    console.error(`GET request failed: ${url}`, error);
    throw error;
  }
}

export async function post<T>(url: string, data: any, options: RequestInit = {}): Promise<T> {
  try {
    const response = await fetch(url, {
      ...options,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      body: JSON.stringify(data),
      next: { revalidate: 0 }
    });
    
    if (!response.ok) {
      throw new Error(response.statusText || `Request failed with status ${response.status}`);
    }
    
    return await response.json() as T;
  } catch (error: any) {
    console.error(`POST request failed: ${url}`, error);
    throw error;
  }
}

export async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  try {
    const response = await fetch(url, {
      ...options,
      next: { revalidate: 0 }
    });
    
    if (!response.ok) {
      throw new Error(response.statusText || `Request failed with status ${response.status}`);
    }
    
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json() as T;
    } else {
      const text = await response.text();
      return text as unknown as T;
    }
  } catch (error: any) {
    console.error(`Request failed: ${url}`, error);
    throw error;
  }
}

export const isValidIP = (input: string) =>
  /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(input);

export const isValidDomain = (input: string) =>
  /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i.test(input); 