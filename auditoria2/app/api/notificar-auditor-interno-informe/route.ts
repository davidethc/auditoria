import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      informe_id,
      auditoria_id,
    } = body;

    if (!informe_id || !auditoria_id) {
      return NextResponse.json(
        { error: 'Faltan campos obligatorios: informe_id, auditoria_id' },
        { status: 400 }
      );
    }

    // Obtener datos completos del informe
    const { data: informeData, error: informeError } = await supabase
      .from('auditoria_informe')
      .select('*, auditoria:auditorias(id, estado)')
      .eq('id', informe_id)
      .maybeSingle();

    if (informeError || !informeData) {
      return NextResponse.json(
        { error: 'No se encontró el informe' },
        { status: 404 }
      );
    }

    // Obtener auditor interno
    const { data: auditorInternoData, error: auditorError } = await supabase
      .from('users')
      .select('id, email, full_name')
      .eq('role', 'auditor_interno')
      .limit(1)
      .maybeSingle();

    if (auditorError || !auditorInternoData) {
      return NextResponse.json(
        { error: 'No se encontró el auditor interno' },
        { status: 404 }
      );
    }

    // URL del webhook de N8N
    const webhookUrl = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL_NOTIFICAR_AUDITOR_INTERNO || 
      'http://localhost:5678/webhook-test/notificar-auditor-interno-informe';

    console.log('📤 Llamando webhook N8N para notificar auditor interno:', {
      informe_id,
      auditor_interno_email: auditorInternoData.email,
      webhookUrl,
    });

    // Preparar payload para N8N
    const webhookPayload = {
      informe_id,
      auditoria_id,
      encabezado: informeData.encabezado,
      asunto: informeData.asunto,
      de: informeData.de,
      para: informeData.para,
      fecha_inicio_informe: informeData.fecha_inicio_informe,
      auditor_interno_id: auditorInternoData.id,
      auditor_interno_email: auditorInternoData.email,
      auditor_interno_nombre: auditorInternoData.full_name || auditorInternoData.email.split('@')[0],
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
    console.error('❌ Error en notificar-auditor-interno-informe:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Error interno del servidor',
        success: false
      },
      { status: 500 }
    );
  }
}
