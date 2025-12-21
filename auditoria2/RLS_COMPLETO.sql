-- ========================================
-- SCRIPT RLS COMPLETO PARA VALIDACIÓN
-- ========================================

-- 1. Asegurar que existe la función helper
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT role FROM public.users WHERE id = auth.uid() LIMIT 1;
$$;

-- 2. Habilitar RLS (por si acaso)
ALTER TABLE public.audit_activities ENABLE ROW LEVEL SECURITY;

-- 3. Eliminar TODAS las políticas de UPDATE existentes
DROP POLICY IF EXISTS "Solo auditor interno puede asignar actividades" ON public.audit_activities;
DROP POLICY IF EXISTS "Auditor interno y auditor actualizan actividades" ON public.audit_activities;
DROP POLICY IF EXISTS "Solo auditor interno puede asignar responsable" ON public.audit_activities;
DROP POLICY IF EXISTS "Auditor puede validar sus actividades" ON public.audit_activities;
DROP POLICY IF EXISTS "Auditor interno puede gestionar actividades" ON public.audit_activities;
DROP POLICY IF EXISTS "Enable read for authenticated users" ON public.audit_activities;
DROP POLICY IF EXISTS "Usuarios ven solo sus actividades asignadas" ON public.audit_activities;

-- 4. POLÍTICA DE LECTURA (SELECT)
CREATE POLICY "Usuarios ven solo sus actividades asignadas"
ON public.audit_activities
FOR SELECT
TO authenticated
USING (
  -- Auditor interno ve TODAS
  public.get_current_user_role() = 'auditor_interno'
  OR
  -- Auditor/Auditado solo ven donde auditor_id = su ID
  auditor_id = auth.uid()
);

-- 5. POLÍTICA DE ACTUALIZACIÓN (UPDATE)
-- IMPORTANTE: Necesitamos DOS políticas separadas para UPDATE

-- 5a. Auditor_interno puede actualizar TODO
CREATE POLICY "Auditor interno puede gestionar actividades"
ON public.audit_activities
FOR UPDATE
TO authenticated
USING (
  public.get_current_user_role() = 'auditor_interno'
)
WITH CHECK (
  public.get_current_user_role() = 'auditor_interno'
);

-- 5b. Auditor puede actualizar validation_status de sus actividades
CREATE POLICY "Auditor puede validar sus actividades"
ON public.audit_activities
FOR UPDATE
TO authenticated
USING (
  -- Solo puede actualizar si es auditor y la actividad está asignada a él
  public.get_current_user_role() = 'auditor'
  AND auditor_id = auth.uid()
)
WITH CHECK (
  -- Verificar que sigue siendo auditor y la actividad sigue asignada a él
  public.get_current_user_role() = 'auditor'
  AND auditor_id = auth.uid()
);

-- 6. POLÍTICA DE INSERCIÓN (INSERT)
CREATE POLICY "Auditor interno puede crear actividades"
ON public.audit_activities
FOR INSERT
TO authenticated
WITH CHECK (
  public.get_current_user_role() = 'auditor_interno'
);

-- 7. POLÍTICA DE ELIMINACIÓN (DELETE)
CREATE POLICY "Auditor interno puede eliminar actividades"
ON public.audit_activities
FOR DELETE
TO authenticated
USING (
  public.get_current_user_role() = 'auditor_interno'
);

-- ✅ VERIFICAR
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'audit_activities'
ORDER BY cmd, policyname;

-- Deberías ver:
-- 1. "Usuarios ven solo sus actividades asignadas" (SELECT)
-- 2. "Auditor interno puede gestionar actividades" (UPDATE)
-- 3. "Auditor puede validar sus actividades" (UPDATE)
-- 4. "Auditor interno puede crear actividades" (INSERT)
-- 5. "Auditor interno puede eliminar actividades" (DELETE)

