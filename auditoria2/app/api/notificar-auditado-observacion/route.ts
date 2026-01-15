import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      observacion_id,
      auditoria_id,
      auditado_id,
      auditado_email,
      auditado_nombre,
    } = body;

    if (!observacion_id || !auditoria_id || !auditado_email) {
      return NextResponse.json(
        { error: 'Faltan campos obligatorios: observacion_id, auditoria_id, auditado_email' },
        { status: 400 }
      );
    }

    // Obtener datos completos de la observación
    const { data: observacionData, error: obsError } = await supabase
      .from('auditoria_observaciones')
      .select('*, auditoria:auditorias(id, estado)')
      .eq('id', observacion_id)
      .maybeSingle();

    if (obsError || !observacionData) {
      return NextResponse.json(
        { error: 'No se encontró la observación' },
        { status: 404 }
      );
    }

    // URL del webhook de N8N
    const webhookUrl = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL_NOTIFICAR_OBSERVACION || 
      'http://localhost:5678/webhook-test/notificar-auditado-observacion';

    console.log('📤 Llamando webhook N8N para notificar auditado por observación:', {
      observacion_id,
      auditado_email,
      webhookUrl,
    });

    // Preparar payload para N8N
    const webhookPayload = {
      observacion_id,
      auditoria_id,
      numero_observacion: observacionData.numero_observacion,
      titulo_observacion: observacionData.titulo_observacion,
      descripcion_observacion: observacionData.descripcion_observacion,
      recomendacion: observacionData.recomendacion,
      probabilidad: observacionData.probabilidad,
      impacto: observacionData.impacto,
      riesgo: observacionData.riesgo,
      auditado_id,
      auditado_email,
      auditado_nombre: auditado_nombre || auditado_email.split('@')[0],
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
    console.error('❌ Error en notificar-auditado-observacion:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Error interno del servidor',
        success: false
      },
      { status: 500 }
    );
  }
}
