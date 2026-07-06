import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex flex-col bg-background text-foreground overflow-x-hidden">
      {/* Sección Principal (Hero) */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 sm:px-6 lg:px-8 mt-12 mb-24 relative">
        
        {/* Elementos decorativos de fondo (Glassmorphism / Glow) */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[60vw] max-w-[800px] max-h-[800px] bg-primary/5 rounded-full blur-[100px] -z-10 pointer-events-none"></div>
        <div className="absolute top-0 right-0 w-[40vw] h-[40vw] max-w-[500px] max-h-[500px] bg-secondary/10 rounded-full blur-[80px] -z-10 pointer-events-none"></div>

        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-secondary/10 text-secondary text-sm font-semibold mb-8 animate-pulse">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-secondary"></span>
          </span>
          Atención médica desde cualquier lugar
        </div>

        <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight max-w-4xl mb-6 leading-[1.1]">
          Tu salud, a una <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">videoconsulta</span> de distancia
        </h1>
        
        <p className="text-xl sm:text-2xl text-foreground/70 max-w-2xl mb-12 font-light leading-relaxed">
          Conéctate con los mejores especialistas de Veris sin salir de casa. Rápido, seguro y sin complicaciones.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <Link
            href="/agendar-cita"
            className="px-8 py-4 text-lg font-medium rounded-full bg-primary text-white hover:bg-primary-container transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-primary/20 transform hover:-translate-y-1 w-full sm:w-auto flex items-center justify-center gap-2"
          >
            Agendar Videoconsulta
          </Link>
          <Link
            href="/login"
            className="px-8 py-4 text-lg font-medium rounded-full bg-surface border border-primary/20 text-primary hover:bg-primary/5 transition-all duration-300 w-full sm:w-auto shadow-sm hover:shadow-md flex items-center justify-center"
          >
            Ya tengo una cuenta
          </Link>
        </div>
        
        {/* Estadísticas / Confianza */}
        <div className="mt-24 grid grid-cols-2 md:grid-cols-4 gap-8 pt-10 border-t border-foreground/10 max-w-4xl w-full">
          {[
            { label: 'Especialidades', value: '30+' },
            { label: 'Médicos Activos', value: '500+' },
            { label: 'Pacientes Satisfechos', value: '1M+' },
            { label: 'Disponibilidad', value: '24/7' },
          ].map((stat, i) => (
            <div key={i} className="flex flex-col items-center transition-transform hover:scale-105 duration-300">
              <span className="text-3xl font-extrabold text-foreground mb-1">{stat.value}</span>
              <span className="text-xs font-bold text-foreground/50 uppercase tracking-widest">{stat.label}</span>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
