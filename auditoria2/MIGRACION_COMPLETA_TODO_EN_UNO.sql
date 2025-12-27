-- ============================================
-- SCRIPT DE MIGRACIÓN COMPLETA - TODO EN UNO
-- ============================================
-- ⚠️ ADVERTENCIA: Este script:
-- 1. ELIMINA TODO el esquema actual (tablas, funciones, políticas)
-- 2. CREA el nuevo esquema completo
-- 
-- ⚠️⚠️⚠️ HAZ UN BACKUP ANTES DE EJECUTAR ⚠️⚠️⚠️
-- ============================================

-- ============================================
-- PARTE 1: LIMPIEZA COMPLETA
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════';
  RAISE NOTICE '🧹 INICIANDO LIMPIEZA COMPLETA';
  RAISE NOTICE '═══════════════════════════════════════════════';
  RAISE NOTICE '';
END $$;

-- Eliminar políticas RLS
DROP POLICY IF EXISTS "Allow insert from auth trigger" ON public.users;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Auditor interno can view all users" ON public.users;
DROP POLICY IF EXISTS "Auditor interno can update users" ON public.users;
DROP POLICY IF EXISTS "users_select_all" ON public.users;
DROP POLICY IF EXISTS "users_insert" ON public.users;
DROP POLICY IF EXISTS "users_update" ON public.users;
DROP POLICY IF EXISTS "users_delete" ON public.users;
DROP POLICY IF EXISTS "Todos pueden leer planes" ON public.audit_plans;
DROP POLICY IF EXISTS "Auditor interno gestiona planes" ON public.audit_plans;
DROP POLICY IF EXISTS "Usuarios ven solo sus actividades asignadas" ON public.audit_activities;
DROP POLICY IF EXISTS "Auditor interno crea actividades" ON public.audit_activities;
DROP POLICY IF EXISTS "Auditor interno puede crear actividades" ON public.audit_activities;
DROP POLICY IF EXISTS "Auditor interno puede gestionar actividades" ON public.audit_activities;
DROP POLICY IF EXISTS "Auditor puede validar sus actividades" ON public.audit_activities;
DROP POLICY IF EXISTS "Auditor interno elimina actividades" ON public.audit_activities;
DROP POLICY IF EXISTS "Auditor interno puede eliminar actividades" ON public.audit_activities;
DROP POLICY IF EXISTS "auditorias_select_final" ON public.auditorias;
DROP POLICY IF EXISTS "auditorias_insert_final" ON public.auditorias;
DROP POLICY IF EXISTS "auditorias_update_final" ON public.auditorias;
DROP POLICY IF EXISTS "auditorias_delete_final" ON public.auditorias;
DROP POLICY IF EXISTS "preparacion_select_policy" ON public.auditoria_preparacion;
DROP POLICY IF EXISTS "preparacion_select_final" ON public.auditoria_preparacion;
DROP POLICY IF EXISTS "preparacion_insert_policy" ON public.auditoria_preparacion;
DROP POLICY IF EXISTS "preparacion_insert_final" ON public.auditoria_preparacion;
DROP POLICY IF EXISTS "preparacion_update_policy" ON public.auditoria_preparacion;
DROP POLICY IF EXISTS "preparacion_update_final" ON public.auditoria_preparacion;
DROP POLICY IF EXISTS "preparacion_delete_final" ON public.auditoria_preparacion;
DROP POLICY IF EXISTS "participantes_select_policy" ON public.auditoria_participantes;
DROP POLICY IF EXISTS "participantes_select_final" ON public.auditoria_participantes;
DROP POLICY IF EXISTS "participantes_insert_policy" ON public.auditoria_participantes;
DROP POLICY IF EXISTS "participantes_insert_final" ON public.auditoria_participantes;
DROP POLICY IF EXISTS "participantes_update_policy" ON public.auditoria_participantes;
DROP POLICY IF EXISTS "participantes_update_final" ON public.auditoria_participantes;
DROP POLICY IF EXISTS "participantes_delete_final" ON public.auditoria_participantes;
DROP POLICY IF EXISTS "comunicaciones_select_policy" ON public.comunicaciones_auditado;
DROP POLICY IF EXISTS "comunicaciones_insert_policy" ON public.comunicaciones_auditado;

