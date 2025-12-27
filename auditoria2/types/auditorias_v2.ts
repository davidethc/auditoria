// ============================================
// Tipos e interfaces OPTIMIZADOS para el sistema de auditorías
// ============================================

// ============================================
// ESTADOS
// ============================================

export type AuditoriaEstado = 
  | 'PLANIFICADA'        // Auditoría creada
  | 'EN_PREPARACION'     // Definiendo objetivos/alcances
  | 'NOTIFICADA'         // Auditados notificados
  | 'EN_EJECUCION'       // Ejecutando auditoría (pruebas físicas)
  | 'INFORME'            // Redactando informe
  | 'CERRADA';           // Auditoría completada

export type RolParticipante = 
  | 'AUDITADO'           // Persona/área auditada (principal)
  | 'OBSERVADOR'         // Observa el proceso
  | 'APOYO';             // Personal de apoyo

export type EstadoParticipacion = 
  | 'PENDIENTE'          // No se ha notificado
  | 'NOTIFICADO'         // Notificado, esperando respuesta
  | 'ACEPTADO'           // Aceptó participar
  | 'RECHAZADO';         // Rechazó participar

export type TipoHallazgo =
  | 'OBSERVACION'                 // Observación general
  | 'NO_CONFORMIDAD_MENOR'        // Incumplimiento menor
  | 'NO_CONFORMIDAD_MAYOR'        // Incumplimiento mayor
  | 'OPORTUNIDAD_MEJORA';         // Sugerencia de mejora

export type NivelRiesgo =
  | 'BAJO'
  | 'MEDIO'
  | 'ALTO'
  | 'CRITICO';

export type EstadoHallazgo =
  | 'ABIERTO'            // Detectado, sin acción
  | 'EN_CORRECCION'      // En proceso de corrección
  | 'VERIFICADO'         // Corrección verificada
  | 'CERRADO';           // Completamente cerrado

export type EstadoInforme =
  | 'BORRADOR'           // En elaboración
  | 'EN_REVISION'        // En revisión
  | 'APROBADO'           // Aprobado
  | 'PUBLICADO';         // Publicado a auditados

export type TipoComunicacion = 
  | 'NOTIFICACION'       // Notificación inicial
  | 'RECORDATORIO'       // Recordatorio
  | 'ACTUALIZACION'      // Actualización de información
  | 'CIERRE';            // Comunicación de cierre

// ============================================
// INTERFACES PRINCIPALES
// ============================================

export interface Auditoria {
  id: string;
  activity_id: string;
  auditor_responsable_id: string;
  estado: AuditoriaEstado;
  
  // Fechas del cronograma
  fecha_inicio: string | null;
  fecha_fin: string | null;
  
  // Control de flujo
  preparacion_completada: boolean;
  participantes_notificados: boolean;
  ejecucion_iniciada: boolean;
  informe_generado: boolean;
  
  // Fechas de control
  fecha_preparacion_completada: string | null;
  fecha_notificacion: string | null;
  fecha_inicio_ejecucion: string | null;
  fecha_informe: string | null;
  fecha_cierre: string | null;
  
  // Auditoría
  creada_por: string | null;
  creada_at: string;
  actualizada_at: string;
  
  // Relaciones opcionales
  activity?: AuditActivity;
  auditor?: User;
  preparacion?: AuditoriaPreparacion;
  participantes?: AuditoriaParticipante[];
  hallazgos?: AuditoriaHallazgo[];
  informe?: AuditoriaInforme;
}

export interface AuditoriaPreparacion {
  id: string;
  auditoria_id: string;
  
  // Información de preparación
  objetivo: string;
  alcance: string;
  criterios: string;
  riesgos: string | null;
  metodologia: string | null;
  recursos_necesarios: string | null;
  
  // Control de versiones
  version: number;
  es_version_actual: boolean;
  
  // Aprobación
  preparada_por: string | null;
  preparada_at: string;
  aprobada_por: string | null;
  aprobada_at: string | null;
  
  // Notificación
  enviada_a_auditados: boolean;
  enviada_at: string | null;
  fecha_limite_respuesta: string | null;
  
  // Relaciones opcionales
  preparada_por_user?: User;
  aprobada_por_user?: User;
}

export interface AuditoriaParticipante {
  id: string;
  auditoria_id: string;
  user_id: string;
  rol_en_auditoria: RolParticipante;
  estado_participacion: EstadoParticipacion;
  
  // Control de notificación
  fecha_notificacion: string | null;
  fecha_respuesta: string | null;
  fecha_limite_respuesta: string | null;
  comentarios_respuesta: string | null;
  notificado_por: string | null;
  
  // Relaciones opcionales
  user?: User;
  notificado_por_user?: User;
}

export interface AuditoriaHallazgo {
  id: string;
  auditoria_id: string;
  
