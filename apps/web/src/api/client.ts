const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

type ApiResult = {
  data?: any;
  message?: string;
  status?: number;
};

function headers(): Record<string, string> {
  const token = localStorage.getItem('accessToken');
  return token ? { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } : { 'Content-Type': 'application/json' };
}

async function parse(res: Response): Promise<ApiResult> {
  try {
    const data = await res.json();
    if (!res.ok) return { message: data.message || 'Request failed', status: res.status };
    return data;
  } catch {
    return { message: 'Server is not reachable' };
  }
}

async function refreshToken() {
  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken) return false;
  try {
    const res = await fetch(`${API_URL}/session/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken })
    });
    const data = await parse(res);
    if (data.data?.accessToken) {
      localStorage.setItem('accessToken', data.data.accessToken);
      localStorage.setItem('refreshToken', data.data.refreshToken);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

async function request(path: string, options: RequestInit = {}, retry = true): Promise<ApiResult> {
  try {
    const res = await fetch(`${API_URL}${path}`, { ...options, headers: headers() });
    if (res.status === 401 && retry && await refreshToken()) return request(path, options, false);
    return parse(res);
  } catch {
    return { message: 'Server is not reachable' };
  }
}

export async function apiGet(path: string) {
  return request(path);
}

export async function apiPost(path: string, body: unknown) {
  return request(path, { method: 'POST', body: JSON.stringify(body) });
}
