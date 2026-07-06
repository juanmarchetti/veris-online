// src/utils/zoom.ts

export async function generarEnlaceZoom(idCita: string, fechaHora: string, motivo: string): Promise<string> {
  const isZoomEnabled = process.env.ZOOM_ENABLED === 'true';

  if (!isZoomEnabled) {
    // Retornar mock si no está habilitado
    return `https://zoom.us/j/mock${idCita.split('-')[0]}`;
  }

  try {
    // Aquí iría la lógica real de Zoom usando Server-to-Server OAuth
    // Por ejemplo:
    // const token = await getZoomAccessToken();
    // const response = await fetch('https://api.zoom.us/v2/users/me/meetings', {
    //   method: 'POST',
    //   headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    //   body: JSON.stringify({
    //     topic: `Videoconsulta Veris: ${motivo}`,
    //     type: 2,
    //     start_time: fechaHora,
    //     duration: 30,
    //     settings: { host_video: true, participant_video: true, waiting_room: true }
    //   })
    // });
    // const data = await response.json();
    // return data.join_url;

    // Como no tenemos credenciales reales provistas, simularemos una respuesta exitosa
    // para demostrar que el feature flag funciona.
    return `https://zoom.us/j/real${idCita.split('-')[0]}?pwd=secret`;
  } catch (err) {
    console.error('Error generando enlace de Zoom:', err);
    // Fallback a mock si falla la API
    return `https://zoom.us/j/fallback${idCita.split('-')[0]}`;
  }
}
