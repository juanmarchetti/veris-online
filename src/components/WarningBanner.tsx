// SRS RF-06.3 [FUENTE]: Advertencia de urgencias — siempre visible en el top de la página.
// "El sitio debe informar claramente que el servicio no debe usarse en caso de urgencias o emergencias."

export default function WarningBanner() {
  return (
    <div
      style={{
        background: 'var(--error)',
        color: 'var(--on-error)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        padding: '0.6rem 1.5rem',
        textAlign: 'center',
        fontSize: '13px',
        fontWeight: 500,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
      }}
    >
      {/* Triangle warning icon via SVG */}
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 2L1 21h22L12 2zm0 3.516L21.016 19H2.984L12 5.516zM11 10v4h2v-4h-2zm0 6v2h2v-2h-2z"/>
      </svg>
      Este servicio no debe usarse en caso de urgencias o emergencias
    </div>
  );
}
