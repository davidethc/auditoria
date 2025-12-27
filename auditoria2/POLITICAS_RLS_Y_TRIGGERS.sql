-- ============================================
-- SCRIPT DE POLÍTICAS RLS Y TRIGGERS
-- ============================================
-- Este script crea:
-- 1. Funciones auxiliares para verificar roles y permisos
-- 2. Triggers necesarios para el sistema
-- 3. Políticas RLS (Row Level Security) para cada tabla
-- 
-- Roles del sistema:
-- - auditor_interno: Gestiona todo, manda actividades
-- - auditor: Gestiona auditorías asignadas
-- - auditado: Gestiona su parte en auditorías
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════';
  RAISE NOTICE '🔐 CREANDO POLÍTICAS RLS Y TRIGGERS';
  RAISE NOTICE '═══════════════════════════════════════════════';
  RAISE NOTICE '';
END $$;

-- ============================================
-- PARTE 1: FUNCIONES AUXILIARES
-- ============================================

-- Función para obtener el rol del usuario actual
CREATE OR REPLACE FUNCTION get_current_user_role()
RETURNS TEXT AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role
  FROM public.users
  WHERE id = auth.uid();
  
  RETURN COALESCE(user_role, '');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para verificar si el usuario es auditor interno
CREATE OR REPLACE FUNCTION is_auditor_interno()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN get_current_user_role() = 'auditor_interno';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para verificar si el usuario es auditor
CREATE OR REPLACE FUNCTION is_auditor()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN get_current_user_role() IN ('auditor', 'auditor_interno');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para verificar si el usuario es participante en una auditoría
CREATE OR REPLACE FUNCTION is_user_participant_in_auditoria(
  p_auditoria_id UUID,
  p_user_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.auditoria_participantes
    WHERE auditoria_id = p_auditoria_id
      AND user_id = p_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para verificar si el usuario es responsable de una auditoría
CREATE OR REPLACE FUNCTION is_user_responsable_auditoria(
  p_auditoria_id UUID,
  p_user_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.auditorias
    WHERE id = p_auditoria_id
      AND auditor_responsable_id = p_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para verificar si el usuario es responsable de una actividad
CREATE OR REPLACE FUNCTION is_user_responsable_activity(
  p_activity_id UUID,
  p_user_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.audit_activities
    WHERE id = p_activity_id
      AND auditor_id = p_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para crear usuario automáticamente cuando se crea en auth.users
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'auditado')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para calcular fecha de notificación
CREATE OR REPLACE FUNCTION calculate_notification_date(cutoff_date DATE)
RETURNS DATE AS $$
BEGIN
  IF cutoff_date IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Restar 15 días laborables (aproximadamente 21 días calendario)
  RETURN cutoff_date - INTERVAL '21 days';
END;
$$ LANGUAGE plpgsql;

-- Función genérica para actualizar updated_at (para tablas que tienen updated_at)
-- NOTA: Esta función NO debe usarse para auditorias (usa update_auditorias_actualizada_at)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  -- Solo actualizar updated_at para tablas que lo tienen (NO auditorias)
  IF TG_TABLE_NAME IN ('auditoria_observaciones', 'auditoria_informe', 'solicitudes_documentacion') THEN
    NEW.updated_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Función específica para actualizar actualizada_at en auditorias
CREATE OR REPLACE FUNCTION update_auditorias_actualizada_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.actualizada_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Función para actualizar fecha de notificación en actividades
CREATE OR REPLACE FUNCTION update_notification_date()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.cutoff_date IS NOT NULL AND NEW.cutoff_date IS DISTINCT FROM OLD.cutoff_date THEN
    NEW.notification_date = calculate_notification_date(NEW.cutoff_date);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Función para actualizar auditor_assigned_at cuando se asigna un auditor
CREATE OR REPLACE FUNCTION update_auditor_assigned_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.auditor_id IS NOT NULL AND (OLD.auditor_id IS NULL OR NEW.auditor_id IS DISTINCT FROM OLD.auditor_id) THEN
    NEW.auditor_assigned_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Función para validar que el auditor_responsable_id sea un auditor
CREATE OR REPLACE FUNCTION validate_auditor_role()
RETURNS TRIGGER AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role
  FROM public.users
  WHERE id = NEW.auditor_responsable_id;
  
  IF user_role NOT IN ('auditor', 'auditor_interno') THEN
    RAISE EXCEPTION 'El usuario asignado como responsable debe ser un auditor o auditor interno';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Función para actualizar fecha_cierre cuando el estado cambia a CERRADA
CREATE OR REPLACE FUNCTION update_fecha_cierre()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.estado = 'CERRADA' AND (OLD.estado IS NULL OR OLD.estado != 'CERRADA') THEN
    NEW.fecha_cierre = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Función para establecer fecha_notificacion cuando se crea un participante
CREATE OR REPLACE FUNCTION set_fecha_notificacion()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.fecha_notificacion IS NULL AND NEW.notificado_por IS NOT NULL THEN
    NEW.fecha_notificacion = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  RAISE NOTICE '✅ Funciones auxiliares creadas';
END $$;

-- ============================================
-- PARTE 2: TRIGGERS
-- ============================================

-- Trigger: Crear usuario automáticamente en auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Trigger: Actualizar notification_date en audit_activities
DROP TRIGGER IF EXISTS update_notification_date_trigger ON public.audit_activities;
CREATE TRIGGER update_notification_date_trigger
  BEFORE INSERT OR UPDATE ON public.audit_activities
  FOR EACH ROW
  EXECUTE FUNCTION update_notification_date();

-- Trigger: Actualizar auditor_assigned_at en audit_activities
DROP TRIGGER IF EXISTS update_auditor_assigned_at_trigger ON public.audit_activities;
CREATE TRIGGER update_auditor_assigned_at_trigger
  BEFORE INSERT OR UPDATE ON public.audit_activities
  FOR EACH ROW
  EXECUTE FUNCTION update_auditor_assigned_at();

-- Trigger: Validar rol de auditor en auditorias
DROP TRIGGER IF EXISTS validate_auditor_role_trigger ON public.auditorias;
CREATE TRIGGER validate_auditor_role_trigger
  BEFORE INSERT OR UPDATE ON public.auditorias
  FOR EACH ROW
  EXECUTE FUNCTION validate_auditor_role();

-- Trigger: Actualizar fecha_cierre en auditorias
DROP TRIGGER IF EXISTS update_fecha_cierre_trigger ON public.auditorias;
CREATE TRIGGER update_fecha_cierre_trigger
  BEFORE UPDATE ON public.auditorias
  FOR EACH ROW
  EXECUTE FUNCTION update_fecha_cierre();

-- Trigger: Actualizar actualizada_at en auditorias (usa función específica)
DROP TRIGGER IF EXISTS update_auditorias_updated_at ON public.auditorias;
DROP TRIGGER IF EXISTS update_auditorias_actualizada_at_trigger ON public.auditorias;
CREATE TRIGGER update_auditorias_actualizada_at_trigger
  BEFORE UPDATE ON public.auditorias
  FOR EACH ROW
  EXECUTE FUNCTION update_auditorias_actualizada_at();

-- Trigger: Establecer fecha_notificacion en auditoria_participantes
DROP TRIGGER IF EXISTS set_fecha_notificacion_trigger ON public.auditoria_participantes;
CREATE TRIGGER set_fecha_notificacion_trigger
  BEFORE INSERT OR UPDATE ON public.auditoria_participantes
  FOR EACH ROW
  EXECUTE FUNCTION set_fecha_notificacion();

-- Trigger: Actualizar updated_at en auditoria_observaciones
DROP TRIGGER IF EXISTS update_auditoria_observaciones_updated_at ON public.auditoria_observaciones;
CREATE TRIGGER update_auditoria_observaciones_updated_at
  BEFORE UPDATE ON public.auditoria_observaciones
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Actualizar updated_at en auditoria_informe
DROP TRIGGER IF EXISTS update_auditoria_informe_updated_at ON public.auditoria_informe;
CREATE TRIGGER update_auditoria_informe_updated_at
  BEFORE UPDATE ON public.auditoria_informe
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DO $$
BEGIN
  RAISE NOTICE '✅ Triggers creados';
END $$;

-- ============================================
-- PARTE 3: HABILITAR RLS EN TODAS LAS TABLAS
-- ============================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auditorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auditoria_preparacion ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auditoria_participantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auditoria_observaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.observacion_avances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.observacion_evidencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auditoria_informe ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.informe_firmas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comunicaciones_auditado ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  RAISE NOTICE '✅ RLS habilitado en todas las tablas';
END $$;

-- ============================================
-- PARTE 4: POLÍTICAS RLS - TABLA: users
-- ============================================

-- Política: Los usuarios pueden ver su propio perfil
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
CREATE POLICY "Users can view their own profile"
  ON public.users
  FOR SELECT
  USING (id = auth.uid());

-- Política: Los usuarios pueden actualizar su propio perfil
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
CREATE POLICY "Users can update their own profile"
  ON public.users
  FOR UPDATE
  USING (id = auth.uid());

-- Política: Auditor interno puede ver todos los usuarios
DROP POLICY IF EXISTS "Auditor interno can view all users" ON public.users;
CREATE POLICY "Auditor interno can view all users"
  ON public.users
  FOR SELECT
  USING (is_auditor_interno());

-- Política: Auditor interno puede actualizar usuarios
DROP POLICY IF EXISTS "Auditor interno can update users" ON public.users;
CREATE POLICY "Auditor interno can update users"
  ON public.users
  FOR UPDATE
  USING (is_auditor_interno());

-- Política: Permitir inserción desde trigger de auth
DROP POLICY IF EXISTS "Allow insert from auth trigger" ON public.users;
CREATE POLICY "Allow insert from auth trigger"
  ON public.users
  FOR INSERT
  WITH CHECK (true);

DO $$
BEGIN
  RAISE NOTICE '✅ Políticas RLS para users creadas';
END $$;

-- ============================================
-- PARTE 5: POLÍTICAS RLS - TABLA: audit_plans
-- ============================================

-- Política: Todos pueden leer planes
DROP POLICY IF EXISTS "Todos pueden leer planes" ON public.audit_plans;
CREATE POLICY "Todos pueden leer planes"
  ON public.audit_plans
  FOR SELECT
  USING (true);

-- Política: Solo auditor interno puede crear planes
DROP POLICY IF EXISTS "Auditor interno crea planes" ON public.audit_plans;
CREATE POLICY "Auditor interno crea planes"
  ON public.audit_plans
  FOR INSERT
  WITH CHECK (is_auditor_interno());

-- Política: Solo auditor interno puede actualizar planes
DROP POLICY IF EXISTS "Auditor interno actualiza planes" ON public.audit_plans;
CREATE POLICY "Auditor interno actualiza planes"
  ON public.audit_plans
  FOR UPDATE
  USING (is_auditor_interno());

-- Política: Solo auditor interno puede eliminar planes
DROP POLICY IF EXISTS "Auditor interno elimina planes" ON public.audit_plans;
CREATE POLICY "Auditor interno elimina planes"
  ON public.audit_plans
  FOR DELETE
  USING (is_auditor_interno());

DO $$
BEGIN
  RAISE NOTICE '✅ Políticas RLS para audit_plans creadas';
END $$;

-- ============================================
-- PARTE 6: POLÍTICAS RLS - TABLA: audit_activities
-- ============================================

-- Política: Todos pueden leer actividades
DROP POLICY IF EXISTS "Todos pueden leer actividades" ON public.audit_activities;
CREATE POLICY "Todos pueden leer actividades"
  ON public.audit_activities
  FOR SELECT
  USING (true);

-- Política: Solo auditor interno puede crear actividades
DROP POLICY IF EXISTS "Auditor interno crea actividades" ON public.audit_activities;
CREATE POLICY "Auditor interno crea actividades"
  ON public.audit_activities
  FOR INSERT
  WITH CHECK (is_auditor_interno());

-- Política: Solo auditor interno puede actualizar actividades
DROP POLICY IF EXISTS "Auditor interno actualiza actividades" ON public.audit_activities;
CREATE POLICY "Auditor interno actualiza actividades"
  ON public.audit_activities
  FOR UPDATE
  USING (is_auditor_interno());

-- Política: Solo auditor interno puede eliminar actividades
DROP POLICY IF EXISTS "Auditor interno elimina actividades" ON public.audit_activities;
CREATE POLICY "Auditor interno elimina actividades"
  ON public.audit_activities
  FOR DELETE
  USING (is_auditor_interno());

-- Política: Auditor puede validar sus actividades asignadas
DROP POLICY IF EXISTS "Auditor puede validar actividades" ON public.audit_activities;
CREATE POLICY "Auditor puede validar actividades"
  ON public.audit_activities
  FOR UPDATE
  USING (
    auditor_id = auth.uid() 
    AND is_auditor()
  )
  WITH CHECK (
    auditor_id = auth.uid() 
    AND is_auditor()
  );

DO $$
BEGIN
  RAISE NOTICE '✅ Políticas RLS para audit_activities creadas';
END $$;

-- ============================================
-- PARTE 7: POLÍTICAS RLS - TABLA: auditorias
-- ============================================

-- Política: Todos pueden leer auditorías (sin recursión)
DROP POLICY IF EXISTS "Todos pueden leer auditorias" ON public.auditorias;
CREATE POLICY "Todos pueden leer auditorias"
  ON public.auditorias
  FOR SELECT
  USING (true);

-- Política: Usuarios autenticados pueden crear auditorías si son auditores
-- Verificamos el rol directamente sin usar funciones que puedan causar recursión
DROP POLICY IF EXISTS "Auditores pueden crear auditorias" ON public.auditorias;
CREATE POLICY "Auditores pueden crear auditorias"
  ON public.auditorias
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
        AND role IN ('auditor', 'auditor_interno')
    )
    AND auditor_responsable_id = auth.uid()
  );

