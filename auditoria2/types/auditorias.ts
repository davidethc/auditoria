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

export interface AuditoriaCompleta extends Auditoria {
  preparacion?: AuditoriaPreparacion;
  participantes?: AuditoriaParticipante[];
  comunicaciones?: ComunicacionAuditado[];
}

