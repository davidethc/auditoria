import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { informe_id } = await request.json();

    if (!informe_id) {
      return NextResponse.json(
        { error: 'Falta informe_id' },
        { status: 400 }
      );
    }

    // URL del webhook de N8N
    const webhookUrl = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL_GENERAR_WORD || 
      'http://localhost:5678/webhook-test/generar-word-informe';

    console.log('📤 Llamando webhook de N8N:', webhookUrl);
    console.log('📋 Informe ID:', informe_id);

    // Llamar al webhook de N8N
    let response;
    try {
      // Crear timeout manual si AbortSignal.timeout no está disponible
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 segundos
      
      response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ informe_id }),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
    } catch (fetchError) {
      console.error('❌ Error de conexión con N8N:', fetchError);
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        throw new Error(`Timeout: N8N no respondió en 60 segundos. Verifica que el workflow esté activo.`);
      }
      throw new Error(`No se pudo conectar con N8N. Verifica que esté corriendo en ${webhookUrl}`);
    }

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Sin detalles');
      console.error('❌ Error del webhook:', response.status, errorText);
      throw new Error(`Error al llamar webhook de N8N: ${response.status} - ${errorText.substring(0, 200)}`);
    }

    // Verificar si la respuesta es JSON válido
    const contentType = response.headers.get('content-type');
    let resultado;
    
    if (contentType && contentType.includes('application/json')) {
      try {
        const text = await response.text();
        resultado = text ? JSON.parse(text) : { success: true };
      } catch (parseError) {
        console.error('❌ Error parseando respuesta de N8N:', parseError);
        // Si N8N devuelve algo que no es JSON, asumimos éxito
        resultado = { success: true, message: 'Solicitud enviada a N8N' };
      }
    } else {
      const text = await response.text().catch(() => '');
      console.log('⚠️ Respuesta de N8N no es JSON:', text);
      resultado = { success: true, message: 'Solicitud enviada a N8N' };
    }
    
    console.log('✅ Respuesta del webhook:', resultado);

    return NextResponse.json({
      success: true,
      message: 'Solicitud de generación de Word enviada correctamente',
      resultado
    });

  } catch (error) {
    console.error('❌ Error generando Word:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Error interno del servidor',
        success: false
      },
      { status: 500 }
    );
  }
}
