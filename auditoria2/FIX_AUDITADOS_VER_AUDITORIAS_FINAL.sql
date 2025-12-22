-- ========================================
-- SOLUCIÓN FINAL: AUDITADOS VEN SUS AUDITORÍAS
-- ========================================
-- El problema: La política de auditorias es demasiado restrictiva
-- Cuando el frontend hace JOIN desde auditoria_participantes,
-- PostgreSQL verifica la política de auditorias y la rechaza

-- SOLUCIÓN: Permitir que auditados vean auditorias donde son participantes
-- pero usando una función SECURITY DEFINER para evitar recursión

-- ========================================
-- PASO 1: Crear función helper para verificar participación
-- ========================================
-- Esta función evita la recursión porque es SECURITY DEFINER
-- y hace la consulta directamente sin pasar por RLS

CREATE OR REPLACE FUNCTION public.is_user_participant_in_auditoria(
  p_auditoria_id uuid,
  p_user_id uuid
)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.auditoria_participantes
    WHERE auditoria_id = p_auditoria_id
    AND user_id = p_user_id
  );
$$;

-- ========================================
-- PASO 2: Actualizar política de auditorias
-- ========================================

-- Eliminar política anterior
DROP POLICY IF EXISTS "auditorias_select_final" ON public.auditorias;

-- Crear nueva política que permite a participantes ver auditorías
CREATE POLICY "auditorias_select_final"
ON public.auditorias
FOR SELECT
TO authenticated
USING (
  -- Auditor responsable
  auditor_responsable_id = auth.uid()
  OR
  -- Auditor interno
  public.get_current_user_role() = 'auditor_interno'
  OR
  -- 🔥 NUEVO: Usuario es participante (usando función para evitar recursión)
  public.is_user_participant_in_auditoria(id, auth.uid())
);

-- ========================================
-- PASO 3: Verificar que funciona
-- ========================================

-- Ver políticas actuales
SELECT 
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'auditorias'
ORDER BY cmd, policyname;

-- Probar la función
SELECT 
  id,
  estado,
  public.is_user_participant_in_auditoria(id, auth.uid()) as es_participante
FROM public.auditorias
LIMIT 5;

-- ✅ SOLUCIÓN:
-- 1. La función is_user_participant_in_auditoria es SECURITY DEFINER
--    por lo que NO pasa por RLS y evita recursión
-- 2. La política de auditorias ahora permite acceso si:
--    - Eres el auditor responsable
--    - Eres auditor_interno
--    - Eres participante (usando la función)
-- 3. Cuando el frontend hace JOIN, PostgreSQL verifica la política
--    y permite acceso porque la función detecta que eres participante
-- 4. NO HAY RECURSIÓN porque la función es SECURITY DEFINER

