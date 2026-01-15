-- ============================================
-- SCRIPT DE LIMPIEZA - DATOS DE DAVIDE
-- ============================================
-- Este script elimina TODOS los registros relacionados
-- con las actividades asignadas al usuario Davide
-- ============================================

DO $$
DECLARE
  v_davide_id UUID;
  v_activities_count INTEGER;
  v_auditorias_count INTEGER;
BEGIN
  -- PASO 1: Encontrar el ID del usuario Davide
  SELECT id INTO v_davide_id
  FROM users
  WHERE LOWER(full_name) LIKE '%davide%' 
     OR LOWER(email) LIKE '%davide%'
  LIMIT 1;

  IF v_davide_id IS NULL THEN
    RAISE EXCEPTION 'No se encontró el usuario Davide';
  END IF;

  RAISE NOTICE '✅ Usuario Davide encontrado: %', v_davide_id;

  -- PASO 2: Contar actividades asignadas a Davide
  SELECT COUNT(*) INTO v_activities_count
  FROM audit_activities
  WHERE auditor_id = v_davide_id;

  RAISE NOTICE '📊 Actividades encontradas asignadas a Davide: %', v_activities_count;

  -- PASO 3: Identificar auditorías relacionadas
  SELECT COUNT(*) INTO v_auditorias_count
  FROM auditorias
  WHERE activity_id IN (
    SELECT id FROM audit_activities WHERE auditor_id = v_davide_id
  );

  RAISE NOTICE '📊 Auditorías relacionadas encontradas: %', v_auditorias_count;

  -- PASO 4: Eliminar comunicaciones relacionadas
  DELETE FROM comunicaciones_auditado
  WHERE auditoria_id IN (
    SELECT id FROM auditorias 
    WHERE activity_id IN (
      SELECT id FROM audit_activities WHERE auditor_id = v_davide_id
    )
  );
  RAISE NOTICE '✅ Comunicaciones eliminadas';

  -- PASO 5: Eliminar solicitudes de documentación relacionadas
  DELETE FROM solicitudes_documentacion
  WHERE auditoria_id IN (
    SELECT id FROM auditorias 
    WHERE activity_id IN (
      SELECT id FROM audit_activities WHERE auditor_id = v_davide_id
    )
  );
  RAISE NOTICE '✅ Solicitudes de documentación eliminadas';

  -- PASO 6: Eliminar evidencias de observaciones
  DELETE FROM observacion_evidencias
  WHERE observacion_id IN (
    SELECT id FROM auditoria_observaciones
    WHERE auditoria_id IN (
      SELECT id FROM auditorias 
      WHERE activity_id IN (
        SELECT id FROM audit_activities WHERE auditor_id = v_davide_id
      )
    )
  );
  RAISE NOTICE '✅ Evidencias eliminadas';

  -- PASO 7: Eliminar avances de observaciones
  DELETE FROM observacion_avances
  WHERE observacion_id IN (
    SELECT id FROM auditoria_observaciones
    WHERE auditoria_id IN (
      SELECT id FROM auditorias 
      WHERE activity_id IN (
        SELECT id FROM audit_activities WHERE auditor_id = v_davide_id
      )
    )
  );
  RAISE NOTICE '✅ Avances eliminados';

  -- PASO 8: Eliminar observaciones
  DELETE FROM auditoria_observaciones
  WHERE auditoria_id IN (
    SELECT id FROM auditorias 
    WHERE activity_id IN (
      SELECT id FROM audit_activities WHERE auditor_id = v_davide_id
    )
  );
  RAISE NOTICE '✅ Observaciones eliminadas';

  -- PASO 9: Eliminar firmas de informes
  DELETE FROM informe_firmas
  WHERE informe_id IN (
    SELECT id FROM auditoria_informe
    WHERE auditoria_id IN (
      SELECT id FROM auditorias 
      WHERE activity_id IN (
        SELECT id FROM audit_activities WHERE auditor_id = v_davide_id
      )
    )
  );
  RAISE NOTICE '✅ Firmas de informes eliminadas';

  -- PASO 10: Eliminar informes
  DELETE FROM auditoria_informe
  WHERE auditoria_id IN (
    SELECT id FROM auditorias 
    WHERE activity_id IN (
      SELECT id FROM audit_activities WHERE auditor_id = v_davide_id
    )
  );
  RAISE NOTICE '✅ Informes eliminados';

  -- PASO 11: Eliminar participantes
  DELETE FROM auditoria_participantes
  WHERE auditoria_id IN (
    SELECT id FROM auditorias 
    WHERE activity_id IN (
      SELECT id FROM audit_activities WHERE auditor_id = v_davide_id
    )
  );
  RAISE NOTICE '✅ Participantes eliminados';

  -- PASO 12: Eliminar preparaciones
  DELETE FROM auditoria_preparacion
  WHERE auditoria_id IN (
    SELECT id FROM auditorias 
    WHERE activity_id IN (
      SELECT id FROM audit_activities WHERE auditor_id = v_davide_id
    )
  );
  RAISE NOTICE '✅ Preparaciones eliminadas';

  -- PASO 13: Eliminar auditorías
  DELETE FROM auditorias
  WHERE activity_id IN (
    SELECT id FROM audit_activities WHERE auditor_id = v_davide_id
  );
  RAISE NOTICE '✅ Auditorías eliminadas';

  -- PASO 14: Eliminar asignaciones de actividades (establecer auditor_id a NULL)
  UPDATE audit_activities
  SET auditor_id = NULL,
      auditor_assigned_at = NULL
  WHERE auditor_id = v_davide_id;
  RAISE NOTICE '✅ Asignaciones de actividades eliminadas (auditor_id = NULL)';

  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════';
  RAISE NOTICE '✅ LIMPIEZA COMPLETADA EXITOSAMENTE';
  RAISE NOTICE '═══════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE 'Resumen:';
  RAISE NOTICE '  - Usuario: Davide (%)', v_davide_id;
  RAISE NOTICE '  - Actividades procesadas: %', v_activities_count;
  RAISE NOTICE '  - Auditorías eliminadas: %', v_auditorias_count;
  RAISE NOTICE '';
  RAISE NOTICE 'El sistema está listo para reiniciar el proceso.';
  RAISE NOTICE '═══════════════════════════════════════════════';

EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error durante la limpieza: %', SQLERRM;
END $$;
