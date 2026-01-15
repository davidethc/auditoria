-- ============================================
-- TRIGGERS Y FUNCIONES PARA PRODUCCIÓN BANCARIA
-- ============================================
-- Este script crea triggers que AUTOMÁTICAMENTE guardan datos
-- cuando ocurren eventos en el sistema, sin necesidad de webhooks
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════';
  RAISE NOTICE '🔧 CREANDO TRIGGERS DE PRODUCCIÓN';
  RAISE NOTICE '═══════════════════════════════════════════════';
  RAISE NOTICE '';
END $$;

-- ============================================
-- FLUJO 1: ACTUALIZAR MATRIZ CUANDO INFORME SE COMPLETA
-- ============================================

-- Función: Actualizar matriz de observaciones cuando informe está completo
CREATE OR REPLACE FUNCTION trigger_actualizar_matriz_desde_informe()
RETURNS TRIGGER AS $$
DECLARE
  v_informe RECORD;
  v_observacion JSONB;
  v_observacion_id UUID;
  v_observacion_numero INTEGER;
  v_observaciones_actualizadas INTEGER := 0;
BEGIN
  -- Solo ejecutar si el informe está completo
  -- Un informe está completo cuando tiene:
  -- - Todos los campos del auditor llenos
  -- - Estrategia y fechas del auditado
  -- - Estado = 'COMPLETADO' o 'ENVIADO_A_AUDITADOS'
  
  IF NEW.estado IN ('COMPLETADO', 'ENVIADO_A_AUDITADOS') AND
     NEW.encabezado IS NOT NULL AND
     NEW.de IS NOT NULL AND
     NEW.para IS NOT NULL AND
     NEW.asunto IS NOT NULL AND
     NEW.estrategia IS NOT NULL AND
     NEW.fecha_inicio_implementacion IS NOT NULL AND
     NEW.fecha_fin_implementacion IS NOT NULL AND
     NEW.observaciones_enumeradas IS NOT NULL THEN
    
    -- Obtener datos del informe
    SELECT * INTO v_informe
    FROM auditoria_informe
    WHERE id = NEW.id;
    
    -- Iterar sobre cada observación en observaciones_enumeradas
    FOR v_observacion IN 
      SELECT * FROM jsonb_array_elements(v_informe.observaciones_enumeradas)
    LOOP
      v_observacion_id := (v_observacion->>'id')::UUID;
      v_observacion_numero := (v_observacion->>'numero')::INTEGER;
      
      -- Actualizar observación en la matriz
      IF v_observacion_id IS NOT NULL THEN
        UPDATE auditoria_observaciones
        SET
          numero_informe = v_informe.encabezado,
          fecha_emision_informe = v_informe.fecha_elaboracion::DATE,
          fecha_envio_informe = COALESCE(
            v_informe.fecha_socializacion::DATE,
            v_informe.fecha_aprobacion::DATE
          ),
          estrategia = COALESCE(
            (v_observacion->>'estrategia')::TEXT,
            v_informe.estrategia
          ),
          entregable = COALESCE(
            (v_observacion->>'entregable')::TEXT,
            v_informe.entregable
          ),
          fecha_inicio = v_informe.fecha_inicio_implementacion,
          fecha_fin = v_informe.fecha_fin_implementacion,
          plazo_dias_laborables = calcular_dias_laborables(
            v_informe.fecha_inicio_implementacion,
            v_informe.fecha_fin_implementacion
          ),
          responsable_estrategia = COALESCE(
            (v_observacion->>'responsable_id')::UUID,
            (v_observacion->>'responsable_estrategia')::UUID
          ),
          responsable_implementacion = COALESCE(
            (v_observacion->>'responsable_implementacion')::UUID,
            (v_observacion->>'responsable_id')::UUID
          ),
          updated_at = NOW()
        WHERE id = v_observacion_id;
        
        IF FOUND THEN
          v_observaciones_actualizadas := v_observaciones_actualizadas + 1;
        END IF;
      ELSIF v_observacion_numero IS NOT NULL THEN
        -- Fallback: actualizar por número de observación
        UPDATE auditoria_observaciones
        SET
          numero_informe = v_informe.encabezado,
          fecha_emision_informe = v_informe.fecha_elaboracion::DATE,
          fecha_envio_informe = COALESCE(
            v_informe.fecha_socializacion::DATE,
            v_informe.fecha_aprobacion::DATE
          ),
          estrategia = COALESCE(
            (v_observacion->>'estrategia')::TEXT,
            v_informe.estrategia
          ),
          entregable = COALESCE(
            (v_observacion->>'entregable')::TEXT,
            v_informe.entregable
          ),
          fecha_inicio = v_informe.fecha_inicio_implementacion,
          fecha_fin = v_informe.fecha_fin_implementacion,
          plazo_dias_laborables = calcular_dias_laborables(
            v_informe.fecha_inicio_implementacion,
            v_informe.fecha_fin_implementacion
          ),
          responsable_estrategia = COALESCE(
            (v_observacion->>'responsable_id')::UUID,
            (v_observacion->>'responsable_estrategia')::UUID
          ),
          responsable_implementacion = COALESCE(
            (v_observacion->>'responsable_implementacion')::UUID,
            (v_observacion->>'responsable_id')::UUID
          ),
          updated_at = NOW()
        WHERE auditoria_id = v_informe.auditoria_id
          AND numero_observacion = v_observacion_numero;
        
        IF FOUND THEN
          v_observaciones_actualizadas := v_observaciones_actualizadas + 1;
        END IF;
      END IF;
    END LOOP;
    
    -- Log de actualización (opcional, para debugging)
    RAISE NOTICE 'Matriz actualizada: % observaciones actualizadas para informe %', 
      v_observaciones_actualizadas, NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Se ejecuta cuando se actualiza un informe
