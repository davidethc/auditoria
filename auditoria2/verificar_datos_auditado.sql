-- ========================================
-- VERIFICAR DATOS PARA EL AUDITADO
-- ========================================
-- Este script verifica si hay datos y por qué no se muestran

-- 1. Ver el usuario actual
SELECT 
  id,
  email,
  full_name,
  role,
  created_at
FROM public.users
WHERE id = auth.uid();

-- 2. Ver TODAS las auditorías (sin filtros RLS)
-- Esto requiere permisos especiales, pero intentemos
SELECT 
  COUNT(*) as total_auditorias
FROM public.auditorias;

-- 3. Ver TODOS los participantes (sin filtros RLS)
SELECT 
  COUNT(*) as total_participantes
FROM public.auditoria_participantes;

-- 4. Ver participantes del usuario actual (esto debería funcionar con RLS)
SELECT 
  ap.id,
  ap.auditoria_id,
  ap.user_id,
  ap.rol_en_auditoria,
  ap.estado_participacion,
  a.estado as estado_auditoria,
  a.auditor_responsable_id
FROM public.auditoria_participantes ap
LEFT JOIN public.auditorias a ON a.id = ap.auditoria_id
WHERE ap.user_id = auth.uid();

-- 5. Ver TODOS los participantes con sus usuarios (para verificar datos)
SELECT 
  ap.id,
  ap.auditoria_id,
  ap.user_id,
  ap.rol_en_auditoria,
  ap.estado_participacion,
  u.email as participante_email,
  u.full_name as participante_nombre,
  u.role as participante_rol,
  a.estado as estado_auditoria,
  a.auditor_responsable_id
FROM public.auditoria_participantes ap
LEFT JOIN public.users u ON u.id = ap.user_id
LEFT JOIN public.auditorias a ON a.id = ap.auditoria_id
ORDER BY ap.auditoria_id;

-- 6. Verificar políticas actuales de auditoria_participantes
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'auditoria_participantes'
ORDER BY cmd, policyname;

-- 7. Verificar políticas actuales de auditorias
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'auditorias'
ORDER BY cmd, policyname;

-- 8. Probar la query exacta que usa el frontend (simplificada)
-- Primero solo participantes
SELECT 
  ap.id,
  ap.rol_en_auditoria,
  ap.estado_participacion,
  ap.auditoria_id
FROM public.auditoria_participantes ap
WHERE ap.user_id = auth.uid();

-- 9. Si hay participantes, probar el JOIN con auditorias
SELECT 
  ap.id,
  ap.rol_en_auditoria,
  ap.estado_participacion,
  a.id as auditoria_id,
  a.estado,
  a.fecha_inicio,
  a.fecha_fin
FROM public.auditoria_participantes ap
INNER JOIN public.auditorias a ON a.id = ap.auditoria_id
WHERE ap.user_id = auth.uid();

-- 10. Verificar si hay actividades relacionadas
SELECT 
  ap.id,
  a.id as auditoria_id,
  a.activity_id,
  aa.activity_description
FROM public.auditoria_participantes ap
INNER JOIN public.auditorias a ON a.id = ap.auditoria_id
LEFT JOIN public.audit_activities aa ON aa.id = a.activity_id
WHERE ap.user_id = auth.uid();

