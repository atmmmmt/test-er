import { type FormEvent, useState } from 'react';
import { apiPost } from '../api/client';
import { showToast } from '../ui/toast';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('');
  async function submit(e: FormEvent) {
    e.preventDefault();
    const result = await apiPost('/session/login', { email, password });
    if (result.data?.accessToken) {
      localStorage.setItem('accessToken', result.data.accessToken);
      localStorage.setItem('refreshToken', result.data.refreshToken);
      setStatus('Logged in');
      showToast('Logged in successfully', 'success');
    } else {
      const text = result.message || 'Login failed';
      setStatus(text);
      showToast(text, 'error');
    }
  }
  return (
    <section className="panel glass">
      <h2>Login</h2>
      <form className="form" onSubmit={submit}>
        <input className="input" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className="input" placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <button className="primary">Login</button>
      </form>
      {status && <p className="muted">{status}</p>}
    </section>
  );
}