DROP TRIGGER IF EXISTS trigger_actualizar_matriz_informe ON public.auditoria_informe;
CREATE TRIGGER trigger_actualizar_matriz_informe
  AFTER UPDATE ON public.auditoria_informe
  FOR EACH ROW
  EXECUTE FUNCTION trigger_actualizar_matriz_desde_informe();

-- ============================================
-- FLUJO 2: ACTUALIZAR ESTADO DE OBSERVACIONES SEGÚN FECHAS
-- ============================================

-- Función: Actualizar estado de observación según fechas
CREATE OR REPLACE FUNCTION trigger_actualizar_estado_observacion()
RETURNS TRIGGER AS $$
DECLARE
  v_hoy DATE := CURRENT_DATE;
  v_estado_nuevo TEXT;
BEGIN
  -- Solo actualizar si tiene fecha_fin
  IF NEW.fecha_fin IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Determinar estado según fechas
  IF NEW.fecha_real_implementacion IS NOT NULL THEN
    -- Ya se implementó
    v_estado_nuevo := 'CUMPLIDA';
  ELSIF NEW.nueva_fecha_implementacion IS NOT NULL THEN
    -- Fue reprogramada
    IF NEW.nueva_fecha_implementacion < v_hoy THEN
      v_estado_nuevo := 'VENCIDA';
    ELSE
      v_estado_nuevo := 'REPROGRAMADA';
    END IF;
  ELSIF NEW.fecha_fin < v_hoy THEN
    -- Fecha pasó y no se cumplió
    v_estado_nuevo := 'VENCIDA';
  ELSIF NEW.fecha_fin >= v_hoy THEN
    -- Aún está en plazo
    IF NEW.estado_observacion = 'NO_INICIADA' THEN
      v_estado_nuevo := 'EN_PROCESO';
    ELSE
      v_estado_nuevo := COALESCE(NEW.estado_observacion, 'EN_PROCESO');
    END IF;
  END IF;
  
  -- Actualizar estado si cambió
  IF v_estado_nuevo IS NOT NULL AND 
     (NEW.estado_observacion IS NULL OR NEW.estado_observacion != v_estado_nuevo) THEN
    NEW.estado_observacion := v_estado_nuevo;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Se ejecuta cuando se actualiza una observación
DROP TRIGGER IF EXISTS trigger_actualizar_estado_obs ON public.auditoria_observaciones;
CREATE TRIGGER trigger_actualizar_estado_obs
  BEFORE INSERT OR UPDATE ON public.auditoria_observaciones
  FOR EACH ROW
  EXECUTE FUNCTION trigger_actualizar_estado_observacion();

-- ============================================
-- FLUJO 3: ACTUALIZAR ACTIVIDAD CUANDO AUDITORÍA SE CIERRA
-- ============================================

-- Función: Marcar actividad como cumplida cuando auditoría se cierra
CREATE OR REPLACE FUNCTION trigger_marcar_actividad_cumplida()
RETURNS TRIGGER AS $$
BEGIN
  -- Cuando una auditoría se cierra, marcar su actividad asociada como cumplida
  IF NEW.estado = 'CERRADA' AND (OLD.estado IS NULL OR OLD.estado != 'CERRADA') THEN
    -- Actualizar actividad relacionada (si existe)
    UPDATE audit_activities
    SET 
      validation_status = 'CUMPLIDA',
      end_date = COALESCE(NEW.fecha_cierre::DATE, CURRENT_DATE)
    WHERE id IN (
      SELECT activity_id 
      FROM auditorias 
      WHERE id = NEW.id AND activity_id IS NOT NULL
    );
    
    RAISE NOTICE 'Actividad marcada como cumplida para auditoría %', NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Se ejecuta cuando se actualiza una auditoría
DROP TRIGGER IF EXISTS trigger_marcar_actividad_cumplida_aud ON public.auditorias;
CREATE TRIGGER trigger_marcar_actividad_cumplida_aud
  AFTER UPDATE ON public.auditorias
  FOR EACH ROW
  EXECUTE FUNCTION trigger_marcar_actividad_cumplida();

-- ============================================
-- FLUJO 4: CREAR SOLICITUD DE DOCUMENTACIÓN AUTOMÁTICA
-- ============================================

-- Función: Crear solicitud de documentación cuando se notifica a auditado
CREATE OR REPLACE FUNCTION trigger_crear_solicitud_documentacion()
RETURNS TRIGGER AS $$
DECLARE
  v_auditoria RECORD;
  v_fecha_limite DATE;
