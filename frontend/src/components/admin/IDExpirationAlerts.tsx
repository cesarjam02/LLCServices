import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '@/services/api';
import { idExpiration } from '@/services/idExpiration';

export function IDExpirationAlerts({ refreshKey }: { refreshKey?: unknown }) {
  const [clients, setClients] = useState<Awaited<ReturnType<typeof api.idExpirations>>['clients']>(
    [],
  );
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    const load = () =>
      api
        .idExpirations()
        .then((result) => {
          if (active) {
            setClients(result.clients);
            setError('');
          }
        })
        .catch(() => {
          if (active) setError('No se pudieron comprobar los vencimientos de ID.');
        });
    void load();
    const timer = window.setInterval(() => void load(), 60000);
    const focus = () => void load();
    window.addEventListener('focus', focus);
    return () => {
      active = false;
      window.clearInterval(timer);
      window.removeEventListener('focus', focus);
    };
  }, [refreshKey]);
  if (error)
    return (
      <p className="admin-alert" role="status">
        {error}
      </p>
    );
  if (!clients.length) return null;
  return (
    <section
      className="admin-card id-expiration-alerts"
      aria-label="Identificaciones por actualizar"
    >
      <h2>Clientes que deben actualizar su ID</h2>
      <p>Identificaciones vencidas o que vencen en los próximos 7 días.</p>
      <ul>
        {clients.map((client) => (
          <li key={client.id}>
            <Link to={`/admin/clientes?client=${encodeURIComponent(client.id)}`}>
              {client.firstName} {client.lastName}
            </Link>
            <span className={`status-chip ${idExpiration(client.idExpirationDate).className}`}>
              {idExpiration(client.idExpirationDate).label}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