-- Eliminar triggers PRIMERO (antes que las funciones)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS trigger_update_notification_date ON public.audit_activities;
DROP TRIGGER IF EXISTS update_notification_date_trigger ON public.audit_activities;
DROP TRIGGER IF EXISTS update_auditor_assigned_at_trigger ON public.audit_activities;
DROP TRIGGER IF EXISTS validate_auditor_role_trigger ON public.auditorias;
DROP TRIGGER IF EXISTS update_fecha_cierre_trigger ON public.auditorias;
DROP TRIGGER IF EXISTS update_auditorias_updated_at ON public.auditorias;
DROP TRIGGER IF EXISTS set_fecha_notificacion_trigger ON public.auditoria_participantes;
DROP TRIGGER IF EXISTS update_auditoria_observaciones_updated_at ON public.auditoria_observaciones;
DROP TRIGGER IF EXISTS update_auditoria_informe_updated_at ON public.auditoria_informe;

-- Eliminar funciones DESPUÉS (con CASCADE por seguridad)
DROP FUNCTION IF EXISTS calculate_notification_date(DATE) CASCADE;
DROP FUNCTION IF EXISTS get_current_user_role() CASCADE;
DROP FUNCTION IF EXISTS is_auditor_interno() CASCADE;
DROP FUNCTION IF EXISTS is_user_participant_in_auditoria(UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS is_user_responsable_auditoria(UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS is_user_responsable_activity(UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS get_monthly_activities_notifications(DATE) CASCADE;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS validate_auditor_role() CASCADE;
DROP FUNCTION IF EXISTS update_notification_date() CASCADE;
DROP FUNCTION IF EXISTS update_fecha_cierre() CASCADE;
DROP FUNCTION IF EXISTS update_auditorias_updated_at() CASCADE;
DROP FUNCTION IF EXISTS update_auditor_assigned_at() CASCADE;
DROP FUNCTION IF EXISTS set_fecha_notificacion() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Eliminar tablas
DROP TABLE IF EXISTS public.solicitudes_documentacion CASCADE;
DROP TABLE IF EXISTS public.comunicaciones_auditado CASCADE;
DROP TABLE IF EXISTS public.informe_firmas CASCADE;
DROP TABLE IF EXISTS public.observacion_evidencias CASCADE;
DROP TABLE IF EXISTS public.observacion_avances CASCADE;
DROP TABLE IF EXISTS public.auditoria_observaciones CASCADE;
DROP TABLE IF EXISTS public.auditoria_informe CASCADE;
DROP TABLE IF EXISTS public.auditoria_participantes CASCADE;
DROP TABLE IF EXISTS public.auditoria_preparacion CASCADE;
DROP TABLE IF EXISTS public.auditorias CASCADE;
DROP TABLE IF EXISTS public.audit_activities CASCADE;
DROP TABLE IF EXISTS public.audit_plans CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

DO $$
BEGIN
  RAISE NOTICE '✅ Limpieza completa finalizada';
  RAISE NOTICE '';
END $$;

-- ============================================
-- PARTE 2: CREAR NUEVO ESQUEMA
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════';
  RAISE NOTICE '🏗️ CREANDO NUEVO ESQUEMA';
  RAISE NOTICE '═══════════════════════════════════════════════';
  RAISE NOTICE '';
END $$;

-- Tabla: users
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY,
    full_name TEXT,
    email TEXT NOT NULL,
    role TEXT NOT NULL,
    area TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT fk_users_id FOREIGN KEY (id) 
        REFERENCES auth.users(id) ON DELETE CASCADE,
    CONSTRAINT uq_users_email UNIQUE (email)
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_area ON users(area);

-- Tabla: audit_plans
CREATE TABLE IF NOT EXISTS audit_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    year INTEGER NOT NULL,
    plan_type TEXT NOT NULL,
    description TEXT,
    created_by UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT fk_audit_plans_created_by FOREIGN KEY (created_by) 
        REFERENCES auth.users(id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_audit_plans_year ON audit_plans(year);
CREATE INDEX IF NOT EXISTS idx_audit_plans_created_by ON audit_plans(created_by);
CREATE INDEX IF NOT EXISTS idx_audit_plans_plan_type ON audit_plans(plan_type);

-- Tabla: audit_activities
CREATE TABLE IF NOT EXISTS audit_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id UUID NOT NULL,
    activity_number INTEGER NOT NULL,
    year INTEGER NOT NULL,
    activity_type TEXT,
    regulation_code TEXT,
    regulation_name TEXT,
    regulation_date DATE,
    activity_description TEXT,
    priority TEXT,
    subcomponent TEXT,
    component TEXT,
    deliverable_type TEXT,
    deliverable TEXT,
    periodicity TEXT,
    periods_number INTEGER,
    additional_parameter TEXT,
    review_time INTEGER,
    cutoff_date DATE,
    start_date DATE,
    end_date DATE,
    applies BOOLEAN DEFAULT true,
    validation_status TEXT,
    restructures_number INTEGER DEFAULT 0,
    auditor_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    auditor_assigned_at TIMESTAMPTZ,
    notification_date DATE,
    
    CONSTRAINT fk_audit_activities_plan_id FOREIGN KEY (plan_id) 
        REFERENCES audit_plans(id) ON DELETE CASCADE,
    CONSTRAINT fk_audit_activities_auditor_id FOREIGN KEY (auditor_id) 
        REFERENCES auth.users(id) ON DELETE SET NULL,
    CONSTRAINT uq_audit_activities_plan_activity_number 
        UNIQUE (plan_id, activity_number)
);

CREATE INDEX IF NOT EXISTS idx_audit_activities_plan_id ON audit_activities(plan_id);
CREATE INDEX IF NOT EXISTS idx_audit_activities_auditor_id ON audit_activities(auditor_id);
CREATE INDEX IF NOT EXISTS idx_audit_activities_year ON audit_activities(year);
CREATE INDEX IF NOT EXISTS idx_audit_activities_activity_number ON audit_activities(activity_number);
CREATE INDEX IF NOT EXISTS idx_audit_activities_validation_status ON audit_activities(validation_status);
CREATE INDEX IF NOT EXISTS idx_audit_activities_start_date ON audit_activities(start_date);
CREATE INDEX IF NOT EXISTS idx_audit_activities_end_date ON audit_activities(end_date);

-- Tabla: auditorias
CREATE TABLE IF NOT EXISTS auditorias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    activity_id UUID NOT NULL,
    auditor_responsable_id UUID NOT NULL,
    
    estado TEXT NOT NULL DEFAULT 'PLANIFICADA',
    
    fecha_inicio DATE,
    fecha_fin DATE,
    
    preparacion_completada BOOLEAN DEFAULT false,
    participantes_notificados BOOLEAN DEFAULT false,
    ejecucion_iniciada BOOLEAN DEFAULT false,
    informe_borrador_generado BOOLEAN DEFAULT false,
    informe_aprobado BOOLEAN DEFAULT false,
    informe_socializado BOOLEAN DEFAULT false,
    informe_final_enviado BOOLEAN DEFAULT false,
    
    fecha_preparacion_completada TIMESTAMPTZ,
    fecha_notificacion TIMESTAMPTZ,
    fecha_inicio_ejecucion TIMESTAMPTZ,
    fecha_informe_borrador TIMESTAMPTZ,
    fecha_aprobacion_informe TIMESTAMPTZ,
    fecha_socializacion TIMESTAMPTZ,
    fecha_informe_final TIMESTAMPTZ,
    fecha_cierre TIMESTAMPTZ,
    
    creada_por UUID,
    creada_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    actualizada_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT fk_auditorias_activity_id FOREIGN KEY (activity_id) 
        REFERENCES audit_activities(id) ON DELETE RESTRICT,
    CONSTRAINT fk_auditorias_auditor_responsable_id FOREIGN KEY (auditor_responsable_id) 
        REFERENCES auth.users(id) ON DELETE RESTRICT,
    CONSTRAINT fk_auditorias_creada_por FOREIGN KEY (creada_por) 
        REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_auditorias_activity_id ON auditorias(activity_id);
CREATE INDEX IF NOT EXISTS idx_auditorias_auditor_responsable_id ON auditorias(auditor_responsable_id);
CREATE INDEX IF NOT EXISTS idx_auditorias_estado ON auditorias(estado);
CREATE INDEX IF NOT EXISTS idx_auditorias_creada_por ON auditorias(creada_por);
CREATE INDEX IF NOT EXISTS idx_auditorias_fecha_inicio ON auditorias(fecha_inicio);
CREATE INDEX IF NOT EXISTS idx_auditorias_fecha_fin ON auditorias(fecha_fin);
CREATE INDEX IF NOT EXISTS idx_auditorias_creada_at ON auditorias(creada_at);

-- Función específica para actualizar actualizada_at en auditorias
CREATE OR REPLACE FUNCTION update_auditorias_actualizada_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.actualizada_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_auditorias_updated_at ON auditorias;
DROP TRIGGER IF EXISTS update_auditorias_actualizada_at_trigger ON auditorias;
CREATE TRIGGER update_auditorias_actualizada_at_trigger
    BEFORE UPDATE ON auditorias
    FOR EACH ROW
    EXECUTE FUNCTION update_auditorias_actualizada_at();

-- Tabla: auditoria_preparacion
CREATE TABLE IF NOT EXISTS auditoria_preparacion (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auditoria_id UUID NOT NULL,
    
    objetivo TEXT NOT NULL,
    alcance TEXT NOT NULL,
    criterios TEXT NOT NULL,
    riesgos TEXT,
    metodologia TEXT,
    recursos_necesarios TEXT,
    
    version INTEGER NOT NULL DEFAULT 1,
    es_version_actual BOOLEAN NOT NULL DEFAULT true,
    
    preparada_por UUID,
    preparada_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    aprobada_por UUID,
    aprobada_at TIMESTAMPTZ,
    
    enviada_a_auditados BOOLEAN NOT NULL DEFAULT false,
    enviada_at TIMESTAMPTZ,
    fecha_limite_respuesta DATE,
    
    CONSTRAINT fk_auditoria_preparacion_auditoria_id FOREIGN KEY (auditoria_id) 
        REFERENCES auditorias(id) ON DELETE CASCADE,
    CONSTRAINT fk_auditoria_preparacion_preparada_por FOREIGN KEY (preparada_por) 
        REFERENCES auth.users(id) ON DELETE SET NULL,
    CONSTRAINT fk_auditoria_preparacion_aprobada_por FOREIGN KEY (aprobada_por) 
        REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_auditoria_preparacion_auditoria_id ON auditoria_preparacion(auditoria_id);
CREATE INDEX IF NOT EXISTS idx_auditoria_preparacion_es_version_actual ON auditoria_preparacion(es_version_actual);

-- Tabla: auditoria_participantes
CREATE TABLE IF NOT EXISTS auditoria_participantes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auditoria_id UUID NOT NULL,
    user_id UUID NOT NULL,
    
    rol_en_auditoria TEXT NOT NULL DEFAULT 'AUDITADO',
    estado_participacion TEXT NOT NULL DEFAULT 'PENDIENTE',
    
    fecha_notificacion TIMESTAMPTZ,
    fecha_respuesta TIMESTAMPTZ,
    fecha_limite_respuesta DATE,
    comentarios_respuesta TEXT,
    notificado_por UUID,
    
    CONSTRAINT fk_auditoria_participantes_auditoria_id FOREIGN KEY (auditoria_id) 
        REFERENCES auditorias(id) ON DELETE CASCADE,
    CONSTRAINT fk_auditoria_participantes_user_id FOREIGN KEY (user_id) 
        REFERENCES auth.users(id) ON DELETE CASCADE,
    CONSTRAINT fk_auditoria_participantes_notificado_por FOREIGN KEY (notificado_por) 
        REFERENCES auth.users(id) ON DELETE SET NULL,
    CONSTRAINT uq_auditoria_participantes_auditoria_user 
        UNIQUE (auditoria_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_auditoria_participantes_auditoria_id ON auditoria_participantes(auditoria_id);
CREATE INDEX IF NOT EXISTS idx_auditoria_participantes_user_id ON auditoria_participantes(user_id);
CREATE INDEX IF NOT EXISTS idx_auditoria_participantes_estado ON auditoria_participantes(estado_participacion);

-- ⭐ TABLA PRINCIPAL: auditoria_observaciones (MATRIZ GENERAL)
CREATE TABLE IF NOT EXISTS auditoria_observaciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auditoria_id UUID NOT NULL,
    
    numero_observacion INTEGER NOT NULL,
    numero_informe TEXT,
    fecha_emision_informe DATE,
    fecha_envio_informe DATE,
    
    titulo_observacion TEXT NOT NULL,
    descripcion_observacion TEXT NOT NULL,
    recomendacion TEXT NOT NULL,
    
    estrategia TEXT,
    entregable TEXT,
    
    probabilidad TEXT,
    impacto TEXT,
    riesgo TEXT,
    
    auditor_id UUID NOT NULL,
    responsable_estrategia UUID,
    responsable_implementacion UUID,
    
    fecha_inicio DATE,
    fecha_fin DATE,
    plazo_dias_laborables INTEGER,
    fecha_final_no_aplica DATE,
    
    estado_observacion TEXT NOT NULL DEFAULT 'NO_INICIADA',
    
    porcentaje_avance INTEGER DEFAULT 0,
    descripcion_avance TEXT,
    
    nueva_fecha_implementacion DATE,
    fecha_real_implementacion DATE,
    
    descripcion_descargos TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT fk_auditoria_observaciones_auditoria_id FOREIGN KEY (auditoria_id) 
        REFERENCES auditorias(id) ON DELETE CASCADE,
    CONSTRAINT fk_auditoria_observaciones_auditor_id FOREIGN KEY (auditor_id) 
        REFERENCES auth.users(id) ON DELETE RESTRICT,
    CONSTRAINT fk_auditoria_observaciones_responsable_estrategia FOREIGN KEY (responsable_estrategia) 
        REFERENCES auth.users(id) ON DELETE SET NULL,
    CONSTRAINT fk_auditoria_observaciones_responsable_implementacion FOREIGN KEY (responsable_implementacion) 
        REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_auditoria_observaciones_auditoria_id ON auditoria_observaciones(auditoria_id);
CREATE INDEX IF NOT EXISTS idx_auditoria_observaciones_auditor_id ON auditoria_observaciones(auditor_id);
CREATE INDEX IF NOT EXISTS idx_auditoria_observaciones_estado ON auditoria_observaciones(estado_observacion);
CREATE INDEX IF NOT EXISTS idx_auditoria_observaciones_fecha_fin ON auditoria_observaciones(fecha_fin);
CREATE INDEX IF NOT EXISTS idx_auditoria_observaciones_responsable_implementacion ON auditoria_observaciones(responsable_implementacion);

DROP TRIGGER IF EXISTS update_auditoria_observaciones_updated_at ON auditoria_observaciones;
CREATE TRIGGER update_auditoria_observaciones_updated_at
    BEFORE UPDATE ON auditoria_observaciones
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Tabla: observacion_avances
CREATE TABLE IF NOT EXISTS observacion_avances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    observacion_id UUID NOT NULL,
    
    periodo_reporte DATE NOT NULL,
    porcentaje_avance INTEGER NOT NULL,
    descripcion_avance TEXT,
    
    estado_actual TEXT NOT NULL,
    
    reportado_por UUID,
    reportado_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT fk_observacion_avances_observacion_id FOREIGN KEY (observacion_id) 
        REFERENCES auditoria_observaciones(id) ON DELETE CASCADE,
    CONSTRAINT fk_observacion_avances_reportado_por FOREIGN KEY (reportado_por) 
        REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_observacion_avances_observacion_id ON observacion_avances(observacion_id);
CREATE INDEX IF NOT EXISTS idx_observacion_avances_periodo_reporte ON observacion_avances(periodo_reporte);

-- Tabla: observacion_evidencias
CREATE TABLE IF NOT EXISTS observacion_evidencias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    observacion_id UUID NOT NULL,
    
    tipo_evidencia TEXT NOT NULL,
    descripcion TEXT NOT NULL,
    
    archivo_nombre TEXT,
    archivo_url TEXT,
    archivo_tipo TEXT,
    archivo_tamanio INTEGER,
    
    revisada BOOLEAN DEFAULT false,
    aprobada BOOLEAN DEFAULT NULL,
    comentarios_revision TEXT,
    revisada_por UUID,
    revisada_at TIMESTAMPTZ,
    
    subida_por UUID NOT NULL,
    subida_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT fk_observacion_evidencias_observacion_id FOREIGN KEY (observacion_id) 
        REFERENCES auditoria_observaciones(id) ON DELETE CASCADE,
    CONSTRAINT fk_observacion_evidencias_subida_por FOREIGN KEY (subida_por) 
        REFERENCES auth.users(id) ON DELETE CASCADE,
    CONSTRAINT fk_observacion_evidencias_revisada_por FOREIGN KEY (revisada_por) 
        REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_observacion_evidencias_observacion_id ON observacion_evidencias(observacion_id);
CREATE INDEX IF NOT EXISTS idx_observacion_evidencias_tipo ON observacion_evidencias(tipo_evidencia);
CREATE INDEX IF NOT EXISTS idx_observacion_evidencias_revisada ON observacion_evidencias(revisada);

-- Tabla: auditoria_informe
CREATE TABLE IF NOT EXISTS auditoria_informe (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auditoria_id UUID NOT NULL,
    
    tipo_informe TEXT NOT NULL,
    
    -- ============================================
    -- CAMPOS LLENADOS POR EL AUDITOR
    -- ============================================
    encabezado TEXT,
    de TEXT,
    para TEXT,
    asunto TEXT,
    fecha_inicio_informe DATE,
    
    antecedentes TEXT,
    objetivos TEXT,
    alcance TEXT,
    resultados_revision TEXT,
    
    metodologia_aplicada TEXT,
    
    -- Campos específicos para observaciones en el informe
    titulo_observaciones TEXT,
    observaciones_enumeradas JSONB, -- Array de observaciones: [{numero, titulo, descripcion, recomendacion, responsable_id}]
    
    conclusiones TEXT,
    recomendaciones_generales TEXT,
    
    -- ============================================
    -- CAMPOS LLENADOS POR EL AUDITADO
    -- ============================================
    estrategia TEXT,
    fecha_inicio_implementacion DATE,
    fecha_fin_implementacion DATE,
    entregable TEXT,
    
    -- ============================================
    -- CONTROL DE VERSIONES Y ESTADO
    -- ============================================
    version INTEGER NOT NULL DEFAULT 1,
    es_version_actual BOOLEAN NOT NULL DEFAULT true,
    
    estado TEXT NOT NULL DEFAULT 'BORRADOR',
    
    -- ============================================
    -- CONTROL DE ELABORACIÓN Y APROBACIÓN
    -- ============================================
    elaborado_por UUID NOT NULL,
    fecha_elaboracion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    revisado_por UUID,
    fecha_revision TIMESTAMPTZ,
    comentarios_revision TEXT,
    
    aprobado_por UUID,
    fecha_aprobacion TIMESTAMPTZ,
    
    fecha_socializacion TIMESTAMPTZ,
    participantes_socializacion TEXT[],
    
    -- ============================================
    -- ARCHIVOS GENERADOS
    -- ============================================
    documento_word_url TEXT,
    documento_pdf_url TEXT,
    documento_firmado_url TEXT,
    documento_escaneado_url TEXT,
    
    -- ============================================
    -- METADATOS
    -- ============================================
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT fk_auditoria_informe_auditoria_id FOREIGN KEY (auditoria_id) 
        REFERENCES auditorias(id) ON DELETE CASCADE,
    CONSTRAINT fk_auditoria_informe_elaborado_por FOREIGN KEY (elaborado_por) 
        REFERENCES auth.users(id) ON DELETE RESTRICT,
    CONSTRAINT fk_auditoria_informe_revisado_por FOREIGN KEY (revisado_por) 
        REFERENCES auth.users(id) ON DELETE SET NULL,
    CONSTRAINT fk_auditoria_informe_aprobado_por FOREIGN KEY (aprobado_por) 
        REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_auditoria_informe_auditoria_id ON auditoria_informe(auditoria_id);
CREATE INDEX IF NOT EXISTS idx_auditoria_informe_tipo ON auditoria_informe(tipo_informe);
CREATE INDEX IF NOT EXISTS idx_auditoria_informe_estado ON auditoria_informe(estado);
CREATE INDEX IF NOT EXISTS idx_auditoria_informe_es_version_actual ON auditoria_informe(es_version_actual);
CREATE INDEX IF NOT EXISTS idx_auditoria_informe_elaborado_por ON auditoria_informe(elaborado_por);
CREATE INDEX IF NOT EXISTS idx_auditoria_informe_fecha_inicio_implementacion ON auditoria_informe(fecha_inicio_implementacion);
CREATE INDEX IF NOT EXISTS idx_auditoria_informe_fecha_fin_implementacion ON auditoria_informe(fecha_fin_implementacion);

DROP TRIGGER IF EXISTS update_auditoria_informe_updated_at ON auditoria_informe;
CREATE TRIGGER update_auditoria_informe_updated_at
    BEFORE UPDATE ON auditoria_informe
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Tabla: informe_firmas
CREATE TABLE IF NOT EXISTS informe_firmas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    informe_id UUID NOT NULL,
    
    firmante_id UUID NOT NULL,
    rol_firmante TEXT NOT NULL,
    
    firmado BOOLEAN DEFAULT false,
    fecha_firma TIMESTAMPTZ,
    firma_digital_url TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT fk_informe_firmas_informe_id FOREIGN KEY (informe_id) 
        REFERENCES auditoria_informe(id) ON DELETE CASCADE,
    CONSTRAINT fk_informe_firmas_firmante_id FOREIGN KEY (firmante_id) 
        REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_informe_firmas_informe_id ON informe_firmas(informe_id);
CREATE INDEX IF NOT EXISTS idx_informe_firmas_firmante_id ON informe_firmas(firmante_id);
CREATE INDEX IF NOT EXISTS idx_informe_firmas_firmado ON informe_firmas(firmado);

-- Tabla: comunicaciones_auditado
CREATE TABLE IF NOT EXISTS comunicaciones_auditado (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auditoria_id UUID NOT NULL,
    destinatario_id UUID NOT NULL,
    tipo_comunicacion TEXT NOT NULL,
    asunto TEXT NOT NULL,
    mensaje TEXT NOT NULL,
    fecha_envio TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    metodo_envio TEXT NOT NULL,
    confirmado BOOLEAN NOT NULL DEFAULT false,
    fecha_confirmacion TIMESTAMPTZ,
    fecha_lectura TIMESTAMPTZ,
    enviado_por UUID,
    
    CONSTRAINT fk_comunicaciones_auditado_auditoria_id FOREIGN KEY (auditoria_id) 
        REFERENCES auditorias(id) ON DELETE CASCADE,
    CONSTRAINT fk_comunicaciones_auditado_destinatario_id FOREIGN KEY (destinatario_id) 
        REFERENCES auth.users(id) ON DELETE CASCADE,
    CONSTRAINT fk_comunicaciones_auditado_enviado_por FOREIGN KEY (enviado_por) 
        REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_comunicaciones_auditado_auditoria_id ON comunicaciones_auditado(auditoria_id);
CREATE INDEX IF NOT EXISTS idx_comunicaciones_auditado_destinatario_id ON comunicaciones_auditado(destinatario_id);
CREATE INDEX IF NOT EXISTS idx_comunicaciones_auditado_tipo ON comunicaciones_auditado(tipo_comunicacion);
CREATE INDEX IF NOT EXISTS idx_comunicaciones_auditado_fecha_envio ON comunicaciones_auditado(fecha_envio);

-- Tabla: solicitudes_documentacion
CREATE TABLE IF NOT EXISTS solicitudes_documentacion (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auditoria_id UUID NOT NULL,
    
    -- Información de la solicitud
    titulo TEXT NOT NULL,
    descripcion TEXT NOT NULL,
    tipo_documento TEXT, -- Ejemplo: "Base de datos", "Políticas", "Procedimientos", etc.
    
    -- Auditor que solicita
    solicitado_por UUID NOT NULL,
    fecha_solicitud TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    fecha_limite DATE, -- Fecha límite para entregar
    
    -- Auditado que debe responder
    destinatario_id UUID NOT NULL,
    
    -- Respuesta del auditado
    link_drive TEXT, -- Link de Google Drive donde subió la documentación
    comentarios_respuesta TEXT,
    fecha_respuesta TIMESTAMPTZ,
    
    -- Estado
    estado TEXT NOT NULL DEFAULT 'PENDIENTE', -- PENDIENTE, ENVIADA, RECIBIDA, VENCIDA
    
    -- Control
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT fk_solicitudes_documentacion_auditoria_id FOREIGN KEY (auditoria_id) 
        REFERENCES auditorias(id) ON DELETE CASCADE,
    CONSTRAINT fk_solicitudes_documentacion_solicitado_por FOREIGN KEY (solicitado_por) 
        REFERENCES auth.users(id) ON DELETE RESTRICT,
    CONSTRAINT fk_solicitudes_documentacion_destinatario_id FOREIGN KEY (destinatario_id) 
        REFERENCES auth.users(id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_solicitudes_documentacion_auditoria_id ON solicitudes_documentacion(auditoria_id);
CREATE INDEX IF NOT EXISTS idx_solicitudes_documentacion_solicitado_por ON solicitudes_documentacion(solicitado_por);
CREATE INDEX IF NOT EXISTS idx_solicitudes_documentacion_destinatario_id ON solicitudes_documentacion(destinatario_id);
CREATE INDEX IF NOT EXISTS idx_solicitudes_documentacion_estado ON solicitudes_documentacion(estado);
CREATE INDEX IF NOT EXISTS idx_solicitudes_documentacion_fecha_limite ON solicitudes_documentacion(fecha_limite);

DROP TRIGGER IF EXISTS update_solicitudes_documentacion_updated_at ON solicitudes_documentacion;
CREATE TRIGGER update_solicitudes_documentacion_updated_at
    BEFORE UPDATE ON solicitudes_documentacion
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Comentarios de documentación
COMMENT ON TABLE users IS 'Información adicional de usuarios del sistema';
COMMENT ON TABLE audit_plans IS 'Planes de auditoría anuales';
COMMENT ON TABLE audit_activities IS 'Actividades de auditoría asociadas a planes';
COMMENT ON TABLE auditorias IS 'Auditorías con control de flujo completo';
COMMENT ON TABLE auditoria_preparacion IS 'Objetivos, alcances y criterios de auditoría';
COMMENT ON TABLE auditoria_participantes IS 'Participantes (auditados) y su estado';
COMMENT ON TABLE auditoria_observaciones IS 'Matriz general de observaciones con seguimiento';
COMMENT ON TABLE observacion_avances IS 'Registro mensual de avances por observación';
COMMENT ON TABLE observacion_evidencias IS 'Evidencias y descargos de observaciones';
COMMENT ON TABLE auditoria_informe IS 'Informes borrador y final de auditoría. Campos separados para llenado por Auditor y Auditado. Permite automatización con N8N para generar documento Word. Una vez llenado, se pasa a la matriz de observaciones.';
COMMENT ON TABLE informe_firmas IS 'Control de firmas de informes';
COMMENT ON TABLE comunicaciones_auditado IS 'Comunicaciones y recordatorios a auditados';
COMMENT ON TABLE solicitudes_documentacion IS 'Solicitudes de documentación del auditor al auditado. El auditado responde con link de Drive';

-- ============================================
-- CONFIRMACIÓN FINAL
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════';
  RAISE NOTICE '✅ MIGRACIÓN COMPLETA FINALIZADA';
  RAISE NOTICE '═══════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Tablas creadas:';
  RAISE NOTICE '   ✅ users';
  RAISE NOTICE '   ✅ audit_plans';
  RAISE NOTICE '   ✅ audit_activities';
  RAISE NOTICE '   ✅ auditorias';
  RAISE NOTICE '   ✅ auditoria_preparacion';
  RAISE NOTICE '   ✅ auditoria_participantes';
  RAISE NOTICE '   ⭐ auditoria_observaciones (MATRIZ GENERAL)';
  RAISE NOTICE '   ⭐ observacion_avances';
  RAISE NOTICE '   ⭐ observacion_evidencias';
  RAISE NOTICE '   ⭐ auditoria_informe';
  RAISE NOTICE '   ⭐ informe_firmas';
  RAISE NOTICE '   ✅ comunicaciones_auditado';
  RAISE NOTICE '   ✅ solicitudes_documentacion';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️ PENDIENTE: Crear políticas RLS y funciones auxiliares';
  RAISE NOTICE '';
END $$;

