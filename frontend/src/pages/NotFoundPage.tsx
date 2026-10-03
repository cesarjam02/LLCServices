import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <section className="not-found">
      <span>404</span>
      <h1>Página no encontrada</h1>
      <Link to="/">Volver al inicio</Link>
    </section>
  );
}
