import { useState, type FormEvent } from 'react';
import { Navigate, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/auth/AuthContext';
import logo from '@/images/logo.jpeg';

export function AdminLoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  if (user) return <Navigate to="/admin" replace />;
  async function submit(event: FormEvent) {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      await login(username, password);
      navigate('/admin');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo iniciar sesión');
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="login-page">
      <section className="login-panel">
        <Link to="/">
          <img src={logo} alt="L & E Multiservices" />
        </Link>
        <div className="login-heading">
          <span>Área privada</span>
          <h1>Acceso administrativo</h1>
          <p>Ingresa tus credenciales para gestionar la contabilidad del negocio.</p>
        </div>
        <form onSubmit={submit}>
          <label>
            Usuario
            <input
              autoComplete="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              required
            />
          </label>
          <label>
            Contraseña
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>
          {error && <p className="form-error">{error}</p>}
          <button className="admin-primary-button" disabled={busy}>
            {busy ? 'Verificando…' : 'Ingresar al sistema'} <span>→</span>
          </button>
        </form>
        <Link className="back-home" to="/">
          ← Volver al sitio web
        </Link>
      </section>
      <section className="login-art">
        <div>
          <span>Control financiero</span>
          <h2>Tu negocio, organizado en un solo lugar.</h2>
          <p>Movimientos, clientes, comprobantes e informes protegidos y siempre disponibles.</p>
        </div>
      </section>
    </main>
  );
}
