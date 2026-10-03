import { Outlet } from 'react-router-dom';
import { Link } from 'react-router-dom';
import logo from '@/images/logo.jpeg';

export function AppLayout() {
  return (
    <div className="site-shell">
      <div className="topbar">
        <p>Envíos, pagos y gestiones con atención cercana y segura.</p>
        <div>
          <a href="tel:+17325295770">Llámanos: (732) 529-5770</a>
          <Link className="admin-access" to="/admin/login">
            Acceso administrativo
          </Link>
        </div>
      </div>
      <header className="site-header">
        <a className="brand" href="#inicio" aria-label="L & E Multiservices LLC, inicio">
          <img src={logo} alt="L & E Multiservices LLC" />
        </a>
        <nav aria-label="Navegación principal">
          <a href="#servicios">Servicios</a>
          <a href="#nosotros">Nosotros</a>
          <a href="#contacto">Contacto</a>
        </nav>
        <a className="header-cta" href="tel:+17325295770">
          Cotiza ahora
        </a>
      </header>
      <main>
        <Outlet />
      </main>
      <footer id="contacto" className="site-footer">
        <div className="footer-brand">
          <img src={logo} alt="L & E Multiservices LLC" />
          <p>Conectando familias y negocios con soluciones rápidas, claras y confiables.</p>
        </div>
        <div>
          <h3>Visítanos</h3>
          <address>
            236 North Ave
            <br />
            Dunellen, NJ 08812
          </address>
        </div>
        <div>
          <h3>Contáctanos</h3>
          <a href="tel:+17325295770">(732) 529-5770</a>
          <a href="tel:+17326049000">(732) 604-9000</a>
          <a href="mailto:lemultii@gmail.com">lemultii@gmail.com</a>
        </div>
        <p className="copyright">
          © {new Date().getFullYear()} L & E Multiservices LLC. Todos los derechos reservados.
        </p>
      </footer>
    </div>
  );
}