-- Política: Auditor responsable puede actualizar su auditoría
DROP POLICY IF EXISTS "Auditor responsable actualiza auditoria" ON public.auditorias;
CREATE POLICY "Auditor responsable actualiza auditoria"
  ON public.auditorias
  FOR UPDATE
  USING (
    auditor_responsable_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
        AND role IN ('auditor', 'auditor_interno')
    )
  )
  WITH CHECK (
    auditor_responsable_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
        AND role IN ('auditor', 'auditor_interno')
    )
  );

-- Política: Auditor interno puede actualizar cualquier auditoría
DROP POLICY IF EXISTS "Auditor interno actualiza auditorias" ON public.auditorias;
CREATE POLICY "Auditor interno actualiza auditorias"
  ON public.auditorias
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
        AND role = 'auditor_interno'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
        AND role = 'auditor_interno'
    )
  );

-- Política: Auditado puede ver auditorías donde es participante
-- Usamos EXISTS directo sin funciones auxiliares para evitar recursión
DROP POLICY IF EXISTS "Auditado ve auditorias donde participa" ON public.auditorias;
CREATE POLICY "Auditado ve auditorias donde participa"
  ON public.auditorias
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
        AND role = 'auditado'
    )
    AND EXISTS (
      SELECT 1 FROM public.auditoria_participantes
      WHERE auditoria_id = auditorias.id
        AND user_id = auth.uid()
    )
  );

