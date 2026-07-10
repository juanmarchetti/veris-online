import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import { verificarUsuario } from '@/utils/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  // Verificar sesión: puede ser paciente o médico (o admin)
  const { error: authError, user } = await verificarUsuario(['paciente', 'medico', 'admin'])
  if (authError || !user) {
    return new NextResponse('No autorizado', { status: 401 })
  }

  const supabase = await createClient()

  // Buscar el diagnóstico
  const { data: diagnostico, error: dbError } = await supabase
    .from('historial_clinico')
    .select(`
      *,
      pacientes (id_auth_user, nombre_completo, numero_identificacion),
      medicos (id_auth_user, nombre_completo),
      citas (fecha_hora, especialidades(nombre))
    `)
    .eq('id', id)
    .single()

  if (dbError || !diagnostico) {
    console.error('Error db pdf:', dbError)
    return new NextResponse('Diagnóstico no encontrado', { status: 404 })
  }

  // Autorización (RLS ya podría filtrar, pero por seguridad doble check):
  // El paciente solo puede ver lo suyo, el médico lo que emitió, admin todo.
  const idAuthPaciente = diagnostico.pacientes?.id_auth_user
  const idAuthMedico = diagnostico.medicos?.id_auth_user

  if (user.role !== 'admin' && user.id !== idAuthPaciente && user.id !== idAuthMedico) {
    return new NextResponse('Acceso denegado', { status: 403 })
  }

  try {
    const pdfDoc = await PDFDocument.create()
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
    const page = pdfDoc.addPage([595.28, 841.89]) // A4
    const { width, height } = page.getSize()
    let y = height - 50

    const drawText = (text: string, size = 12, isBold = false, color = rgb(0,0,0), xOffset = 50) => {
      const f = isBold ? fontBold : font
      page.drawText(text, { x: xOffset, y, size, font: f, color })
      y -= (size + 6)
    }

    const drawMultiline = (text: string, size = 11, xOffset = 50) => {
      if (!text) return
      const maxWidth = width - 100
      const words = text.split(' ')
      let line = ''
      for (const word of words) {
        const testLine = line + word + ' '
        const testWidth = font.widthOfTextAtSize(testLine, size)
        if (testWidth > maxWidth && line !== '') {
          drawText(line, size, false, rgb(0,0,0), xOffset)
          line = word + ' '
        } else {
          line = testLine
        }
      }
      if (line) drawText(line, size, false, rgb(0,0,0), xOffset)
    }

    // Cabecera
    drawText('Veris Online - Registro Clínico', 18, true, rgb(0.1, 0.4, 0.8))
    y -= 10
    
    drawText(`Fecha de emisión: ${new Date().toLocaleDateString('es-EC')}`, 10)
    y -= 20

    // Datos del Paciente
    drawText('DATOS DEL PACIENTE', 12, true, rgb(0.2, 0.2, 0.2))
    drawText(`Nombre: ${diagnostico.pacientes?.nombre_completo || 'N/A'}`)
    drawText(`Identificación: ${diagnostico.pacientes?.numero_identificacion || 'N/A'}`)
    y -= 10

    // Datos de la Consulta
    drawText('DATOS DE LA CONSULTA', 12, true, rgb(0.2, 0.2, 0.2))
    drawText(`Médico Tratante: Dr(a). ${diagnostico.medicos?.nombre_completo || 'N/A'}`)
    drawText(`Especialidad: ${diagnostico.citas?.especialidades?.nombre || 'N/A'}`)
    drawText(`Fecha Consulta: ${new Date(diagnostico.citas?.fecha_hora || diagnostico.fecha).toLocaleString('es-EC')}`)
    y -= 15

    // Diagnóstico Clínico
    drawText('INFORME MÉDICO', 14, true, rgb(0.1, 0.4, 0.8))
    y -= 10

    if (diagnostico.motivo_consulta) {
      drawText('Motivo de Consulta:', 11, true)
      drawMultiline(diagnostico.motivo_consulta)
      y -= 5
    }

    if (diagnostico.sintomas_reportados) {
      drawText('Síntomas Reportados (Subjetivo):', 11, true)
      drawMultiline(diagnostico.sintomas_reportados)
      y -= 5
    }

    if (diagnostico.diagnostico) {
      drawText('Diagnóstico (Análisis):', 11, true)
      drawMultiline(diagnostico.diagnostico)
      y -= 5
    }

    if (diagnostico.tratamiento_indicado) {
      drawText('Tratamiento / Plan (Plan):', 11, true)
      drawMultiline(diagnostico.tratamiento_indicado)
      y -= 5
    }

    if (diagnostico.observaciones) {
      drawText('Observaciones:', 11, true)
      drawMultiline(diagnostico.observaciones)
      y -= 5
    }

    if (diagnostico.requiere_valoracion_presencial) {
      y -= 10
      drawText('ATENCIÓN: EL PACIENTE REQUIERE VALORACIÓN MÉDICA PRESENCIAL.', 12, true, rgb(0.8, 0.1, 0.1))
    }

    // Pie de página
    y = 50
    page.drawLine({
      start: { x: 50, y: 65 },
      end: { x: width - 50, y: 65 },
      thickness: 1,
      color: rgb(0.8, 0.8, 0.8)
    })
    drawText('Documento generado automáticamente por Veris Online. Válido sin firma.', 9, false, rgb(0.4, 0.4, 0.4))

    const pdfBytes = await pdfDoc.save()
    const pdfBody = pdfBytes.buffer.slice(pdfBytes.byteOffset, pdfBytes.byteOffset + pdfBytes.byteLength) as ArrayBuffer

    return new NextResponse(pdfBody, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="Diagnostico_${diagnostico.pacientes?.nombre_completo.replace(/\s+/g, '_')}_${new Date(diagnostico.fecha).toISOString().split('T')[0]}.pdf"`,
      },
    })
  } catch (err: unknown) {
    console.error('Error generando PDF:', err)
    return new NextResponse('Error interno al generar PDF', { status: 500 })
  }
}
