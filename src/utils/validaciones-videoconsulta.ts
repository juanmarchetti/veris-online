export function estaEnVentanaDeConexion(fechaHoraCita: Date, ahora: Date = new Date()): boolean {
  const diffMs = fechaHoraCita.getTime() - ahora.getTime();
  const TRES_MINUTOS_MS = 3 * 60 * 1000;
  return diffMs <= TRES_MINUTOS_MS; // true también si la cita ya pasó (permite reconexión)
}