-- Política: Solo auditor interno puede eliminar auditorías
DROP POLICY IF EXISTS "Auditor interno elimina auditorias" ON public.auditorias;
CREATE POLICY "Auditor interno elimina auditorias"
  ON public.auditorias
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
        AND role = 'auditor_interno'
    )
  );

DO $$
BEGIN
  RAISE NOTICE '✅ Políticas RLS para auditorias creadas';
END $$;

-- ============================================
-- PARTE 8: POLÍTICAS RLS - TABLA: auditoria_preparacion
-- ============================================

-- Política: Todos pueden leer preparación
DROP POLICY IF EXISTS "Todos pueden leer preparacion" ON public.auditoria_preparacion;
CREATE POLICY "Todos pueden leer preparacion"
  ON public.auditoria_preparacion
  FOR SELECT
  USING (true);

-- Política: Auditor responsable puede crear/actualizar preparación
DROP POLICY IF EXISTS "Auditor responsable gestiona preparacion" ON public.auditoria_preparacion;
CREATE POLICY "Auditor responsable gestiona preparacion"
  ON public.auditoria_preparacion
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.auditorias
      WHERE id = auditoria_preparacion.auditoria_id
        AND auditor_responsable_id = auth.uid()
        AND is_auditor()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.auditorias
      WHERE id = auditoria_preparacion.auditoria_id
        AND auditor_responsable_id = auth.uid()
        AND is_auditor()
    )
  );

