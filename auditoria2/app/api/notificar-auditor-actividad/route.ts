import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      activity_id,
      activity_number,
      activity_description,
      auditor_id,
      auditor_email,
      auditor_name,
      validation_status,
    } = body;

    if (!activity_id || !auditor_email) {
      return NextResponse.json(
        { error: 'Falta activity_id o auditor_email' },
        { status: 400 }
      );
    }

    // URL del webhook de N8N
    const webhookUrl = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL_NOTIFICAR_AUDITOR_ACTIVIDAD || 
      'http://localhost:5678/webhook-test/notificar-auditor-actividad';

    console.log('📤 Llamando webhook N8N para notificar auditor:', {
      activity_id,
      auditor_email,
      webhookUrl,
    });

    // Preparar payload para N8N
    const webhookPayload = {
      activity_id,
      activity_number: activity_number || null,
      activity_description: activity_description || null,
      auditor_id,
      auditor_email,
      auditor_name: auditor_name || null,
      validation_status: validation_status || 'pendiente',
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
      
      // No lanzar error crítico, solo loguear
      // El correo se puede enviar manualmente si falla N8N
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
    console.error('❌ Error en notificar-auditor-actividad:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Error interno del servidor',
        success: false
      },
      { status: 500 }
    );
  }
}