BEGIN
  -- Solo crear solicitud cuando se notifica por primera vez
  IF NEW.estado_participacion = 'NOTIFICADO' AND 
     (OLD.estado_participacion IS NULL OR OLD.estado_participacion != 'NOTIFICADO') THEN
    
    -- Obtener datos de la auditoría
    SELECT * INTO v_auditoria
    FROM auditorias
    WHERE id = NEW.auditoria_id;
    
    -- Calcular fecha límite (8 días hábiles desde hoy)
    v_fecha_limite := calcular_dias_laborables(CURRENT_DATE, CURRENT_DATE + INTERVAL '10 days');
    
    -- Crear solicitud de documentación
    INSERT INTO solicitudes_documentacion (
      auditoria_id,
      solicitado_a_id,
      tipo_documento,
      descripcion,
      fecha_limite,
      estado,
      solicitado_por,
      creada_at
    ) VALUES (
      NEW.auditoria_id,
      NEW.user_id,
      'DOCUMENTACION_GENERAL',
      'Documentación relacionada a las áreas auditadas según el programa de auditoría',
      v_fecha_limite,
      'PENDIENTE',
      v_auditoria.auditor_responsable_id,
      NOW()
    );
    
    RAISE NOTICE 'Solicitud de documentación creada para auditado % en auditoría %', 
      NEW.user_id, NEW.auditoria_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Se ejecuta cuando se actualiza un participante
DROP TRIGGER IF EXISTS trigger_crear_solicitud_doc ON public.auditoria_participantes;
CREATE TRIGGER trigger_crear_solicitud_doc
  AFTER UPDATE ON public.auditoria_participantes
  FOR EACH ROW
  EXECUTE FUNCTION trigger_crear_solicitud_documentacion();

-- ============================================
-- FLUJO 5: ACTUALIZAR PORCENTAJE DE AVANCE AUTOMÁTICAMENTE
-- ============================================

-- Función: Calcular porcentaje de avance basado en evidencias
CREATE OR REPLACE FUNCTION trigger_calcular_porcentaje_avance()
RETURNS TRIGGER AS $$
DECLARE
  v_total_evidencias INTEGER;
  v_evidencias_aprobadas INTEGER;
  v_porcentaje INTEGER;
BEGIN
  -- Si se inserta o actualiza una evidencia, recalcular porcentaje
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    -- Contar evidencias totales y aprobadas
    SELECT 
      COUNT(*),
      COUNT(*) FILTER (WHERE aprobada = true)
    INTO v_total_evidencias, v_evidencias_aprobadas
    FROM observacion_evidencias
    WHERE observacion_id = NEW.observacion_id;
    
    -- Calcular porcentaje (si hay evidencias)
    IF v_total_evidencias > 0 THEN
      v_porcentaje := ROUND((v_evidencias_aprobadas::NUMERIC / v_total_evidencias::NUMERIC) * 100);
      
      -- Actualizar porcentaje en la observación
      UPDATE auditoria_observaciones
      SET 
        porcentaje_avance = v_porcentaje,
        updated_at = NOW()
      WHERE id = NEW.observacion_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    -- Si se elimina una evidencia, recalcular
    SELECT 
      COUNT(*),
      COUNT(*) FILTER (WHERE aprobada = true)
    INTO v_total_evidencias, v_evidencias_aprobadas
    FROM observacion_evidencias
    WHERE observacion_id = OLD.observacion_id;
    
    IF v_total_evidencias > 0 THEN
      v_porcentaje := ROUND((v_evidencias_aprobadas::NUMERIC / v_total_evidencias::NUMERIC) * 100);
    ELSE
      v_porcentaje := 0;
    END IF;
    
    UPDATE auditoria_observaciones
    SET 
      porcentaje_avance = v_porcentaje,
      updated_at = NOW()
    WHERE id = OLD.observacion_id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger: Se ejecuta cuando se modifica una evidencia
DROP TRIGGER IF EXISTS trigger_calcular_avance_evidencia ON public.observacion_evidencias;
CREATE TRIGGER trigger_calcular_avance_evidencia
  AFTER INSERT OR UPDATE OR DELETE ON public.observacion_evidencias
  FOR EACH ROW
  EXECUTE FUNCTION trigger_calcular_porcentaje_avance();

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ Triggers de producción creados exitosamente';
  RAISE NOTICE '';
  RAISE NOTICE 'Triggers creados:';
  RAISE NOTICE '  1. trigger_actualizar_matriz_informe - Actualiza matriz cuando informe se completa';
  RAISE NOTICE '  2. trigger_actualizar_estado_obs - Actualiza estado según fechas';
  RAISE NOTICE '  3. trigger_marcar_actividad_cumplida_aud - Marca actividad como cumplida';
  RAISE NOTICE '  4. trigger_crear_solicitud_doc - Crea solicitud de documentación automática';
  RAISE NOTICE '  5. trigger_calcular_avance_evidencia - Calcula porcentaje de avance';
  RAISE NOTICE '';
END $$;

