import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '@/auth/AuthContext';
import logo from '@/images/logo.jpeg';

export function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  async function signOut() {
    await logout();
    navigate('/admin/login');
  }
  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <img className="admin-logo" src={logo} alt="L & E Multiservices" />
        <nav>
          <NavLink end to="/admin">
            <span>⌂</span>Vista general
          </NavLink>
          <NavLink to="/admin/movimientos">
            <span>↕</span>Movimientos
          </NavLink>
          <NavLink to="/admin/clientes">
            <span>◎</span>Clientes
          </NavLink>
          <NavLink to="/admin/giros">
            <span>↗</span>Giros
          </NavLink>
        </nav>
        <div className="admin-user">
          <span>{user?.name.charAt(0)}</span>
          <div>
            <strong>{user?.name}</strong>
            <small>Administrador</small>
          </div>
          <button onClick={signOut} title="Cerrar sesión">
            ↪
          </button>
        </div>
      </aside>
      <div className="admin-main">
        <Outlet />
      </div>
    </div>
  );
}
