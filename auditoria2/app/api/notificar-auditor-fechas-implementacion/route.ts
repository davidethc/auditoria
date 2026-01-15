import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      observacion_id,
      auditoria_id,
      auditor_id,
      auditor_email,
      auditor_nombre,
      observacion_numero,
      observacion_titulo,
      observacion_descripcion,
      fecha_inicio,
      fecha_fin,
      estrategia,
      entregable,
      auditado_nombre,
      auditado_email,
    } = body;

    if (!observacion_id || !auditoria_id || !auditor_email || !fecha_inicio || !fecha_fin) {
      return NextResponse.json(
        { error: 'Faltan campos obligatorios' },
        { status: 400 }
      );
    }

    // URL del webhook de N8N
    const webhookUrl = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL_NOTIFICAR_FECHAS_IMPLEMENTACION || 
      'http://localhost:5678/webhook-test/notificar-auditor-fechas-implementacion';

    console.log('📤 Llamando webhook N8N para notificar auditor sobre fechas:', {
      observacion_id,
      auditor_email,
      webhookUrl,
    });

    // Preparar payload para N8N
    const webhookPayload = {
      observacion_id,
      auditoria_id,
      auditor_id,
      auditor_email,
      auditor_nombre: auditor_nombre || auditor_email.split('@')[0],
      observacion_numero,
      observacion_titulo,
      observacion_descripcion,
      fecha_inicio,
      fecha_fin,
      estrategia: estrategia || null,
      entregable: entregable || null,
      auditado_nombre: auditado_nombre || auditado_email?.split('@')[0] || 'Auditado',
      auditado_email: auditado_email || null,
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
    console.error('❌ Error en notificar-auditor-fechas-implementacion:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Error interno del servidor',
        success: false
      },
      { status: 500 }
    );
  }
}
