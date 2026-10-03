const API_URL =
  import.meta.env.VITE_API_URL ??
  `${window.location.protocol}//${window.location.hostname}:3000/api/v1`;

export interface AdminUser {
  id: string;
  username: string;
  name: string;
  role: string;
}
export interface Client {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
  identification?: string;
  documentPath?: string;
  documentName?: string;
  active: boolean;
  _count?: { transactions: number };
}
export interface Category {
  id: string;
  name: string;
  type?: 'INCOME' | 'EXPENSE';
}
export interface Transaction {
  id: string;
  date: string;
  type: 'INCOME' | 'EXPENSE';
  paymentMethod: string;
  status: string;
  amount: string;
  provider?: string;
  referenceNumber?: string;
  description?: string;
  receiptPath?: string;
  client?: Client;
  category: Category;
  createdBy?: { name: string };
}
export interface DashboardSummary {
  period: { year: number; month: number };
  totals: {
    income: number;
    expenses: number;
    balance: number;
    transactions: number;
    clients: number;
  };
  byMethod: Record<string, number>;
  daily: Array<{ day: number; income: number; expenses: number }>;
  recent: Transaction[];
}
export interface MoneyTransfer {
  id: string;
  date: string;
  amount: string;
  commission: string;
  currency: string;
  company: string;
  bank?: string;
  destinationCountry?: string;
  beneficiary?: string;
  referenceNumber?: string;
  status: 'COMPLETED' | 'PENDING' | 'VOIDED';
  receiptPath?: string;
  receiptName?: string;
  client: Client;
  createdBy: { name: string };
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const isForm = options.body instanceof FormData;
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: 'include',
    headers: { ...(isForm ? {} : { 'Content-Type': 'application/json' }), ...options.headers },
  });
  if (response.status === 204) return undefined as T;
  const data = (await response.json()) as T & { error?: { message: string } };
  if (!response.ok) throw new Error(data.error?.message ?? 'No se pudo completar la solicitud');
  return data;
}

export const api = {
  login: (username: string, password: string) =>
    request<{ user: AdminUser }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),
  logout: () => request<void>('/auth/logout', { method: 'POST' }),
  me: () => request<{ user: AdminUser }>('/auth/me'),
  summary: (year: number, month: number) =>
    request<DashboardSummary>(`/admin/dashboard/summary?year=${year}&month=${month}`),
  reportUrl: (year: number, month: number) =>
    `${API_URL}/admin/dashboard/report.xlsx?year=${year}&month=${month}`,
  clients: (search = '') =>
    request<{ clients: Client[] }>(`/admin/clients?search=${encodeURIComponent(search)}`),
  createClient: (data: FormData) =>
    request<{ client: Client }>('/admin/clients', { method: 'POST', body: data }),
  updateClient: (id: string, data: FormData) =>
    request<{ client: Client }>(`/admin/clients/${id}`, { method: 'PATCH', body: data }),
  clientDocumentUrl: (id: string) => `${API_URL}/admin/clients/${id}/document`,
  categories: () => request<{ categories: Category[] }>('/admin/categories'),
  transactions: (params = '') =>
    request<{
      transactions: Transaction[];
      pagination: { page: number; total: number; pages: number };
    }>(`/admin/transactions${params ? `?${params}` : ''}`),
  createTransaction: (data: FormData) =>
    request<{ transaction: Transaction }>('/admin/transactions', { method: 'POST', body: data }),
  receiptUrl: (id: string) => `${API_URL}/admin/transactions/${id}/receipt`,
  moneyTransfers: (params: URLSearchParams) =>
    request<{
      period: { year: number; month: number };
      totals: { amount: number; commission: number; count: number; clients: number };
      transfers: MoneyTransfer[];
    }>(`/admin/money-transfers?${params.toString()}`),
  createMoneyTransfer: (data: FormData) =>
    request<{ transfer: MoneyTransfer }>('/admin/money-transfers', {
      method: 'POST',
      body: data,
    }),
  moneyTransferReceiptUrl: (id: string) => `${API_URL}/admin/money-transfers/${id}/receipt`,
};