-- Política: Auditor interno puede gestionar cualquier preparación
DROP POLICY IF EXISTS "Auditor interno gestiona preparacion" ON public.auditoria_preparacion;
CREATE POLICY "Auditor interno gestiona preparacion"
  ON public.auditoria_preparacion
  FOR ALL
  USING (is_auditor_interno())
  WITH CHECK (is_auditor_interno());

DO $$
BEGIN
  RAISE NOTICE '✅ Políticas RLS para auditoria_preparacion creadas';
END $$;

-- ============================================
-- PARTE 9: POLÍTICAS RLS - TABLA: auditoria_participantes
-- ============================================

-- Política: Todos pueden leer participantes
DROP POLICY IF EXISTS "Todos pueden leer participantes" ON public.auditoria_participantes;
CREATE POLICY "Todos pueden leer participantes"
  ON public.auditoria_participantes
  FOR SELECT
  USING (true);

-- Política: Auditor responsable puede gestionar participantes
DROP POLICY IF EXISTS "Auditor responsable gestiona participantes" ON public.auditoria_participantes;
CREATE POLICY "Auditor responsable gestiona participantes"
  ON public.auditoria_participantes
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.auditorias
      WHERE id = auditoria_participantes.auditoria_id
        AND auditor_responsable_id = auth.uid()
        AND is_auditor()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.auditorias
      WHERE id = auditoria_participantes.auditoria_id
        AND auditor_responsable_id = auth.uid()
        AND is_auditor()
    )
  );

