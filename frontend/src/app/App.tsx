import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from '@/auth/AuthContext';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AppLayout } from '@/components/layout/AppLayout';
import { AdminClientsPage } from '@/pages/admin/AdminClientsPage';
import { AdminDashboardPage } from '@/pages/admin/AdminDashboardPage';
import { AdminLoginPage } from '@/pages/admin/AdminLoginPage';
import { AdminTransactionsPage } from '@/pages/admin/AdminTransactionsPage';
import { AdminMoneyTransfersPage } from '@/pages/admin/AdminMoneyTransfersPage';
import { HomePage } from '@/pages/HomePage';
import { NotFoundPage } from '@/pages/NotFoundPage';

function ProtectedAdmin() {
  const { user, loading } = useAuth();
  if (loading) return <div className="admin-loading">Preparando tu espacio…</div>;
  return user ? <AdminLayout /> : <Navigate to="/admin/login" replace />;
}

export function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<HomePage />} />
      </Route>
      <Route path="admin/login" element={<AdminLoginPage />} />
      <Route path="admin" element={<ProtectedAdmin />}>
        <Route index element={<AdminDashboardPage />} />
        <Route path="movimientos" element={<AdminTransactionsPage />} />
        <Route path="clientes" element={<AdminClientsPage />} />
        <Route path="giros" element={<AdminMoneyTransfersPage />} />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
