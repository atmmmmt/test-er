import { useState } from 'react';

export function LoginPage() {
  const [email, setEmail] = useState('');
  return (
    <section className="panel glass">
      <h2>Login</h2>
      <form className="form">
        <input className="input" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className="input" placeholder="Password" type="password" />
        <button className="primary">Login</button>
      </form>
    </section>
  );
}
