// Footer global de Veris Online — Diseño Stitch
// Contiene: Marca, Copyright, Contact Center (SRS), Términos y Privacidad

export default function Footer() {
  return (
    <footer
      style={{
        background: 'var(--surface-container-highest)',
        borderTop: '1px solid var(--outline-variant)',
        padding: '1.5rem 2rem',
      }}
    >
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
        }}
      >
        {/* Brand */}
        <span style={{ fontWeight: 700, fontSize: '18px', color: 'var(--primary)' }}>
          Veris Online
        </span>

        {/* Copyright */}
        <span style={{ fontSize: '13px', color: 'var(--on-surface-variant)' }}>
          © 2024 Veris Online. Todos los derechos reservados.
        </span>

        {/* Links + Contact */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--on-surface-variant)' }}>
            Contact Center: <strong>6009600</strong>
          </span>
          <a
            href="#"
            style={{ fontSize: '13px', color: 'var(--on-surface-variant)', textDecoration: 'underline' }}
          >
            Términos y Condiciones
          </a>
          <a
            href="#"
            style={{ fontSize: '13px', color: 'var(--on-surface-variant)', textDecoration: 'underline' }}
          >
            Privacidad
          </a>
        </div>
      </div>
    </footer>
  );
}
