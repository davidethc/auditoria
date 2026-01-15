import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import * as XLSX from 'xlsx';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const auditoriaId = searchParams.get('auditoria_id');
    
    if (!auditoriaId) {
      return NextResponse.json(
        { error: 'auditoria_id es requerido' },
        { status: 400 }
      );
    }

    // Obtener observaciones con relaciones
    const { data: observaciones, error: obsError } = await supabase
      .from('auditoria_observaciones')
      .select('*')
      .eq('auditoria_id', auditoriaId)
      .order('numero_observacion', { ascending: true });

    if (obsError) {
      console.error('Error obteniendo observaciones:', obsError);
      throw obsError;
    }

    if (!observaciones || observaciones.length === 0) {
      return NextResponse.json(
        { error: 'No hay observaciones para exportar' },
        { status: 404 }
      );
    }

    // Obtener datos relacionados por separado para evitar problemas con foreign keys
    const userIds = new Set<string>();
    observaciones.forEach(obs => {
      if (obs.auditor_id) userIds.add(obs.auditor_id);
      if (obs.responsable_estrategia) userIds.add(obs.responsable_estrategia);
      if (obs.responsable_implementacion) userIds.add(obs.responsable_implementacion);
    });

    console.log(`📊 Total observaciones: ${observaciones.length}`);
    console.log(`👥 Total usuarios únicos a buscar: ${userIds.size}`);
    console.log(`🔍 User IDs:`, Array.from(userIds));

    let usuariosMap = new Map();
    if (userIds.size > 0) {
      const { data: usuarios, error: usersError } = await supabase
        .from('users')
        .select('id, full_name, email')
        .in('id', Array.from(userIds));

      if (usersError) {
        console.error('❌ Error obteniendo usuarios:', usersError);
        // Continuar sin usuarios si hay error
      } else {
        console.log(`✅ Usuarios encontrados: ${usuarios?.length || 0}`);
        usuariosMap = new Map((usuarios || []).map(u => [u.id, u]));
        // Log para debugging
        usuarios?.forEach(u => {
          console.log(`  - ${u.id}: ${u.full_name || u.email}`);
        });
      }
    }

    // Obtener datos de auditoría
    const { data: auditoria, error: audError } = await supabase
      .from('auditorias')
      .select('id, estado, fecha_inicio, fecha_fin')
      .eq('id', auditoriaId)
      .maybeSingle();

    if (audError) {
      console.error('Error obteniendo auditoría:', audError);
      // Continuar sin datos de auditoría si hay error
    }

    // Preparar datos para Excel según matrizobservaciones.markdown
    const datosExcel = observaciones.map((obs: any) => {
      const auditor = usuariosMap.get(obs.auditor_id);
      const responsableEstrategia = usuariosMap.get(obs.responsable_estrategia);
      const responsableImplementacion = usuariosMap.get(obs.responsable_implementacion);

      // Debug para una observación
      if (observaciones.indexOf(obs) === 0) {
        console.log('🔍 Debug primera observación:');
        console.log('  - auditor_id:', obs.auditor_id);
        console.log('  - auditor encontrado:', auditor ? `${auditor.full_name || auditor.email}` : 'NO ENCONTRADO');
        console.log('  - responsable_estrategia:', obs.responsable_estrategia);
        console.log('  - responsable_implementacion:', obs.responsable_implementacion);
      }

      return {
        'N°': obs.numero_observacion ?? '',
        'Auditor': auditor?.full_name || auditor?.email || (obs.auditor_id ? `ID: ${obs.auditor_id.substring(0, 8)}...` : ''),
        'N° de Informe': obs.numero_informe ?? '',
        'Fecha de Emisión del Informe': obs.fecha_emision_informe ? new Date(obs.fecha_emision_informe).toLocaleDateString('es-ES') : '',
        'Fecha Envío Informe': obs.fecha_envio_informe ? new Date(obs.fecha_envio_informe).toLocaleDateString('es-ES') : '',
        'Nombre de la Auditoría': auditoria?.id || auditoriaId || '',
        'N° de Observación': obs.numero_observacion ?? '',
        'Título de la Observación': obs.titulo_observacion ?? '',
        'Descripción de la Observación': obs.descripcion_observacion ?? '',
        'Recomendación': obs.recomendacion ?? '',
        'Estrategia': obs.estrategia ?? '',
        'Entregable': obs.entregable ?? '',
        'Probabilidad': obs.probabilidad ?? '',
        'Impacto': obs.impacto ?? '',
        'Riesgo': obs.riesgo ?? '',
        'Responsable de la Estrategia': responsableEstrategia?.full_name || responsableEstrategia?.email || '',
        'Responsable de la Implementación': responsableImplementacion?.full_name || responsableImplementacion?.email || '',
        'Fecha Inicio': obs.fecha_inicio ? new Date(obs.fecha_inicio).toLocaleDateString('es-ES') : '',
        'Fecha Fin': obs.fecha_fin ? new Date(obs.fecha_fin).toLocaleDateString('es-ES') : '',
        'Plazo (días laborables)': obs.plazo_dias_laborables ?? '',
        'Fecha Final (no aplica)': obs.fecha_final_no_aplica ? new Date(obs.fecha_final_no_aplica).toLocaleDateString('es-ES') : '',
        'Estado de la Observación': obs.estado_observacion ?? '',
        'Porcentaje de Avance': obs.porcentaje_avance ?? 0,
        'Descripción del Avance': obs.descripcion_avance ?? '',
        'Nueva Fecha de Implementación': obs.nueva_fecha_implementacion ? new Date(obs.nueva_fecha_implementacion).toLocaleDateString('es-ES') : '',
        'Fecha Real de Implementación': obs.fecha_real_implementacion ? new Date(obs.fecha_real_implementacion).toLocaleDateString('es-ES') : '',
        'Descripción de Descargos': obs.descripcion_descargos ?? '',
      };
    });

    // Crear workbook
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(datosExcel);

    // Aplicar anchos de columnas
    const colWidths = [
      { wch: 5 },   // N°
      { wch: 20 },  // Auditor
      { wch: 15 },  // N° de Informe
      { wch: 20 },  // Fecha Emisión
      { wch: 18 },  // Fecha Envío
      { wch: 25 },  // Nombre Auditoría
      { wch: 5 },   // N° Observación
      { wch: 40 },  // Título
      { wch: 50 },  // Descripción
      { wch: 50 },  // Recomendación
      { wch: 50 },  // Estrategia
      { wch: 40 },  // Entregable
      { wch: 12 },  // Probabilidad
      { wch: 12 },  // Impacto
      { wch: 12 },  // Riesgo
      { wch: 30 },  // Responsable Estrategia
      { wch: 30 },  // Responsable Implementación
      { wch: 12 },  // Fecha Inicio
      { wch: 12 },  // Fecha Fin
      { wch: 15 },  // Plazo
      { wch: 18 },  // Fecha Final No Aplica
      { wch: 20 },  // Estado
      { wch: 15 },  // Porcentaje Avance
      { wch: 50 },  // Descripción Avance
      { wch: 20 },  // Nueva Fecha
      { wch: 20 },  // Fecha Real
      { wch: 50 },  // Descargos
    ];
    ws['!cols'] = colWidths;

    // Agregar hoja al workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Matriz Observaciones');

    // Generar buffer
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    // Retornar archivo
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="matriz-observaciones-${auditoriaId}-${new Date().toISOString().split('T')[0]}.xlsx"`,
      },
    });
  } catch (error) {
    console.error('Error exportando Excel:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json(
      { 
        error: 'Error al exportar matriz a Excel',
        details: errorMessage 
      },
      { status: 500 }
    );
  }
}
