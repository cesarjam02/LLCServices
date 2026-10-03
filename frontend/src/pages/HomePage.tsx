import storefrontWide from '@/images/imagen1.png';
import storefrontClose from '@/images/imagen2.png';
import moneyTransferBrands from '@/images/girosimg.png';
import courierCountries from '@/images/paisescourier.png';

const services = [
  {
    icon: '↗',
    title: 'Envíos de dinero',
    description: 'Transfiere dinero de forma rápida y confiable con atención personalizada.',
    href: '#giros',
  },
  {
    icon: '✈',
    title: 'Courier aéreo y marítimo',
    description: 'Enviamos tus paquetes y mercancía a múltiples destinos con seguridad.',
    href: '#courier',
  },
  {
    icon: '$',
    title: 'Money Orders',
    description: 'Obtén tus giros de pago de manera sencilla y con el respaldo que necesitas.',
    href: 'tel:+17325295770',
  },
  {
    icon: '▤',
    title: 'Impresiones y fax',
    description: 'Soluciones prácticas para imprimir, copiar y enviar tus documentos.',
    href: 'tel:+17325295770',
  },
  {
    icon: '✓',
    title: 'Citas consulares',
    description: 'Te ayudamos a gestionar tus citas y procesos consulares con claridad.',
    href: 'tel:+17325295770',
  },
  {
    icon: '⌁',
    title: 'Pago de facturas',
    description: 'Paga tus servicios y facturas en un solo lugar, sin complicaciones.',
    href: 'tel:+17325295770',
  },
];

