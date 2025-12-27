/**
 * Funciones helper para el flujo de auditorías
 */

/**
 * Calcula días hábiles entre dos fechas (excluyendo sábados y domingos)
 */
export function calcularDiasHabiles(fechaInicio: Date, fechaFin: Date): number {
  let dias = 0;
  const fecha = new Date(fechaInicio);
  
  while (fecha <= fechaFin) {
    const diaSemana = fecha.getDay();
    if (diaSemana !== 0 && diaSemana !== 6) { // No es domingo ni sábado
      dias++;
    }
    fecha.setDate(fecha.getDate() + 1);
  }
  
  return dias;
}

/**
 * Agrega días hábiles a una fecha
 */
export function agregarDiasHabiles(fecha: Date, dias: number): Date {
  const resultado = new Date(fecha);
  let diasAgregados = 0;
  
  while (diasAgregados < dias) {
    resultado.setDate(resultado.getDate() + 1);
    const diaSemana = resultado.getDay();
    if (diaSemana !== 0 && diaSemana !== 6) {
      diasAgregados++;
    }
  }
  
  return resultado;
}

/**
 * Valida si se puede cambiar de un estado a otro
 */
export function puedeCambiarEstado(
  estadoActual: string,
  nuevoEstado: string,
  rol: 'auditor' | 'auditor_interno' | 'auditado'
): { permitido: boolean; mensaje?: string } {
  const transiciones: Record<string, string[]> = {
    // Estados de auditoría
    PLANIFICADA: ['EN_EJECUCION'],
    EN_EJECUCION: ['EN_REPORTE'],
    EN_REPORTE: ['CERRADA'], // Solo si no hay informe
    CERRADA: [],
    
    // Estados de informe
    BORRADOR: ['EN_REVISION', 'CON_CORRECCIONES'],
    EN_REVISION: ['APROBADO', 'CON_CORRECCIONES'],
    CON_CORRECCIONES: ['BORRADOR'],
    APROBADO: ['SOCIALIZADO'],
    SOCIALIZADO: ['ENVIADO_A_AUDITADOS'],
    ENVIADO_A_AUDITADOS: ['COMPLETADO'],
    COMPLETADO: [],
  };

  const estadosPermitidos = transiciones[estadoActual] || [];
  
  if (!estadosPermitidos.includes(nuevoEstado)) {
    return {
      permitido: false,
      mensaje: `No se puede cambiar de ${estadoActual} a ${nuevoEstado}`
    };
  }

  // Validaciones por rol
  if (nuevoEstado === 'EN_REVISION' && rol !== 'auditor' && rol !== 'auditor_interno') {
    return { permitido: false, mensaje: 'Solo auditores pueden enviar a revisión' };
  }

  if (nuevoEstado === 'APROBADO' && rol !== 'auditor_interno') {
    return { permitido: false, mensaje: 'Solo el auditor interno puede aprobar' };
  }

  if (nuevoEstado === 'SOCIALIZADO' && rol !== 'auditor' && rol !== 'auditor_interno') {
    return { permitido: false, mensaje: 'Solo auditores pueden socializar' };
  }

  if (nuevoEstado === 'ENVIADO_A_AUDITADOS' && rol !== 'auditor' && rol !== 'auditor_interno') {
    return { permitido: false, mensaje: 'Solo auditores pueden enviar a auditados' };
  }

  return { permitido: true };
}

/**
 * Obtiene el siguiente estado lógico según el flujo
 */
export function obtenerSiguienteEstado(estadoActual: string): string | null {
  const siguiente: Record<string, string> = {
    PLANIFICADA: 'EN_EJECUCION',
    EN_EJECUCION: 'EN_REPORTE',
    EN_REPORTE: 'CERRADA',
    BORRADOR: 'EN_REVISION',
    EN_REVISION: 'APROBADO',
    APROBADO: 'SOCIALIZADO',
    SOCIALIZADO: 'ENVIADO_A_AUDITADOS',
    ENVIADO_A_AUDITADOS: 'COMPLETADO',
  };

  return siguiente[estadoActual] || null;
}

/**
 * Formatea una fecha para mostrar
 */
export function formatearFecha(dateString: string | null): string {
  if (!dateString) return '-';
  try {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch {
    return '-';
  }
}

