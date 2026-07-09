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

    console.log(`Correo enviado exitosamente a: ${(cita.pacientes as unknown as { correo: string }).correo}`);
    return { success: true };
  } catch (err) {
    // Fallos silenciosos como requiere la especificación (no rompe el flujo del usuario)
    console.error('Error enviando correo de confirmación:', err);
    return { success: false, error: err };
  }
}

export async function enviarCorreoDocumentoClinico(idDocumento: string) {
  const isResendEnabled = process.env.RESEND_API_KEY && process.env.RESEND_API_KEY !== '';

  if (!isResendEnabled) {
    console.log('Resend no configurado. Simulando envío de correo de documento clínico...');
    return { success: true, simulated: true };
  }

  try {
    const supabase = await createClient()

    // Obtener detalles del documento para el correo
    const { data: doc } = await supabase
      .from('documentos_clinicos')
      .select(`
        tipo_documento,
        url_archivo,
        citas (
          pacientes (correo, nombre_completo),
          medicos (nombre_completo)
        )
      `)
      .eq('id', idDocumento)
      .single()

    if (!doc) throw new Error('Documento no encontrado');

    const cita = doc.citas as unknown as { 
      pacientes: { correo: string; nombre_completo: string }, 
      medicos: { nombre_completo: string } 
    }
    if (!cita) throw new Error('Cita no encontrada para el documento');

    const paciente = cita.pacientes
    const medico = cita.medicos

    const { Resend } = await import('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);
    
    await resend.emails.send({
      from: 'Veris Online <onboarding@resend.dev>', // Usar correo verificado
      to: paciente.correo,
      subject: 'Nuevo Documento Clínico Veris',
      html: `
        <h1>Nuevo Documento Disponible</h1>
        <p>Hola ${paciente.nombre_completo},</p>
        <p>El/La Dr(a). ${medico.nombre_completo} ha subido un nuevo documento de tipo: <strong>${doc.tipo_documento}</strong>.</p>
        <p>Puedes revisarlo en tu historial médico o mediante el siguiente enlace:</p>
        <p><a href="${doc.url_archivo}">Ver Documento</a></p>
        <br/>
        <p>Gracias por confiar en Veris.</p>
      `
    });

    console.log(`Correo de documento enviado exitosamente a: ${paciente.correo}`);
    return { success: true };
  } catch (err) {
    console.error('Error enviando correo de documento clínico:', err);
    return { success: false, error: err };
  }
}

export async function enviarCorreoReprogramacion(idCita: string, minutosRetraso: number) {
  const isResendEnabled = process.env.RESEND_API_KEY && process.env.RESEND_API_KEY !== '';
  if (!isResendEnabled) return { success: true, simulated: true };

  try {
    const supabase = await createClient()
    const { data: cita } = await supabase
      .from('citas')
      .select(`fecha_hora, pacientes (correo, nombre_completo)`)
      .eq('id', idCita).single()
    if (!cita) throw new Error('Cita no encontrada');
    const paciente = cita.pacientes as unknown as { correo: string, nombre_completo: string }
    const { Resend } = await import('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: 'Veris Online <onboarding@resend.dev>',
      to: paciente.correo,
      subject: 'Reprogramación de Cita por Urgencia',
      html: `
        <h1>Reprogramación de tu Cita</h1>
        <p>Hola ${paciente.nombre_completo},</p>
        <p>Tu cita fue movida ${minutosRetraso} minutos por una urgencia médica.</p>
        <p><strong>Nueva Fecha y Hora:</strong> ${new Date(cita.fecha_hora).toLocaleString('es-EC')}</p>
        <br/>
        <p>Gracias por tu comprensión.</p>
      `
    });
    return { success: true };
  } catch (err) {
    console.error('Error enviando correo de reprogramación:', err);
    return { success: false, error: err };
  }
}

export async function enviarCorreoResultadoUrgencia(idCita: string, aceptada: boolean) {
  const isResendEnabled = process.env.RESEND_API_KEY && process.env.RESEND_API_KEY !== '';
  if (!isResendEnabled) return { success: true, simulated: true };

  try {
    const supabase = await createClient()
    const { data: cita } = await supabase
      .from('citas')
      .select(`fecha_hora, pacientes (correo, nombre_completo)`)
      .eq('id', idCita).single()
    if (!cita) throw new Error('Cita no encontrada');
    const paciente = cita.pacientes as unknown as { correo: string, nombre_completo: string }
    const { Resend } = await import('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);
    
    let htmlContent = '';
    if (aceptada) {
      htmlContent = `
        <h1>Solicitud Urgente Aceptada</h1>
        <p>Hola ${paciente.nombre_completo},</p>
        <p>Tu solicitud de cita urgente ha sido aceptada.</p>
        <p>Ingresa ya a la plataforma para unirte a tu videoconsulta.</p>
      `;
    } else {
      htmlContent = `
        <h1>Solicitud Urgente Reagendada</h1>
        <p>Hola ${paciente.nombre_completo},</p>
        <p>Tu médico no pudo atender tu urgencia en este momento, pero te ha asignado el siguiente espacio disponible:</p>
        <p><strong>Nueva Fecha y Hora:</strong> ${new Date(cita.fecha_hora).toLocaleString('es-EC')}</p>
        <p>Puedes proceder al pago para confirmarla.</p>
      `;
    }

    await resend.emails.send({
      from: 'Veris Online <onboarding@resend.dev>',
      to: paciente.correo,
      subject: aceptada ? 'Urgencia Aceptada' : 'Respuesta a tu Solicitud Urgente',
      html: htmlContent
    });
    return { success: true };
  } catch (err) {
    console.error('Error enviando correo de resultado de urgencia:', err);
    return { success: false, error: err };
  }
}
