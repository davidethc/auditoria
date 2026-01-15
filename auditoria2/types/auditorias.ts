// Tipos e interfaces para el sistema de auditorías

export type AuditoriaEstado = 
  | 'PLANIFICADA'
  | 'EN_PREPARACION'
  | 'EN_EJECUCION'
  | 'EN_REPORTE'
  | 'CERRADA';

export type RolParticipante = 
  | 'AUDITADO'
  | 'OBSERVADOR'
  | 'APOYO';

export type EstadoParticipacion = 
  | 'NOTIFICADO'
  | 'ACEPTADO'
  | 'RECHAZADO'
  | 'PENDIENTE';

export type EstadoInforme = 
  | 'BORRADOR'
  | 'EN_REVISION'
  | 'APROBADO'
  | 'SOCIALIZADO'
  | 'ENVIADO_A_AUDITADOS'
  | 'COMPLETADO'
  | 'CON_CORRECCIONES';

export type EstadoObservacion = 
  | 'NO_INICIADA'              // La acción correctiva aún no ha comenzado
  | 'EN_PROCESO'               // El área auditada está implementando las acciones correctivas
  | 'EN_VALIDACION'            // El área auditada ha reportado la finalización, auditoría está revisando evidencia
  | 'COMPLETADA'               // La acción correctiva ha sido completada con éxito
  | 'REABIERTA'                // Se detectó que las acciones fueron ineficaces o el riesgo persiste
  | 'REPROGRAMADA'             // 1ra reprogramación - fecha extendida por razones justificadas (requiere aprobación)
  | 'REPROGRAMADA_2DA'         // 2da reprogramación
  | 'CUMPLIDA_CON_REPROGRAMACION' // Cumplida pero con reprogramación previa
  | 'REPROGRAMADA_VENCIDA'     // Reprogramada pero vencida nuevamente
  | 'VENCIDA'                  // El plazo establecido ha expirado sin completarse
  | 'CANCELADA';               // Cancelada por Auditoría

export type TipoEvidencia = 
  | 'EVIDENCIA'
  | 'DESCARGO'
  | 'DOCUMENTO'
  | 'FOTO'
  | 'VIDEO';

export type TipoComunicacion = 
  | 'NOTIFICACION'
  | 'RECORDATORIO'
  | 'ACTUALIZACION'
  | 'CIERRE';

export interface Auditoria {
  id: string;
  activity_id: string;
  auditor_responsable_id: string;
  estado: AuditoriaEstado;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  fecha_cierre: string | null;
  creada_por: string | null;
  creada_at: string;
  actualizada_at: string;
  // Relaciones
  activity?: {
    id: string;
    activity_number: number;
    activity_description: string;
    start_date: string | null;
    end_date: string | null;
    priority: string | null;
  };
  auditor?: {
    id: string;
    full_name: string | null;
    email: string;
  };
}

export interface AuditoriaPreparacion {
  id: string;
  auditoria_id: string;
  objetivo: string;
  alcance: string;
  criterios: string;
  riesgos: string | null;
  metodologia: string | null;
  recursos_necesarios: string | null;
  version: number;
  es_version_actual: boolean;
  preparada_por: string | null;
  preparada_at: string;
  aprobada_por: string | null;
  aprobada_at: string | null;
  enviada_a_auditados: boolean;
  enviada_at: string | null;
  fecha_limite_respuesta: string | null;
}

export interface AuditoriaParticipante {
  id: string;
  auditoria_id: string;
  user_id: string;
  rol_en_auditoria: RolParticipante;
  estado_participacion: EstadoParticipacion;
  fecha_notificacion: string | null;
  fecha_respuesta: string | null;
  fecha_limite_respuesta: string | null;
  comentarios_respuesta: string | null;
  notificado_por: string | null;
  // Relaciones
  user?: {
    id: string;
    full_name: string | null;
    email: string;
    role: string;
  };
}

export interface ComunicacionAuditado {
  id: string;
  auditoria_id: string;
  destinatario_id: string;
  tipo_comunicacion: TipoComunicacion;
  resumen_objetivo: string;
  resumen_alcance: string;
  mensaje_adicional: string | null;
  fecha_envio: string;
  metodo_envio: 'EMAIL' | 'SISTEMA' | 'AMBOS';
  confirmado: boolean;
  fecha_confirmacion: string | null;
  fecha_lectura: string | null;
  enviado_por: string | null;
  // Relaciones
  destinatario?: {
    id: string;
    full_name: string | null;
    email: string;
  };
}

