// src/utils/resend.ts

import { createClient } from '@/utils/supabase/server'

export async function enviarCorreoConfirmacion(idCita: string) {
  const isResendEnabled = process.env.RESEND_API_KEY && process.env.RESEND_API_KEY !== '';

  if (!isResendEnabled) {
    console.log('Resend no configurado. Simulando envío de correo de confirmación...');
    return { success: true, simulated: true };
  }

  try {
    const supabase = await createClient()

    // Obtener detalles de la cita para el correo
    const { data: cita } = await supabase
      .from('citas')
      .select(`
        fecha_hora,
        enlace_zoom,
        pacientes (correo, nombre_completo),
        medicos (nombre_completo),
        especialidades (nombre)
      `)
      .eq('id', idCita)
      .single()

    if (!cita) throw new Error('Cita no encontrada');

    // Aquí iría la lógica real usando el SDK de Resend:
    const { Resend } = await import('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);
    
    // Asignación de tipos explícita por como retorna Supabase las relaciones
    const paciente = cita.pacientes as unknown as { correo: string, nombre_completo: string }
    const medico = cita.medicos as unknown as { nombre_completo: string }
    const especialidad = cita.especialidades as unknown as { nombre: string }
    
    await resend.emails.send({
      from: 'Veris Online <onboarding@resend.dev>', // Usar correo verificado por resend, o onboarding
      to: paciente.correo,
      subject: 'Confirmación de Videoconsulta Veris',
      html: `
        <h1>¡Videoconsulta Confirmada!</h1>
        <p>Hola ${paciente.nombre_completo},</p>
        <p>Tu cita con el/la Dr(a). ${medico.nombre_completo} para <strong>${especialidad.nombre}</strong> ha sido confirmada.</p>
        <p><strong>Fecha y Hora:</strong> ${new Date(cita.fecha_hora).toLocaleString('es-EC')}</p>
        <p><strong>Enlace Zoom:</strong> <a href="${cita.enlace_zoom}">${cita.enlace_zoom || 'Pendiente de generación'}</a></p>
        <br/>
        <p>Gracias por confiar en Veris.</p>
      `
    });

    console.log(`Correo enviado exitosamente a: ${(cita.pacientes as any).correo}`);
    return { success: true };
  } catch (err) {
    // Fallos silenciosos como requiere la especificación (no rompe el flujo del usuario)
    console.error('Error enviando correo de confirmación:', err);
    return { success: false, error: err };
  }
}
