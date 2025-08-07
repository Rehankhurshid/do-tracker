interface FetchOptions extends RequestInit {
  body?: any;
}

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

  if (body) {
    config.body = JSON.stringify(body);
  }

  const response = await fetch(url, config);
  
  // Handle non-JSON responses
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'An error occurred');
    }
    return data;
  }
  
  if (!response.ok) {
    throw new Error('An error occurred');
  }
  
  return response;
}

export const api = {
  get: (url: string) => apiClient(url, { method: 'GET' }),
  post: (url: string, body?: any) => apiClient(url, { method: 'POST', body }),
  put: (url: string, body?: any) => apiClient(url, { method: 'PUT', body }),
  delete: (url: string) => apiClient(url, { method: 'DELETE' }),
  patch: (url: string, body?: any) => apiClient(url, { method: 'PATCH', body }),
};