export interface AuditoriaObservacion {
  id: string;
  auditoria_id: string;
  numero_observacion: number;
  numero_informe: string | null;
  fecha_emision_informe: string | null;
  fecha_envio_informe: string | null;
  titulo_observacion: string;
  descripcion_observacion: string;
  recomendacion: string;
  estrategia: string | null;
  entregable: string | null;
  probabilidad: string | null;
  impacto: string | null;
  riesgo: string | null;
  auditor_id: string;
  responsable_estrategia: string | null;
  responsable_implementacion: string | null;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  plazo_dias_laborables: number | null;
  fecha_final_no_aplica: string | null;
  estado_observacion: EstadoObservacion;
  porcentaje_avance: number;
  descripcion_avance: string | null;
  nueva_fecha_implementacion: string | null;
  fecha_real_implementacion: string | null;
  descripcion_descargos: string | null;
  created_at: string;
  updated_at: string;
  // Relaciones
  auditor?: {
    id: string;
    full_name: string | null;
    email: string;
  };
  responsable_estrategia_user?: {
    id: string;
    full_name: string | null;
    email: string;
  };
  responsable_implementacion_user?: {
    id: string;
    full_name: string | null;
    email: string;
  };
}

export interface ObservacionEvidencia {
  id: string;
  observacion_id: string;
  tipo_evidencia: TipoEvidencia;
  descripcion: string;
  archivo_nombre: string | null;
  archivo_url: string | null;
  archivo_tipo: string | null;
  archivo_tamanio: number | null;
  revisada: boolean;
  aprobada: boolean | null;
  comentarios_revision: string | null;
  revisada_por: string | null;
  revisada_at: string | null;
  subida_por: string;
  subida_at: string;
  // Relaciones
  subida_por_user?: {
    id: string;
    full_name: string | null;
    email: string;
  };
  revisada_por_user?: {
    id: string;
    full_name: string | null;
    email: string;
  };
}

export interface AuditoriaInforme {
  id: string;
  auditoria_id: string;
  tipo_informe: string;
  // Campos del Auditor
  encabezado: string | null;
  de: string | null;
  para: string | null;
  asunto: string | null;
  fecha_inicio_informe: string | null;
  antecedentes: string | null;
  objetivos: string | null;
  alcance: string | null;
  resultados_revision: string | null;
  metodologia_aplicada: string | null;
  titulo_observaciones: string | null;
  observaciones_enumeradas: any; // JSONB
  conclusiones: string | null;
  recomendaciones_generales: string | null;
  // Campos del Auditado
  estrategia: string | null;
  fecha_inicio_implementacion: string | null;
  fecha_fin_implementacion: string | null;
  entregable: string | null;
  // Control
  version: number;
  es_version_actual: boolean;
  estado: EstadoInforme;
  elaborado_por: string;
  fecha_elaboracion: string;
  revisado_por: string | null;
  fecha_revision: string | null;
  comentarios_revision: string | null;
  aprobado_por: string | null;
  fecha_aprobacion: string | null;
  fecha_socializacion: string | null;
  participantes_socializacion: string[] | null;
  // Archivos
  documento_word_url: string | null;
  documento_pdf_url: string | null;
  documento_firmado_url: string | null;
  documento_escaneado_url: string | null;
  created_at: string;
  updated_at: string;
  // Relaciones
  elaborado_por_user?: {
    id: string;
    full_name: string | null;
    email: string;
  };
  revisado_por_user?: {
    id: string;
    full_name: string | null;
    email: string;
  };
  aprobado_por_user?: {
    id: string;
    full_name: string | null;
    email: string;
  };
}

export interface InformeFirma {
  id: string;
  informe_id: string;
  firmante_id: string;
  rol_firmante: string;
  firmado: boolean;
  fecha_firma: string | null;
  firma_digital_url: string | null;
  created_at: string;
  // Relaciones
  firmante?: {
    id: string;
    full_name: string | null;
    email: string;
  };
}

export interface AuditoriaCompleta extends Auditoria {
  preparacion?: AuditoriaPreparacion;
  participantes?: AuditoriaParticipante[];
  comunicaciones?: ComunicacionAuditado[];
  observaciones?: AuditoriaObservacion[];
  informe?: AuditoriaInforme;
}