export function HomePage() {
  return (
    <>
      <section id="inicio" className="hero" style={{ backgroundImage: `url(${storefrontWide})` }}>
        <div className="hero-overlay" />
        <div className="hero-content">
          <span className="hero-kicker">Tu punto de confianza en Dunellen, New Jersey</span>
          <h1>
            Todo lo que necesitas, <em>en un solo lugar.</em>
          </h1>
          <p>
            Transfiere, paga y envía con la tranquilidad de contar con un equipo que entiende tus
            necesidades y cuida cada gestión.
          </p>
          <div className="hero-actions">
            <a className="button button-primary" href="tel:+17325295770">
              Llamar ahora <span>→</span>
            </a>
            <a className="button button-secondary" href="#servicios">
              Ver servicios
            </a>
          </div>
        </div>
        <div className="hero-trust">
          <div>
            <strong>Atención</strong>
            <span>Personalizada</span>
          </div>
          <div>
            <strong>Envíos</strong>
            <span>Rápidos y seguros</span>
          </div>
          <div>
            <strong>Servicio</strong>
            <span>En español</span>
          </div>
        </div>
      </section>

      <section id="servicios" className="services-section section-wrap">
        <div className="section-heading">
          <div>
            <span className="section-label">Nuestros servicios</span>
            <h2>Soluciones que hacen tu día más fácil</h2>
          </div>
          <p>
            Resolvemos tus diligencias cotidianas con rapidez, experiencia y el trato humano que
            mereces.
          </p>
        </div>
        <div className="services-grid">
          {services.map((service) => (
            <article className="service-card" key={service.title}>
              <span className="service-icon" aria-hidden="true">
                {service.icon}
              </span>
              <h3>{service.title}</h3>
              <p>{service.description}</p>
              <a href={service.href} aria-label={`Conocer más sobre ${service.title}`}>
                Conocer más <span>→</span>
              </a>
            </article>
          ))}
        </div>
      </section>

      <section className="featured-services">
        <article id="giros" className="featured-service money-service section-wrap">
          <div className="featured-service-copy">
            <span className="section-label">Giros y transferencias</span>
            <h2>Envía dinero con respaldo y atención de confianza</h2>
            <p>
              Te ayudamos a realizar tus giros de manera rápida, clara y segura. Trabajamos con
              reconocidas compañías de transferencias para brindarte alternativas según tu destino y
              necesidad.
            </p>
            <ul className="service-benefits">
              <li>
                <span>✓</span>Varias opciones de envío en un solo lugar
              </li>
              <li>
                <span>✓</span>Orientación personalizada antes de cada transacción
              </li>
              <li>
                <span>✓</span>Servicio rápido y completamente en español
              </li>
            </ul>
            <a
              className="button button-primary featured-cta"
              href="https://wa.me/17326049000?text=Hola%2C%20quiero%20informaci%C3%B3n%20sobre%20giros%20de%20dinero."
              target="_blank"
              rel="noreferrer"
            >
              Consultar un giro <span>→</span>
            </a>
          </div>
          <div className="featured-image-card brands-card">
            <div className="image-card-heading">
              <span>Nuestras alianzas y servicios</span>
              <strong>Opciones para cada necesidad</strong>
            </div>
            <img
              src={moneyTransferBrands}
              alt="Compañías y servicios disponibles para giros de dinero en L & E Multiservices"
            />
          </div>
        </article>

        <article
          id="courier"
          className="featured-service featured-service-reverse courier-service section-wrap"
        >
          <div className="featured-service-copy">
            <span className="section-label">Courier internacional</span>
            <h2>Tus paquetes más cerca de quienes los esperan</h2>
            <p>
              Realizamos envíos de courier a destinos seleccionados de Latinoamérica. Te orientamos
              con la preparación de tu paquete y la alternativa de envío más conveniente.
            </p>
            <div className="country-list" aria-label="Países disponibles para courier">
              {[
                'Ecuador',
                'Colombia',
                'Venezuela',
                'Guatemala',
                'Honduras',
                'Nicaragua',
                'México',
                'El Salvador',
              ].map((country) => (
                <span key={country}>{country}</span>
              ))}
            </div>
            <a
              className="button button-primary featured-cta"
              href="https://wa.me/17326049000?text=Hola%2C%20quiero%20cotizar%20un%20env%C3%ADo%20de%20courier."
              target="_blank"
              rel="noreferrer"
            >
              Cotizar mi envío <span>→</span>
            </a>
          </div>
          <div className="featured-image-card countries-card">
            <div className="image-card-heading">
              <span>Destinos disponibles</span>
              <strong>Conectamos contigo y tu familia</strong>
            </div>
            <img
              src={courierCountries}
              alt="Banderas de Ecuador, Colombia, Venezuela, Guatemala, Honduras, Nicaragua, México y El Salvador"
            />
          </div>
        </article>
      </section>

      <section id="nosotros" className="about-section">
        <div className="about-image-wrap">
          <div className="about-shape" />
          <img src={storefrontClose} alt="Entrada del local L & E Multiservices en Dunellen" />
          <div className="location-badge">
            <span>⌖</span>
            <p>
              <strong>Estamos cerca de ti</strong>236 North Ave, Dunellen
            </p>
          </div>
        </div>
        <div className="about-copy">
          <span className="section-label">Conócenos</span>
          <h2>Más que servicios, somos parte de tu comunidad</h2>
          <p>
            En L & E Multiservices sabemos que detrás de cada envío, pago o documento hay algo
            importante para ti. Por eso te atendemos con paciencia, transparencia y dedicación.
          </p>
          <ul>
            <li>
              <span>✓</span>Atención amable y personalizada
            </li>
            <li>
              <span>✓</span>Procesos claros y confiables
            </li>
            <li>
              <span>✓</span>Una ubicación accesible en Dunellen
            </li>
          </ul>
          <a
            className="text-link"
            href="https://maps.google.com/?q=236+North+Ave+Dunellen+NJ+08812"
            target="_blank"
            rel="noreferrer"
          >
            Cómo llegar <span>→</span>
          </a>
        </div>
      </section>

      <section className="contact-banner">
        <div>
          <span className="section-label light">Estamos para ayudarte</span>
          <h2>¿Necesitas enviar, pagar o gestionar un trámite?</h2>
          <p>Cuéntanos qué necesitas y recibe atención directa de nuestro equipo.</p>
        </div>
        <div className="contact-actions">
          <a
            className="button button-light"
            href="https://wa.me/17326049000?text=Hola%2C%20quisiera%20informaci%C3%B3n%20sobre%20sus%20servicios."
            target="_blank"
            rel="noreferrer"
          >
            Escríbenos por WhatsApp
          </a>
          <a className="button button-outline-light" href="mailto:lemultii@gmail.com">
            Enviar un correo
          </a>
        </div>
      </section>
    </>
  );
}
