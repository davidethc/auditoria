-- ========================================
-- SCRIPT DE VERIFICACIÓN Y DIAGNÓSTICO
-- ========================================

-- 1. Verificar que las tablas existen
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns 
   WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_name IN (
    'audit_activities',
    'audit_plans',
    'users',
    'auditorias',
    'auditoria_preparacion',
    'auditoria_participantes',
    'comunicaciones_auditado'
  )
ORDER BY table_name;

-- 2. Verificar columnas de la tabla auditorias
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'auditorias'
ORDER BY ordinal_position;

-- 3. Verificar que RLS está habilitado
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('auditorias', 'auditoria_preparacion', 'auditoria_participantes', 'comunicaciones_auditado');

-- 4. Verificar políticas RLS
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  permissive,
  roles
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'auditorias'
ORDER BY policyname;

-- 5. Verificar que existe la función helper
SELECT 
  routine_name,
  routine_type,
  data_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'get_current_user_role';

-- 6. Probar la función helper (si falla, es el problema)
SELECT public.get_current_user_role() as mi_rol;

-- 7. Verificar triggers
SELECT 
  trigger_name,
  event_object_table,
  action_timing,
  event_manipulation
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND event_object_table = 'auditorias'
ORDER BY trigger_name;