  // Información del hallazgo
  numero_hallazgo: number;
  tipo_hallazgo: TipoHallazgo;
  titulo: string;
  descripcion: string;
  criterio_auditoria: string;
  evidencia: string;
  
  // Clasificación
  area_afectada: string | null;
  proceso_afectado: string | null;
  nivel_riesgo: NivelRiesgo | null;
  
  // Seguimiento
  estado: EstadoHallazgo;
  
  // Responsables
  detectado_por: string;
  responsable_correccion: string | null;
  
  // Fechas
  fecha_deteccion: string;
  fecha_limite_correccion: string | null;
  fecha_correccion: string | null;
  fecha_verificacion: string | null;
  
  // Plan de acción
  accion_correctiva: string | null;
  accion_preventiva: string | null;
  
  // Archivos adjuntos
  adjuntos: AdjuntoHallazgo[] | null;
  
  created_at: string;
  updated_at: string;
  
  // Relaciones opcionales
  detectado_por_user?: User;
  responsable_correccion_user?: User;
}

export interface AuditoriaInforme {
  id: string;
  auditoria_id: string;
  
  // Contenido del informe
  resumen_ejecutivo: string;
  introduccion: string | null;
  metodologia_aplicada: string | null;
  
  // Resultados
  hallazgos_resumen: string | null;
  total_hallazgos: number;
  total_no_conformidades_mayores: number;
  total_no_conformidades_menores: number;
  total_observaciones: number;
  total_oportunidades_mejora: number;
  
  // Conclusiones
  conclusion_general: string;
  recomendaciones: string | null;
  fortalezas: string | null;
  areas_mejora: string | null;
  
  // Control de versiones
  version: number;
  es_version_actual: boolean;
  
  // Aprobación
  elaborado_por: string;
  revisado_por: string | null;
  aprobado_por: string | null;
  
  fecha_elaboracion: string;
  fecha_revision: string | null;
  fecha_aprobacion: string | null;
  
  // Estado del informe
  estado: EstadoInforme;
  
  // Archivos
  documento_pdf_url: string | null;
  anexos: AnexoInforme[] | null;
  
  created_at: string;
  updated_at: string;
  
  // Relaciones opcionales
  elaborado_por_user?: User;
  revisado_por_user?: User;
  aprobado_por_user?: User;
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
  
  // Relaciones opcionales
  destinatario?: User;
  enviado_por_user?: User;
}

// ============================================
// INTERFACES AUXILIARES
// ============================================

export interface AuditActivity {
  id: string;
  activity_number: number;
  activity_description: string;
  activity_type: string | null;
  regulation_code: string | null;
  regulation_name: string | null;
  regulation_date: string | null;
  priority: string | null;
  validation_status: string | null;
  start_date: string | null;
  end_date: string | null;
  component: string | null;
  subcomponent: string | null;
  year: number | null;
  auditor_id: string | null;
  auditor_name?: string | null;
}

export interface User {
  id: string;
  full_name: string | null;
  email: string;
  role: string;
  area: string | null;
}

export interface AdjuntoHallazgo {
  nombre: string;
  url: string;
  tipo: string;
  tamanio: number;
  fecha_subida: string;
}

export interface AnexoInforme {
  nombre: string;
  descripcion: string | null;
  url: string;
  tipo: string;
  fecha_subida: string;
}

// ============================================
// INTERFACES COMPUESTAS
// ============================================

export interface AuditoriaCompleta extends Auditoria {
  preparacion?: AuditoriaPreparacion;
  participantes: AuditoriaParticipante[];
  hallazgos: AuditoriaHallazgo[];
  informe?: AuditoriaInforme;
  comunicaciones: ComunicacionAuditado[];
}

// ============================================
// TIPOS PARA FORMULARIOS
// ============================================

export interface CrearAuditoriaForm {
  activity_id: string;
  auditor_responsable_id: string;
  fecha_inicio: string;
  fecha_fin: string;
}

export interface PreparacionForm {
  objetivo: string;
  alcance: string;
  criterios: string;
  riesgos?: string;
  metodologia?: string;
  recursos_necesarios?: string;
}

export interface HallazgoForm {
  tipo_hallazgo: TipoHallazgo;
  titulo: string;
  descripcion: string;
  criterio_auditoria: string;
  evidencia: string;
  area_afectada?: string;
  proceso_afectado?: string;
  nivel_riesgo?: NivelRiesgo;
  responsable_correccion?: string;
  fecha_limite_correccion?: string;
  accion_correctiva?: string;
  accion_preventiva?: string;
}

export interface InformeForm {
  resumen_ejecutivo: string;
  introduccion?: string;
  metodologia_aplicada?: string;
  conclusion_general: string;
  recomendaciones?: string;
  fortalezas?: string;
  areas_mejora?: string;
}

