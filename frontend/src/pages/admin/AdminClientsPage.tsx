import { useEffect, useState, type FormEvent } from 'react';
import { api, type Client } from '@/services/api';

export function AdminClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);

  const load = (term = '') =>
    api
      .clients(term)
      .then(({ clients }) => setClients(clients))
      .catch((reason) => setError(reason instanceof Error ? reason.message : 'Error'));

  useEffect(() => {
    load();
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setError('');
    setSuccess('');
    setSaving(true);
    try {
      const result = await api.createClient(new FormData(form));
      form.reset();
      setShowForm(false);
      setSelectedClient(result.client);
      setSuccess('Cliente creado correctamente. Sus datos y el archivo quedaron guardados.');
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo guardar');
    } finally {
      setSaving(false);
    }
  }

  async function updateProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedClient) return;
    setError('');
    setSuccess('');
    setSaving(true);
    try {
      const result = await api.updateClient(selectedClient.id, new FormData(event.currentTarget));
      setSelectedClient(result.client);
      setClients((current) =>
        current.map((client) => (client.id === result.client.id ? result.client : client)),
      );
      setEditingProfile(false);
      setSuccess('Perfil actualizado correctamente. Los cambios quedaron guardados.');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudieron guardar los cambios');
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <header className="admin-page-header">
        <div>
          <span>Base de datos</span>
          <h1>Clientes</h1>
          <p>Información personal, identificación, documentos e historial de movimientos.</p>
        </div>
        <button className="admin-primary-button compact" onClick={() => setShowForm(!showForm)}>
          + Nuevo cliente
        </button>
      </header>

      {showForm && (
        <section className="admin-card inline-form-card">
          <div className="card-heading">
            <div>
              <h2>Registrar cliente</h2>
              <p>Los campos marcados con * son obligatorios.</p>
            </div>
            <button className="icon-button" onClick={() => setShowForm(false)} aria-label="Cerrar">
              ×
            </button>
          </div>
          <form className="admin-form form-grid client-form" onSubmit={submit}>
            <label>
              Nombre *
              <input name="firstName" autoComplete="given-name" required minLength={2} />
            </label>
            <label>
              Apellido *
              <input name="lastName" autoComplete="family-name" required minLength={2} />
            </label>
            <label>
              Teléfono *
              <input name="phone" type="tel" autoComplete="tel" required minLength={7} />
            </label>
            <label>
              Dirección *
              <input name="address" autoComplete="street-address" required minLength={5} />
            </label>
            <label>
              Identificación <small>Opcional</small>
              <input name="identification" />
            </label>
            <label className="file-field">
              Identificación o CV <small>PDF, JPG, PNG, DOC o DOCX · máx. 10 MB</small>
              <input type="file" name="document" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" />
            </label>
            <button className="admin-primary-button" disabled={saving}>
              {saving ? 'Guardando…' : 'Guardar y ver perfil'}
            </button>
          </form>
        </section>
      )}

      {error && <p className="admin-alert">{error}</p>}
      {success && (
        <p className="admin-success" role="status">
          ✓ {success}
        </p>
      )}

      {selectedClient && (
        <section className="admin-card client-profile-card">
          <div className="client-profile-header">
            <div className="client-avatar">
              {selectedClient.firstName.charAt(0)}
              {selectedClient.lastName.charAt(0)}
            </div>
            <div>
              <span>Perfil del cliente</span>
              <h2>
                {selectedClient.firstName} {selectedClient.lastName}
              </h2>
              <p>Cliente activo · {selectedClient._count?.transactions ?? 0} movimientos</p>
            </div>
            <button
              className="profile-edit-button"
              onClick={() => setEditingProfile((current) => !current)}
            >
              {editingProfile ? 'Cancelar edición' : 'Editar perfil'}
            </button>
            <button
              className="icon-button"
              onClick={() => setSelectedClient(null)}
              aria-label="Cerrar perfil"
            >
              ×
            </button>
          </div>
          {editingProfile ? (
            <form className="admin-form form-grid client-edit-form" onSubmit={updateProfile}>
              <label>
                Nombre *
                <input
                  name="firstName"
                  defaultValue={selectedClient.firstName}
                  required
                  minLength={2}
                />
              </label>
              <label>
                Apellido *
                <input
                  name="lastName"
                  defaultValue={selectedClient.lastName}
                  required
                  minLength={2}
                />
              </label>
              <label>
                Teléfono *
                <input
                  name="phone"
                  type="tel"
                  defaultValue={selectedClient.phone}
                  required
                  minLength={7}
                />
              </label>
              <label>
                Dirección *
                <input
                  name="address"
                  defaultValue={selectedClient.address}
                  required
                  minLength={5}
                />
              </label>
              <label>
                Identificación <small>Opcional</small>
                <input name="identification" defaultValue={selectedClient.identification ?? ''} />
              </label>
              <label className="file-field">
                Adjuntar o reemplazar identificación/CV
                <small>PDF, JPG, PNG, DOC o DOCX · máx. 10 MB</small>
                <input type="file" name="document" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" />
              </label>
              <button className="admin-primary-button" disabled={saving}>
                {saving ? 'Guardando cambios…' : 'Guardar cambios'}
              </button>
            </form>
          ) : (
            <div className="client-profile-details">
              <div>
                <small>Teléfono</small>
                <strong>{selectedClient.phone}</strong>
              </div>
              <div>
                <small>Dirección</small>
                <strong>{selectedClient.address}</strong>
              </div>
              <div>
                <small>Identificación</small>
                <strong>{selectedClient.identification || 'No registrada'}</strong>
              </div>
              <div>
                <small>Documento</small>
                {selectedClient.documentPath ? (
                  <div className="profile-document-row">
                    <strong>{selectedClient.documentName ?? 'Archivo adjunto'}</strong>
                    <a
                      className="document-button"
                      href={api.clientDocumentUrl(selectedClient.id)}
                      download={selectedClient.documentName ?? true}
                    >
                      ↓ Descargar
                    </a>
                  </div>
                ) : (
                  <strong>Sin archivo adjunto</strong>
                )}
              </div>
            </div>
          )}
        </section>
      )}

      <section className="admin-card">
        <div className="table-toolbar">
          <div className="search-box">
            ⌕
            <input
              placeholder="Buscar por nombre, apellido, teléfono o ID"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') load(search);
              }}
            />
          </div>
          <button onClick={() => load(search)}>Buscar</button>
        </div>
        <div className="admin-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Teléfono</th>
                <th>Identificación</th>
                <th>Dirección</th>
                <th>Documento</th>
                <th>Movimientos</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {clients.map((client) => (
                <tr key={client.id}>
                  <td>
                    <strong>
                      {client.firstName} {client.lastName}
                    </strong>
                  </td>
                  <td>{client.phone}</td>
                  <td>{client.identification || '—'}</td>
                  <td>{client.address}</td>
                  <td>
                    {client.documentPath ? (
                      <span className="status-chip active">Adjunto</span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td>{client._count?.transactions ?? 0}</td>
                  <td>
                    <button className="table-action" onClick={() => setSelectedClient(client)}>
                      Ver perfil
                    </button>
                  </td>
                </tr>
              ))}
              {!clients.length && (
                <tr>
                  <td colSpan={7} className="empty-state">
                    No se encontraron clientes.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
