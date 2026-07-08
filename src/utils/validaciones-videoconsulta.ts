export function estaEnVentanaDeConexion(fechaHoraCita: Date, duracionMinutos: number = 60, ahora: Date = new Date()): boolean {
  const diffMs = fechaHoraCita.getTime() - ahora.getTime();
  const TRES_MINUTOS_MS = 3 * 60 * 1000;
  
  if (estaCitaExpirada(fechaHoraCita, duracionMinutos, ahora)) {
    return false;
  }

  return diffMs <= TRES_MINUTOS_MS;
}

export function estaCitaExpirada(fechaHoraCita: Date, duracionMinutos: number = 60, ahora: Date = new Date()): boolean {
  const LIMITE_RECONEXION_MS = (duracionMinutos * 60 * 1000) + (2 * 60 * 60 * 1000);
  return ahora.getTime() > fechaHoraCita.getTime() + LIMITE_RECONEXION_MS;
}