-- Política: Auditor interno puede gestionar cualquier participante
DROP POLICY IF EXISTS "Auditor interno gestiona participantes" ON public.auditoria_participantes;
CREATE POLICY "Auditor interno gestiona participantes"
  ON public.auditoria_participantes
  FOR ALL
  USING (is_auditor_interno())
  WITH CHECK (is_auditor_interno());

-- Política: Auditado puede actualizar su propia participación
DROP POLICY IF EXISTS "Auditado actualiza su participacion" ON public.auditoria_participantes;
CREATE POLICY "Auditado actualiza su participacion"
  ON public.auditoria_participantes
  FOR UPDATE
  USING (
    user_id = auth.uid()
    AND get_current_user_role() = 'auditado'
  )
  WITH CHECK (
    user_id = auth.uid()
    AND get_current_user_role() = 'auditado'
  );

DO $$
BEGIN
  RAISE NOTICE '✅ Políticas RLS para auditoria_participantes creadas';
END $$;

-- ============================================
-- PARTE 10: POLÍTICAS RLS - TABLA: auditoria_observaciones
-- ============================================

-- Política: Todos pueden leer observaciones
DROP POLICY IF EXISTS "Todos pueden leer observaciones" ON public.auditoria_observaciones;
CREATE POLICY "Todos pueden leer observaciones"
  ON public.auditoria_observaciones
  FOR SELECT
  USING (true);

-- Política: Auditor responsable puede crear observaciones
DROP POLICY IF EXISTS "Auditor responsable crea observaciones" ON public.auditoria_observaciones;
CREATE POLICY "Auditor responsable crea observaciones"
  ON public.auditoria_observaciones
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.auditorias
      WHERE id = auditoria_observaciones.auditoria_id
        AND auditor_responsable_id = auth.uid()
        AND is_auditor()
    )
  );

-- Política: Auditor responsable puede actualizar observaciones
DROP POLICY IF EXISTS "Auditor responsable actualiza observaciones" ON public.auditoria_observaciones;
CREATE POLICY "Auditor responsable actualiza observaciones"
  ON public.auditoria_observaciones
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.auditorias
      WHERE id = auditoria_observaciones.auditoria_id
        AND auditor_responsable_id = auth.uid()
        AND is_auditor()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.auditorias
      WHERE id = auditoria_observaciones.auditoria_id
        AND auditor_responsable_id = auth.uid()
        AND is_auditor()
    )
  );

