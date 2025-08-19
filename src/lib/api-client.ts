type FetchOptions = Omit<RequestInit, 'body'> & {
  body?: unknown;
};

export async function apiClient(url: string, options: FetchOptions = {}) {
  const { body, ...customConfig } = options;

  const config: RequestInit = {
    ...customConfig,
    credentials: 'include', // Always include credentials for cookie support
    headers: {
      'Content-Type': 'application/json',
      ...customConfig.headers,
    },
  };

  if (body !== undefined) {
    config.body = typeof body === 'string' ? body : JSON.stringify(body);
  }

  const response = await fetch(url, config);

  // Try to parse JSON first, even if content-type is missing or incorrect
  const contentType = response.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');

  try {
    if (isJson) {
      const data = await response.json();
      if (!response.ok) {
        const message = data?.error || data?.message || JSON.stringify(data) || `${response.status} ${response.statusText}`;
        throw new Error(message);
      }
      return data;
    }
  } catch {
    // If JSON parsing failed, fall through to text handling
  }

  // Fallback to text handling for non-JSON or parse failures
  const text = await response.text().catch(() => '');
  if (!response.ok) {
    const message = text?.trim() || `${response.status} ${response.statusText}`;
    throw new Error(message);
  }

  // If OK but not JSON, return raw text
  return text;
}

export const api = {
  get: (url: string) => apiClient(url, { method: 'GET' }),
  post: (url: string, body?: unknown) => apiClient(url, { method: 'POST', body }),
  put: (url: string, body?: unknown) => apiClient(url, { method: 'PUT', body }),
  delete: (url: string) => apiClient(url, { method: 'DELETE' }),
  patch: (url: string, body?: unknown) => apiClient(url, { method: 'PATCH', body }),
};