-- ========================================
-- ASIGNAR PARTICIPANTE A UNA AUDITORÍA
-- ========================================
-- Este script te ayuda a asignar un auditado como participante
-- de una auditoría existente

-- PASO 1: Ver auditorías disponibles
SELECT 
  id,
  estado,
  auditor_responsable_id,
  creada_at
FROM public.auditorias
ORDER BY creada_at DESC;

-- PASO 2: Ver usuarios auditados disponibles
SELECT 
  id,
  email,
  full_name,
  role
FROM public.users
WHERE role = 'auditado'
ORDER BY full_name;

-- PASO 3: ASIGNAR PARTICIPANTE
-- 🔴 REEMPLAZA ESTOS VALORES:
-- - p_auditoria_id: ID de la auditoría (de la query anterior)
-- - p_user_id: ID del usuario auditado (de la query anterior)

DO $$
DECLARE
  v_auditoria_id uuid := '0de59665-96af-4507-a06b-caaba74424f7';  -- 🔴 CAMBIAR
  v_auditado_id uuid := '426a01c4-593e-4727-98ff-4fce99c8a504';  -- 🔴 CAMBIAR (tu usuario actual)
  v_auditor_id uuid;
BEGIN
  -- Verificar que la auditoría existe
  SELECT auditor_responsable_id INTO v_auditor_id
  FROM public.auditorias
  WHERE id = v_auditoria_id;
  
  IF v_auditor_id IS NULL THEN
    RAISE EXCEPTION 'La auditoría no existe';
  END IF;
  
  -- Verificar que el usuario existe y es auditado
  IF NOT EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = v_auditado_id 
    AND role = 'auditado'
  ) THEN
    RAISE EXCEPTION 'El usuario no existe o no es auditado';
  END IF;
  
  -- Verificar que no esté ya asignado
  IF EXISTS (
    SELECT 1 FROM public.auditoria_participantes
    WHERE auditoria_id = v_auditoria_id
    AND user_id = v_auditado_id
  ) THEN
    RAISE NOTICE 'El usuario ya es participante de esta auditoría';
    RETURN;
  END IF;
  
  -- Asignar como participante
  INSERT INTO public.auditoria_participantes (
    auditoria_id,
    user_id,
    rol_en_auditoria,
    estado_participacion,
    fecha_notificacion
  ) VALUES (
    v_auditoria_id,
    v_auditado_id,
    'AUDITADO',
    'NOTIFICADO',
    NOW()
  );
  
  RAISE NOTICE '✅ Participante asignado exitosamente';
  RAISE NOTICE 'Auditoría ID: %', v_auditoria_id;
  RAISE NOTICE 'Usuario ID: %', v_auditado_id;
  
END $$;

-- PASO 4: Verificar la asignación
SELECT 
  ap.id,
  ap.auditoria_id,
  ap.user_id,
  ap.rol_en_auditoria,
  ap.estado_participacion,
  u.email as participante_email,
  a.estado as estado_auditoria
FROM public.auditoria_participantes ap
INNER JOIN public.users u ON u.id = ap.user_id
INNER JOIN public.auditorias a ON a.id = ap.auditoria_id
WHERE ap.user_id = auth.uid()
ORDER BY ap.auditoria_id;

-- PASO 5: Probar la función nuevamente
SELECT 
  a.id,
  a.estado,
  public.is_user_participant_in_auditoria(a.id, auth.uid()) as es_participante
FROM public.auditorias a
WHERE a.id = '0de59665-96af-4507-a06b-caaba74424f7';  -- 🔴 CAMBIAR al ID de tu auditoría

