import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, type DashboardSummary } from '@/services/api';

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

export function AdminDashboardPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    api
      .summary(year, month)
      .then(setData)
      .catch((reason) => setError(reason instanceof Error ? reason.message : 'Error'));
  }, [month, year]);
  const max = Math.max(1, ...(data?.daily.flatMap((day) => [day.income, day.expenses]) ?? [1]));
  return (
    <>
      <header className="admin-page-header">
        <div>
          <span>Panel administrativo</span>
          <h1>Vista general</h1>
          <p>Resumen financiero y actividad del negocio.</p>
        </div>
        <div className="period-controls">
          <select value={month} onChange={(e) => setMonth(Number(e.target.value))}>
            {months.map((name, index) => (
              <option value={index + 1} key={name}>
                {name}
              </option>
            ))}
          </select>
          <input type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} />
          <a href={api.reportUrl(year, month)}>Exportar Excel</a>
        </div>
      </header>
      {error && <p className="admin-alert">{error}</p>}
      <section className="metric-grid">
        <article>
          <span className="metric-icon income">↗</span>
          <p>Ingresos del mes</p>
          <strong>{money.format(data?.totals.income ?? 0)}</strong>
          <small>Operaciones completadas</small>
        </article>
        <article>
          <span className="metric-icon expense">↘</span>
          <p>Egresos del mes</p>
          <strong>{money.format(data?.totals.expenses ?? 0)}</strong>
          <small>Gastos registrados</small>
        </article>
        <article>
          <span className="metric-icon balance">$</span>
          <p>Balance neto</p>
          <strong>{money.format(data?.totals.balance ?? 0)}</strong>
          <small>Ingresos menos egresos</small>
        </article>
        <article>
          <span className="metric-icon clients">◎</span>
          <p>Clientes activos</p>
          <strong>{data?.totals.clients ?? 0}</strong>
          <small>{data?.totals.transactions ?? 0} movimientos este mes</small>
        </article>
      </section>
      <section className="dashboard-grid">
        <article className="admin-card chart-card">
          <div className="card-heading">
            <div>
              <h2>Actividad del mes</h2>
              <p>Ingresos y egresos diarios</p>
            </div>
            <div className="chart-legend">
              <span>
                <i className="income-dot" />
                Ingresos
              </span>
              <span>
                <i className="expense-dot" />
                Egresos
              </span>
            </div>
          </div>
          <div className="bar-chart">
            {data?.daily.map((day) => (
              <div className="bar-day" key={day.day}>
                <div className="bars">
                  <i
                    className="bar-income"
                    style={{ height: `${Math.max(2, (day.income / max) * 100)}%` }}
                  />
                  <i
                    className="bar-expense"
                    style={{ height: `${Math.max(2, (day.expenses / max) * 100)}%` }}
                  />
                </div>
                <small>{day.day % 5 === 0 || day.day === 1 ? day.day : ''}</small>
              </div>
            ))}
          </div>
        </article>
        <article className="admin-card method-card">
          <div className="card-heading">
            <div>
              <h2>Por método de pago</h2>
              <p>Volumen del periodo</p>
            </div>
          </div>
          {Object.entries(data?.byMethod ?? {}).map(([method, total]) => (
            <div className="method-row" key={method}>
              <span>
                {method === 'CASH'
                  ? 'Efectivo'
                  : method === 'CHECK'
                    ? 'Cheque'
                    : method === 'TRANSFER'
                      ? 'Transferencia'
                      : method}
              </span>
              <strong>{money.format(total)}</strong>
            </div>
          ))}
          {!Object.keys(data?.byMethod ?? {}).length && (
            <p className="empty-state">Aún no hay movimientos.</p>
          )}
        </article>
      </section>
      <section className="admin-card recent-card">
        <div className="card-heading">
          <div>
            <h2>Movimientos recientes</h2>
            <p>Últimos registros agregados</p>
          </div>
          <Link to="/admin/movimientos">Ver todos →</Link>
        </div>
        <div className="admin-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Categoría</th>
                <th>Cliente / proveedor</th>
                <th>Tipo</th>
                <th>Monto</th>
              </tr>
            </thead>
            <tbody>
              {data?.recent.map((item) => (
                <tr key={item.id}>
                  <td>{new Date(item.date).toLocaleDateString('es-US')}</td>
                  <td>{item.category.name}</td>
                  <td>{item.client?.name ?? item.provider ?? '—'}</td>
                  <td>
                    <span className={`status-chip ${item.type.toLowerCase()}`}>
                      {item.type === 'INCOME' ? 'Ingreso' : 'Egreso'}
                    </span>
                  </td>
                  <td className="amount">{money.format(Number(item.amount))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