-- Política: Auditor interno puede gestionar cualquier observación
DROP POLICY IF EXISTS "Auditor interno gestiona observaciones" ON public.auditoria_observaciones;
CREATE POLICY "Auditor interno gestiona observaciones"
  ON public.auditoria_observaciones
  FOR ALL
  USING (is_auditor_interno())
  WITH CHECK (is_auditor_interno());

-- Política: Responsable de implementación puede actualizar su observación
DROP POLICY IF EXISTS "Responsable actualiza su observacion" ON public.auditoria_observaciones;
CREATE POLICY "Responsable actualiza su observacion"
  ON public.auditoria_observaciones
  FOR UPDATE
  USING (
    responsable_implementacion = auth.uid()
    AND get_current_user_role() = 'auditado'
  )
  WITH CHECK (
    responsable_implementacion = auth.uid()
    AND get_current_user_role() = 'auditado'
  );

DO $$
BEGIN
  RAISE NOTICE '✅ Políticas RLS para auditoria_observaciones creadas';
END $$;

-- ============================================
-- PARTE 11: POLÍTICAS RLS - TABLA: observacion_avances
-- ============================================

-- Política: Todos pueden leer avances
DROP POLICY IF EXISTS "Todos pueden leer avances" ON public.observacion_avances;
CREATE POLICY "Todos pueden leer avances"
  ON public.observacion_avances
  FOR SELECT
  USING (true);

-- Política: Responsable puede crear avances
DROP POLICY IF EXISTS "Responsable crea avances" ON public.observacion_avances;
CREATE POLICY "Responsable crea avances"
  ON public.observacion_avances
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.auditoria_observaciones
      WHERE id = observacion_avances.observacion_id
        AND responsable_implementacion = auth.uid()
    )
    OR is_auditor_interno()
  );

-- Política: Responsable puede actualizar sus avances
DROP POLICY IF EXISTS "Responsable actualiza avances" ON public.observacion_avances;
CREATE POLICY "Responsable actualiza avances"
  ON public.observacion_avances
  FOR UPDATE
  USING (
    reportado_por = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.auditoria_observaciones
      WHERE id = observacion_avances.observacion_id
        AND responsable_implementacion = auth.uid()
    )
    OR is_auditor_interno()
  )
  WITH CHECK (
    reportado_por = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.auditoria_observaciones
      WHERE id = observacion_avances.observacion_id
        AND responsable_implementacion = auth.uid()
    )
    OR is_auditor_interno()
  );

-- Política: Auditor interno puede gestionar cualquier avance
DROP POLICY IF EXISTS "Auditor interno gestiona avances" ON public.observacion_avances;
CREATE POLICY "Auditor interno gestiona avances"
  ON public.observacion_avances
  FOR ALL
  USING (is_auditor_interno())
  WITH CHECK (is_auditor_interno());

DO $$
BEGIN
  RAISE NOTICE '✅ Políticas RLS para observacion_avances creadas';
END $$;

-- ============================================
-- PARTE 12: POLÍTICAS RLS - TABLA: observacion_evidencias
-- ============================================

-- Política: Todos pueden leer evidencias
DROP POLICY IF EXISTS "Todos pueden leer evidencias" ON public.observacion_evidencias;
CREATE POLICY "Todos pueden leer evidencias"
  ON public.observacion_evidencias
  FOR SELECT
  USING (true);

-- Política: Responsable puede crear evidencias
DROP POLICY IF EXISTS "Responsable crea evidencias" ON public.observacion_evidencias;
CREATE POLICY "Responsable crea evidencias"
  ON public.observacion_evidencias
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.auditoria_observaciones
      WHERE id = observacion_evidencias.observacion_id
        AND responsable_implementacion = auth.uid()
    )
    OR is_auditor_interno()
  );

-- Política: Responsable puede actualizar sus evidencias
DROP POLICY IF EXISTS "Responsable actualiza evidencias" ON public.observacion_evidencias;
CREATE POLICY "Responsable actualiza evidencias"
  ON public.observacion_evidencias
  FOR UPDATE
  USING (
    subida_por = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.auditoria_observaciones
      WHERE id = observacion_evidencias.observacion_id
        AND responsable_implementacion = auth.uid()
    )
    OR is_auditor_interno()
  )
  WITH CHECK (
    subida_por = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.auditoria_observaciones
      WHERE id = observacion_evidencias.observacion_id
        AND responsable_implementacion = auth.uid()
    )
    OR is_auditor_interno()
  );

