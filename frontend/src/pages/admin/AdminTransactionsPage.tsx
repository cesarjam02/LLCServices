import { useEffect, useState, type FormEvent } from 'react';
import { api, type Category, type Client, type Transaction } from '@/services/api';

const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
export function AdminTransactionsPage() {
  const [items, setItems] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [type, setType] = useState('INCOME');
  const [categoryId, setCategoryId] = useState('');
  const [clientSearch, setClientSearch] = useState('');
  const [selectedClientId, setSelectedClientId] = useState('');
  const [clientMenuOpen, setClientMenuOpen] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);
  const [typeFilter, setTypeFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const selectedCategory = categories.find((category) => category.id === categoryId);
  const categoryName = selectedCategory?.name.toLowerCase() ?? '';
  const isCourier = categoryName.includes('courier');
  const isMoneyOrder = categoryName.includes('money order');
  const isBillPayment = categoryName.includes('pago de facturas');
  const isAppointment = categoryName.includes('citas consulares');
  const isSimpleService =
    categoryName.includes('impresiones') ||
    categoryName.includes('tarjetas de presentación') ||
    categoryName.includes('extras');
  const isExpense = type === 'EXPENSE';
  const showClient = Boolean(selectedCategory);
  const showProvider = isCourier || isMoneyOrder || isBillPayment || isExpense;
  const showReference = isCourier || isMoneyOrder || isBillPayment || isAppointment || isExpense;
  const showBeneficiary = isCourier || isMoneyOrder || isAppointment;
  const normalizedClientSearch = clientSearch.trim().toLocaleLowerCase('es');
  const matchingClients = clients
    .filter((client) => {
      if (!normalizedClientSearch) return true;
      return `${client.name} ${client.phone}`
        .toLocaleLowerCase('es')
        .includes(normalizedClientSearch);
    })
    .slice(0, 25);
  const load = (query = '') =>
    api
      .transactions(query)
      .then(({ transactions }) => setItems(transactions))
      .catch((reason) => setError(reason instanceof Error ? reason.message : 'Error'));
  function applyFilters(nextType: string, nextCategory: string) {
    const params = new URLSearchParams();
    if (nextType) params.set('type', nextType);
    if (nextCategory) params.set('categoryId', nextCategory);
    setTypeFilter(nextType);
    setCategoryFilter(nextCategory);
    load(params.toString());
  }
  useEffect(() => {
    load();
    api.categories().then(({ categories }) => setCategories(categories));
    api.clients().then(({ clients }) => setClients(clients));
  }, []);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    if (showClient && !selectedClientId) {
      setError('Selecciona un cliente de las opciones encontradas');
      return;
    }
    const formData = new FormData(formElement);
    formData.set('type', type);
    setError('');
    setSuccess('');
    setSaving(true);
    try {
      await api.createTransaction(formData);
      formElement.reset();
      setCategoryId('');
      setClientSearch('');
      setSelectedClientId('');
      setClientMenuOpen(false);
      setShowForm(false);
      setSuccess('Movimiento registrado correctamente. La información quedó guardada.');
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo guardar');
    } finally {
      setSaving(false);
    }
  }
  return (
    <>
      <header className="admin-page-header">
        <div>
          <span>Contabilidad</span>
          <h1>Movimientos</h1>
          <p>Registra ingresos y egresos con los datos específicos de cada categoría.</p>
        </div>
        <div className="admin-page-actions">
          <button className="admin-primary-button compact" onClick={() => setShowForm(!showForm)}>
            + Nuevo movimiento
          </button>
          <div className="movement-type-tabs" aria-label="Filtrar movimientos por tipo">
            <button className={!typeFilter ? 'active' : ''} onClick={() => applyFilters('', '')}>
              Todos
            </button>
            <button
              className={typeFilter === 'INCOME' ? 'active income' : ''}
              onClick={() => applyFilters('INCOME', '')}
            >
              Ingresos
            </button>
            <button
              className={typeFilter === 'EXPENSE' ? 'active expense' : ''}
              onClick={() => applyFilters('EXPENSE', '')}
            >
              Egresos
            </button>
          </div>
        </div>
      </header>
      {showForm && (
        <section className="admin-card inline-form-card">
          <div className="card-heading">
            <div>
              <h2>Registrar movimiento</h2>
              <p>Selecciona una categoría para mostrar únicamente los campos necesarios.</p>
            </div>
            <button className="icon-button" onClick={() => setShowForm(false)}>
              ×
            </button>
          </div>
          <form className="admin-form form-grid transaction-form" onSubmit={submit}>
            <label>
              Tipo
              <select
                value={type}
                onChange={(e) => {
                  setType(e.target.value);
                  setCategoryId('');
                  setClientSearch('');
                  setSelectedClientId('');
                }}
              >
                <option value="INCOME">Ingreso</option>
                <option value="EXPENSE">Egreso</option>
              </select>
            </label>
            <label>
              Fecha
              <input
                type="date"
                name="date"
                defaultValue={new Date().toISOString().slice(0, 10)}
                required
              />
            </label>
            <label>
              Monto (USD) *
              <input type="number" name="amount" min="0.01" step="0.01" required />
            </label>
            <label>
              Método
              <select name="paymentMethod">
                <option value="CASH">Efectivo</option>
                <option value="CHECK">Cheque</option>
                <option value="TRANSFER">Transferencia</option>
                <option value="CARD">Tarjeta</option>
                <option value="OTHER">Otro</option>
              </select>
            </label>
            <label>
              Categoría
              <select
                name="categoryId"
                value={categoryId}
                onChange={(event) => {
                  setCategoryId(event.target.value);
                  setClientSearch('');
                  setSelectedClientId('');
                }}
                required
              >
                <option value="">Selecciona</option>
                {categories
                  .filter((c) => !c.type || c.type === type)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
              </select>
            </label>
            <label className="form-wide file-field">
              Comprobante * <small>PDF, JPG o PNG · máx. 8 MB</small>
              <input type="file" name="receipt" accept=".pdf,.jpg,.jpeg,.png" required />
            </label>
            {selectedCategory && (
              <div className="category-fields-heading form-wide">
                <strong>Datos para {selectedCategory.name}</strong>
                <small>Completa solamente la información relacionada con este servicio.</small>
              </div>
            )}
            {showClient && (
              <label className="searchable-client-field">
                Cliente *
                <div className="client-combobox">
                  <span className="client-search-icon" aria-hidden="true">
                    ⌕
                  </span>
                  <input
                    type="search"
                    name="clientSearch"
                    value={clientSearch}
                    onFocus={() => setClientMenuOpen(true)}
                    onBlur={() => window.setTimeout(() => setClientMenuOpen(false), 120)}
                    onChange={(event) => {
                      setClientSearch(event.target.value);
                      setSelectedClientId('');
                      setClientMenuOpen(true);
                      setError('');
                    }}
                    placeholder="Buscar por nombre o teléfono"
                    autoComplete="off"
                    aria-expanded={clientMenuOpen}
                    aria-controls="movement-client-options"
                    role="combobox"
                    required
                  />
                  {clientMenuOpen && (
                    <div className="client-options" id="movement-client-options" role="listbox">
                      {matchingClients.map((client) => (
                        <button
                          type="button"
                          role="option"
                          aria-selected={selectedClientId === client.id}
                          key={client.id}
                          onMouseDown={(event) => {
                            event.preventDefault();
                            setClientSearch(`${client.name} · ${client.phone}`);
                            setSelectedClientId(client.id);
                            setClientMenuOpen(false);
                          }}
                        >
                          <span>
                            {client.firstName.charAt(0)}
                            {client.lastName.charAt(0)}
                          </span>
                          <div>
                            <strong>{client.name}</strong>
                            <small>{client.phone}</small>
                          </div>
                          <i>Seleccionar</i>
                        </button>
                      ))}
                      {!matchingClients.length && (
                        <p>No se encontraron clientes con esa búsqueda.</p>
                      )}
                    </div>
                  )}
                </div>
                <input type="hidden" name="clientId" value={selectedClientId} />
                <small>
                  {selectedClientId
                    ? '✓ Cliente seleccionado correctamente'
                    : normalizedClientSearch
                      ? `${matchingClients.length} cliente${matchingClients.length === 1 ? '' : 's'} encontrado${matchingClients.length === 1 ? '' : 's'} · selecciona una opción`
                      : 'Escribe para filtrar la lista rápidamente'}
                </small>
              </label>
            )}
            {showProvider && (
              <label>
                {isBillPayment
                  ? 'Compañía de servicio'
                  : isCourier
                    ? 'Empresa de courier'
                    : isMoneyOrder
                      ? 'Emisor del Money Order'
                      : 'Proveedor / empresa'}
                <input name="provider" />
              </label>
            )}
            {showReference && (
              <label>
                Número de referencia
                <input name="referenceNumber" />
              </label>
            )}
            {showBeneficiary && (
              <label>
                {isAppointment ? 'Nombre del solicitante' : 'Beneficiario / destinatario'}
                <input name="beneficiary" />
              </label>
            )}
            {(isCourier || isMoneyOrder) && (
              <label>
                Teléfono del destinatario
                <input name="beneficiaryPhone" type="tel" />
              </label>
            )}
            {isCourier && (
              <label>
                Ciudad o país de destino
                <input name="destinationCity" />
              </label>
            )}
            {selectedCategory && (
              <label>
                Estado
                <select name="status">
                  <option value="COMPLETED">Completado</option>
                  <option value="PENDING">Pendiente</option>
                  <option value="VOIDED">Anulado</option>
                </select>
              </label>
            )}
            {selectedCategory && (
              <label className="form-wide">
                {isSimpleService ? 'Detalle del trabajo' : 'Descripción / notas'}
                <input name="description" />
              </label>
            )}
            <button className="admin-primary-button" disabled={saving}>
              {saving ? 'Guardando…' : 'Guardar movimiento'}
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
      <section className="admin-card">
        <div className="table-toolbar">
          <div className="filter-group">
            <select
              value={categoryFilter}
              onChange={(e) => {
                applyFilters(typeFilter, e.target.value);
              }}
            >
              <option value="">Todas las categorías</option>
              {categories
                .filter((category) => !typeFilter || !category.type || category.type === typeFilter)
                .map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
            </select>
          </div>
          <span>{items.length} registros mostrados</span>
        </div>
        <div className="admin-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Categoría</th>
                <th>Cliente / proveedor</th>
                <th>Método</th>
                <th>Referencia</th>
                <th>Estado</th>
                <th>Monto</th>
                <th>Recibo</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>{new Date(item.date).toLocaleDateString('es-US')}</td>
                  <td>
                    <strong>{item.category.name}</strong>
                  </td>
                  <td>{item.client?.name ?? item.provider ?? '—'}</td>
                  <td>{item.paymentMethod}</td>
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
                  <td className={`amount ${item.type.toLowerCase()}`}>
                    {item.type === 'EXPENSE' ? '- ' : '+ '}
                    {money.format(Number(item.amount))}
                  </td>
                  <td>
                    {item.receiptPath ? (
                      <a className="receipt-link" href={api.receiptUrl(item.id)}>
                        Ver
                      </a>
                    ) : (
                      '—'
                    )}
                  </td>
                </tr>
              ))}
              {!items.length && (
                <tr>
                  <td colSpan={8} className="empty-state">
                    Todavía no hay movimientos registrados.
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
