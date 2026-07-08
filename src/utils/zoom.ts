type ZoomTokenCache = { token: string; expiresAt: number } | null;
let tokenCache: ZoomTokenCache = null;

async function obtenerTokenZoom(): Promise<string> {
  const ahora = Date.now();
  if (tokenCache && tokenCache.expiresAt > ahora + 60_000) {
    return tokenCache.token; // reutilizar mientras falte más de 1 min para expirar
  }

  const basicAuth = Buffer.from(
    `${process.env.ZOOM_CLIENT_ID}:${process.env.ZOOM_CLIENT_SECRET}`
  ).toString("base64");

  const res = await fetch(
    `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${process.env.ZOOM_ACCOUNT_ID}`,
    { method: "POST", headers: { Authorization: `Basic ${basicAuth}` } }
  );

  if (!res.ok) {
    throw new ZoomApiError(`Error obteniendo token de Zoom: ${res.status}`);
  }

  const data = await res.json();
  tokenCache = { token: data.access_token, expiresAt: ahora + data.expires_in * 1000 };
  return tokenCache.token;
}

export class ZoomApiError extends Error {}

export async function generarEnlaceZoom(
  idCita: string,
  fechaHora: string | Date,
  motivo: string
): Promise<string> {
  const zoomHabilitado = process.env.ZOOM_ENABLED === "true";

  if (!zoomHabilitado) {
    // Caso intencional: feature apagado a propósito. Mock explícito y visible como tal.
    console.info(`[zoom:mock] ZOOM_ENABLED=false, generando enlace simulado para cita ${idCita}`);
    return `https://veris.example/mock-meeting/${idCita}`;
  }

  // Caso real: si esto falla, NO debe degradar a un mock silencioso.
  // El error se propaga para que la página guardián lo muestre como error real.
  const token = await obtenerTokenZoom();
  const fechaIso = typeof fechaHora === 'string' ? new Date(fechaHora).toISOString() : fechaHora.toISOString();
  
  const res = await fetch("https://api.zoom.us/v2/users/me/meetings", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      topic: `Consulta Veris — ${motivo}`,
      type: 2, // scheduled meeting
      start_time: fechaIso,
      duration: 30,
      settings: { join_before_host: true, waiting_room: false },
    }),
  });

  if (!res.ok) {
    const detalle = await res.text().catch(() => "");
    console.error(`[zoom:error] Falló creación de reunión para cita ${idCita}: ${res.status} ${detalle}`);
    throw new ZoomApiError("No se pudo generar el enlace de la consulta con Zoom");
  }

  const data = await res.json();
  return data.join_url as string;
}

export function _clearZoomTokenCacheForTests() {
  tokenCache = null;
}