-- Política: Auditor puede revisar evidencias
DROP POLICY IF EXISTS "Auditor revisa evidencias" ON public.observacion_evidencias;
CREATE POLICY "Auditor revisa evidencias"
  ON public.observacion_evidencias
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.auditoria_observaciones ao
      JOIN public.auditorias a ON a.id = ao.auditoria_id
      WHERE ao.id = observacion_evidencias.observacion_id
        AND (a.auditor_responsable_id = auth.uid() OR ao.auditor_id = auth.uid())
        AND is_auditor()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.auditoria_observaciones ao
      JOIN public.auditorias a ON a.id = ao.auditoria_id
      WHERE ao.id = observacion_evidencias.observacion_id
        AND (a.auditor_responsable_id = auth.uid() OR ao.auditor_id = auth.uid())
        AND is_auditor()
    )
  );

-- Política: Auditor interno puede gestionar cualquier evidencia
DROP POLICY IF EXISTS "Auditor interno gestiona evidencias" ON public.observacion_evidencias;
CREATE POLICY "Auditor interno gestiona evidencias"
  ON public.observacion_evidencias
  FOR ALL
  USING (is_auditor_interno())
  WITH CHECK (is_auditor_interno());

DO $$
BEGIN
  RAISE NOTICE '✅ Políticas RLS para observacion_evidencias creadas';
END $$;

-- ============================================
-- PARTE 13: POLÍTICAS RLS - TABLA: auditoria_informe
-- ============================================

-- Política: Todos pueden leer informes
DROP POLICY IF EXISTS "Todos pueden leer informes" ON public.auditoria_informe;
CREATE POLICY "Todos pueden leer informes"
  ON public.auditoria_informe
  FOR SELECT
  USING (true);

-- Política: Auditor responsable puede crear informes
DROP POLICY IF EXISTS "Auditor responsable crea informes" ON public.auditoria_informe;
CREATE POLICY "Auditor responsable crea informes"
  ON public.auditoria_informe
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.auditorias
      WHERE id = auditoria_informe.auditoria_id
        AND auditor_responsable_id = auth.uid()
        AND is_auditor()
    )
  );

-- Política: Auditor responsable puede actualizar informes
DROP POLICY IF EXISTS "Auditor responsable actualiza informes" ON public.auditoria_informe;
CREATE POLICY "Auditor responsable actualiza informes"
  ON public.auditoria_informe
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.auditorias
      WHERE id = auditoria_informe.auditoria_id
        AND auditor_responsable_id = auth.uid()
        AND is_auditor()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.auditorias
      WHERE id = auditoria_informe.auditoria_id
        AND auditor_responsable_id = auth.uid()
        AND is_auditor()
    )
  );

-- Política: Auditado puede actualizar campos de implementación en informes
DROP POLICY IF EXISTS "Auditado actualiza campos implementacion" ON public.auditoria_informe;
CREATE POLICY "Auditado actualiza campos implementacion"
  ON public.auditoria_informe
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.auditoria_participantes
      WHERE auditoria_id = auditoria_informe.auditoria_id
        AND user_id = auth.uid()
        AND get_current_user_role() = 'auditado'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.auditoria_participantes
      WHERE auditoria_id = auditoria_informe.auditoria_id
        AND user_id = auth.uid()
        AND get_current_user_role() = 'auditado'
    )
  );

-- Política: Auditor interno puede gestionar cualquier informe
DROP POLICY IF EXISTS "Auditor interno gestiona informes" ON public.auditoria_informe;
CREATE POLICY "Auditor interno gestiona informes"
  ON public.auditoria_informe
  FOR ALL
  USING (is_auditor_interno())
  WITH CHECK (is_auditor_interno());

DO $$
BEGIN
  RAISE NOTICE '✅ Políticas RLS para auditoria_informe creadas';
END $$;

-- ============================================
-- PARTE 14: POLÍTICAS RLS - TABLA: informe_firmas
-- ============================================

-- Política: Todos pueden leer firmas
DROP POLICY IF EXISTS "Todos pueden leer firmas" ON public.informe_firmas;
CREATE POLICY "Todos pueden leer firmas"
  ON public.informe_firmas
  FOR SELECT
  USING (true);

