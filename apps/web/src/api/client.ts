const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

function headers() {
  const token = localStorage.getItem('accessToken');
  return token ? { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } : { 'Content-Type': 'application/json' };
}

export async function apiGet(path: string) {
  const res = await fetch(`${API_URL}${path}`, { headers: headers() });
  return res.json();
}

export async function apiPost(path: string, body: unknown) {
  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(body)
  });
  return res.json();
}
