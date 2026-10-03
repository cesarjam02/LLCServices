import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { api, type Client, type MoneyTransfer } from '@/services/api';

const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const months = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

export function AdminMoneyTransfersPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [company, setCompany] = useState('');
  const [bank, setBank] = useState('');
  const [currency, setCurrency] = useState('');
  const [clientId, setClientId] = useState('');
  const [clients, setClients] = useState<Client[]>([]);
  const [transfers, setTransfers] = useState<MoneyTransfer[]>([]);
  const [totals, setTotals] = useState({ amount: 0, commission: 0, count: 0, clients: 0 });
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const load = useCallback(async () => {
    const params = new URLSearchParams({ year: String(year), month: String(month) });
    if (company) params.set('company', company);
    if (bank) params.set('bank', bank);
    if (currency) params.set('currency', currency);
    if (clientId) params.set('clientId', clientId);
    try {
      const result = await api.moneyTransfers(params);
      setTransfers(result.transfers);
      setTotals(result.totals);
      setError('');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudieron cargar los giros');
    }
  }, [bank, clientId, company, currency, month, year]);

  useEffect(() => {
    api.clients().then(({ clients }) => setClients(clients));
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await api.createMoneyTransfer(new FormData(form));
      form.reset();
      setShowForm(false);
      setSuccess('Giro registrado correctamente. No fue agregado a ingresos ni egresos contables.');
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo guardar el giro');
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <header className="admin-page-header">
        <div>
          <span>Monitoreo mensual independiente</span>
          <h1>Giros de dinero</h1>
          <p>
            Control por cliente, compañía y divisa. Estos montos no forman parte de la contabilidad.
          </p>
        </div>
        <button className="admin-primary-button compact" onClick={() => setShowForm(!showForm)}>
          + Registrar giro
        </button>
      </header>

      {showForm && (
        <section className="admin-card inline-form-card">
          <div className="card-heading">
            <div>
              <h2>Nuevo giro</h2>
              <p>Adjunta el recibo correspondiente a esta operación.</p>
            </div>
            <button className="icon-button" onClick={() => setShowForm(false)} aria-label="Cerrar">
              ×
            </button>
          </div>
          <form className="admin-form form-grid transaction-form" onSubmit={submit}>
            <label>
              Fecha *
              <input
                type="date"
                name="date"
                defaultValue={now.toISOString().slice(0, 10)}
                required
              />
            </label>
            <label>
              Cliente *
              <select name="clientId" required>
                <option value="">Selecciona</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name} · {client.phone}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Monto enviado *<input type="number" name="amount" min="0.01" step="0.01" required />
            </label>
            <label>
              Comisión informativa
              <input type="number" name="commission" min="0" step="0.01" defaultValue="0" />
            </label>
            <label>
              Divisa *<input name="currency" defaultValue="USD" required />
            </label>
            <label>
              Compañía *<input name="company" placeholder="Intermex, AFEX, Boss…" required />
            </label>
            <label>
              Banco
              <input name="bank" />
            </label>
            <label>
              País de destino
              <input name="destinationCountry" />
            </label>
            <label>
              Beneficiario
              <input name="beneficiary" />
            </label>
            <label>
              Número de referencia
              <input name="referenceNumber" />
            </label>
            <label>
              Estado
              <select name="status">
                <option value="COMPLETED">Completado</option>
                <option value="PENDING">Pendiente</option>
                <option value="VOIDED">Anulado</option>
              </select>
            </label>
            <label className="file-field">
              Recibo <small>PDF, JPG o PNG · máx. 10 MB</small>
              <input type="file" name="receipt" accept=".pdf,.jpg,.jpeg,.png" />
            </label>
            <button className="admin-primary-button" disabled={saving}>
              {saving ? 'Guardando…' : 'Guardar giro'}
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

      <section className="metric-grid transfer-metrics">
        <article>
          <span className="metric-icon balance">$</span>
          <p>Total enviado</p>
          <strong>{money.format(totals.amount)}</strong>
          <small>No contabilizado como ingreso</small>
        </article>
        <article>
          <span className="metric-icon income">%</span>
          <p>Comisiones monitoreadas</p>
          <strong>{money.format(totals.commission)}</strong>
          <small>Dato separado de contabilidad</small>
        </article>
        <article>
          <span className="metric-icon clients">◎</span>
          <p>Clientes del periodo</p>
          <strong>{totals.clients}</strong>
          <small>Personas con giros</small>
        </article>
        <article>
          <span className="metric-icon expense">#</span>
          <p>Operaciones</p>
          <strong>{totals.count}</strong>
          <small>Sin contar anuladas</small>
        </article>
      </section>

      <section className="admin-card">
        <div className="transfer-filters">
          <select value={month} onChange={(event) => setMonth(Number(event.target.value))}>
            {months.map((name, index) => (
              <option key={name} value={index + 1}>
                {name}
              </option>
            ))}
          </select>
          <input
            type="number"
            value={year}
            onChange={(event) => setYear(Number(event.target.value))}
          />
          <input
            placeholder="Compañía"
            value={company}
            onChange={(event) => setCompany(event.target.value)}
          />
          <input
            placeholder="Banco"
            value={bank}
            onChange={(event) => setBank(event.target.value)}
          />
          <input
            placeholder="Divisa"
            value={currency}
            onChange={(event) => setCurrency(event.target.value)}
          />
          <select value={clientId} onChange={(event) => setClientId(event.target.value)}>
            <option value="">Todos los clientes</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </select>
          <button onClick={load}>Aplicar filtros</button>
        </div>
        <div className="admin-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Cliente</th>
                <th>Compañía / banco</th>
                <th>Destino</th>
                <th>Referencia</th>
                <th>Estado</th>
                <th>Monto</th>
                <th>Comisión</th>
                <th>Recibo</th>
              </tr>
            </thead>
            <tbody>
              {transfers.map((item) => (
                <tr key={item.id}>
                  <td>{new Date(item.date).toLocaleDateString('es-US')}</td>
                  <td>
                    <strong>{item.client.name}</strong>
                    <br />
                    <small>{item.client.phone}</small>
                  </td>
                  <td>
                    {item.company}
                    <br />
                    <small>{item.bank || '—'}</small>
                  </td>
                  <td>{item.destinationCountry || '—'}</td>
                  <td>{item.referenceNumber || '—'}</td>
                  <td>
                    <span className={`status-chip ${item.status.toLowerCase()}`}>
                      {item.status === 'COMPLETED'
                        ? 'Completado'
                        : item.status === 'VOIDED'
                          ? 'Anulado'
                          : 'Pendiente'}
                    </span>
                  </td>
                  <td className="amount">
                    {money.format(Number(item.amount))} {item.currency}
                  </td>
                  <td>{money.format(Number(item.commission))}</td>
                  <td>
                    {item.receiptPath ? (
                      <a className="receipt-link" href={api.moneyTransferReceiptUrl(item.id)}>
                        Descargar
                      </a>
                    ) : (
                      '—'
                    )}
                  </td>
                </tr>
              ))}
              {!transfers.length && (
                <tr>
                  <td colSpan={9} className="empty-state">
                    No hay giros para los filtros seleccionados.
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