-- Política: Firmante puede actualizar su propia firma
DROP POLICY IF EXISTS "Firmante actualiza su firma" ON public.informe_firmas;
CREATE POLICY "Firmante actualiza su firma"
  ON public.informe_firmas
  FOR UPDATE
  USING (firmante_id = auth.uid())
  WITH CHECK (firmante_id = auth.uid());

-- Política: Auditor responsable puede crear firmas
DROP POLICY IF EXISTS "Auditor responsable crea firmas" ON public.informe_firmas;
CREATE POLICY "Auditor responsable crea firmas"
  ON public.informe_firmas
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.auditoria_informe ai
      JOIN public.auditorias a ON a.id = ai.auditoria_id
      WHERE ai.id = informe_firmas.informe_id
        AND a.auditor_responsable_id = auth.uid()
        AND is_auditor()
    )
    OR is_auditor_interno()
  );

-- Política: Auditor interno puede gestionar cualquier firma
DROP POLICY IF EXISTS "Auditor interno gestiona firmas" ON public.informe_firmas;
CREATE POLICY "Auditor interno gestiona firmas"
  ON public.informe_firmas
  FOR ALL
  USING (is_auditor_interno())
  WITH CHECK (is_auditor_interno());

DO $$
BEGIN
  RAISE NOTICE '✅ Políticas RLS para informe_firmas creadas';
END $$;

-- ============================================
-- PARTE 15: POLÍTICAS RLS - TABLA: comunicaciones_auditado
-- ============================================

-- Política: Todos pueden leer comunicaciones
DROP POLICY IF EXISTS "Todos pueden leer comunicaciones" ON public.comunicaciones_auditado;
CREATE POLICY "Todos pueden leer comunicaciones"
  ON public.comunicaciones_auditado
  FOR SELECT
  USING (true);

-- Política: Destinatario puede actualizar su comunicación (confirmar lectura)
DROP POLICY IF EXISTS "Destinatario actualiza comunicacion" ON public.comunicaciones_auditado;
CREATE POLICY "Destinatario actualiza comunicacion"
  ON public.comunicaciones_auditado
  FOR UPDATE
  USING (destinatario_id = auth.uid())
  WITH CHECK (destinatario_id = auth.uid());

-- Política: Auditor responsable puede crear comunicaciones
DROP POLICY IF EXISTS "Auditor responsable crea comunicaciones" ON public.comunicaciones_auditado;
CREATE POLICY "Auditor responsable crea comunicaciones"
  ON public.comunicaciones_auditado
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.auditorias
      WHERE id = comunicaciones_auditado.auditoria_id
        AND auditor_responsable_id = auth.uid()
        AND is_auditor()
    )
    OR is_auditor_interno()
  );

-- Política: Auditor interno puede gestionar cualquier comunicación
DROP POLICY IF EXISTS "Auditor interno gestiona comunicaciones" ON public.comunicaciones_auditado;
CREATE POLICY "Auditor interno gestiona comunicaciones"
  ON public.comunicaciones_auditado
  FOR ALL
  USING (is_auditor_interno())
  WITH CHECK (is_auditor_interno());

DO $$
BEGIN
  RAISE NOTICE '✅ Políticas RLS para comunicaciones_auditado creadas';
END $$;

-- ============================================
-- CONFIRMACIÓN FINAL
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════';
  RAISE NOTICE '✅ POLÍTICAS RLS Y TRIGGERS COMPLETADOS';
  RAISE NOTICE '═══════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Resumen:';
  RAISE NOTICE '   ✅ Funciones auxiliares creadas';
  RAISE NOTICE '   ✅ Triggers creados';
  RAISE NOTICE '   ✅ RLS habilitado en todas las tablas';
  RAISE NOTICE '   ✅ Políticas RLS creadas para cada tabla';
  RAISE NOTICE '';
  RAISE NOTICE '🔐 Permisos por rol:';
  RAISE NOTICE '   👤 auditor_interno: Acceso total a todo';
  RAISE NOTICE '   👤 auditor: Gestiona auditorías asignadas';
  RAISE NOTICE '   👤 auditado: Gestiona su participación';
  RAISE NOTICE '';
END $$;

