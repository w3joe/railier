const API_BASE = '/api';

export interface ApiError {
  message: string;
  status: number;
}

async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error: ApiError = {
      message: `API error: ${response.statusText}`,
      status: response.status,
    };
    throw error;
  }

  return response.json();
}

// Guardrails API
export const guardrailsApi = {
  list: () => fetchApi<{ guardrails: unknown[] }>('/guardrails'),
  
  get: (id: string) => fetchApi<{ guardrail: unknown }>(`/guardrails/${id}`),
  
  create: (data: { name: string; description: string; blocks: unknown[]; connections: unknown[] }) =>
    fetchApi<{ guardrail: unknown }>('/guardrails', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  update: (id: string, data: { name?: string; description?: string; blocks?: unknown[]; connections?: unknown[] }) =>
    fetchApi<{ guardrail: unknown }>(`/guardrails/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  
  delete: (id: string) =>
    fetchApi<{ success: boolean }>(`/guardrails/${id}`, {
      method: 'DELETE',
    }),
  
  evaluate: (id: string, data: { message: string; context?: Record<string, unknown>; userRole?: string }) =>
    fetchApi<{ result: unknown }>(`/guardrails/${id}/evaluate`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// AI API
export const aiApi = {
  generateBlocks: (prompt: string, existingBlocks?: unknown[]) =>
    fetchApi<{ blocks: unknown[]; connections: unknown[]; explanation: string }>('/ai/generate-blocks', {
      method: 'POST',
      body: JSON.stringify({ prompt, existingBlocks }),
    }),
  
  importDocument: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return fetch(`${API_BASE}/ai/import-document`, {
      method: 'POST',
      body: formData,
    }).then((res) => res.json());
  },
};

// Block templates API
export const blocksApi = {
  getTemplates: () => fetchApi<{ templates: unknown[] }>('/blocks/templates'),
};
