import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      solicitud_id,
      auditoria_id,
      auditado_id,
      auditado_email,
      auditado_nombre,
      titulo,
      descripcion,
      tipo_documento,
      fecha_limite,
      solicitado_por_nombre,
      solicitado_por_email,
    } = body;

    if (!solicitud_id || !auditoria_id || !auditado_email || !titulo || !descripcion) {
      return NextResponse.json(
        { error: 'Faltan campos obligatorios' },
        { status: 400 }
      );
    }

    // URL del webhook de N8N
    const webhookUrl = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL_NOTIFICAR_SOLICITUD_DOC || 
      'http://localhost:5678/webhook-test/notificar-auditado-solicitud-documentacion';

    console.log('📤 Llamando webhook N8N para notificar auditado sobre solicitud de documentación:', {
      solicitud_id,
      auditado_email,
      webhookUrl,
    });

    // Preparar payload para N8N
    const webhookPayload = {
      solicitud_id,
      auditoria_id,
      auditado_id,
      auditado_email,
      auditado_nombre: auditado_nombre || auditado_email.split('@')[0],
      titulo,
      descripcion,
      tipo_documento: tipo_documento || null,
      fecha_limite: fecha_limite || null,
      solicitado_por_nombre: solicitado_por_nombre || null,
      solicitado_por_email: solicitado_por_email || null,
      timestamp: new Date().toISOString(),
    };

    // Llamar al webhook de N8N
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(webhookPayload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error del webhook:', response.status, errorText);
      
      return NextResponse.json({
        success: false,
        message: `Error al llamar webhook de N8N: ${response.status}`,
        error: errorText,
      }, { status: 500 });
    }

    const resultado = await response.json();
    console.log('✅ Respuesta del webhook:', resultado);

    return NextResponse.json({
      success: true,
      message: 'Notificación enviada exitosamente',
      resultado,
    });

  } catch (error) {
    console.error('❌ Error en notificar-auditado-solicitud-documentacion:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Error interno del servidor',
        success: false
      },
      { status: 500 }
    );
  }
}
