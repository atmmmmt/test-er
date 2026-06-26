const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

function headers() {
  const token = localStorage.getItem('accessToken');
  return token ? { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } : { 'Content-Type': 'application/json' };
}

async function parse(res: Response) {
  try {
    const data = await res.json();
    if (!res.ok) return { message: data.message || 'Request failed' };
    return data;
  } catch {
    return { message: 'Server is not reachable' };
  }
}

export async function apiGet(path: string) {
  try {
    const res = await fetch(`${API_URL}${path}`, { headers: headers() });
    return parse(res);
  } catch {
    return { message: 'Server is not reachable' };
  }
}

export async function apiPost(path: string, body: unknown) {
  try {
    const res = await fetch(`${API_URL}${path}`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(body)
    });
    return parse(res);
  } catch {
    return { message: 'Server is not reachable' };
  }
}
