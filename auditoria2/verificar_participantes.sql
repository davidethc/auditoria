-- ========================================
-- VERIFICAR PARTICIPANTES EN AUDITORÍAS
-- ========================================

-- 1. Ver TODAS las auditorías
SELECT 
  id,
  estado,
  auditor_responsable_id,
  creada_at
FROM public.auditorias
ORDER BY creada_at DESC;

-- 2. Ver TODOS los participantes (sin filtros)
SELECT 
  ap.id,
  ap.auditoria_id,
  ap.user_id,
  ap.rol_en_auditoria,
  ap.estado_participacion,
  u.email as participante_email,
  u.full_name as participante_nombre,
  u.role as participante_rol,
  a.estado as estado_auditoria
FROM public.auditoria_participantes ap
LEFT JOIN public.users u ON u.id = ap.user_id
LEFT JOIN public.auditorias a ON a.id = ap.auditoria_id
ORDER BY ap.auditoria_id;

-- 3. Ver el usuario actual
SELECT 
  id,
  email,
  full_name,
  role
FROM public.users
WHERE id = auth.uid();

-- 4. Verificar si el usuario actual es participante de alguna auditoría
SELECT 
  ap.id,
  ap.auditoria_id,
  ap.rol_en_auditoria,
  ap.estado_participacion,
  a.estado as estado_auditoria,
  a.auditor_responsable_id
FROM public.auditoria_participantes ap
INNER JOIN public.auditorias a ON a.id = ap.auditoria_id
WHERE ap.user_id = auth.uid();

-- 5. Probar la función con el usuario actual
SELECT 
  a.id,
  a.estado,
  public.is_user_participant_in_auditoria(a.id, auth.uid()) as es_participante
FROM public.auditorias a
ORDER BY a.creada_at DESC;

-- 6. Verificar si hay participantes para las auditorías específicas
-- (Reemplaza los IDs con los que aparecen en tus resultados)
SELECT 
  a.id as auditoria_id,
  a.estado,
  COUNT(ap.id) as total_participantes,
  STRING_AGG(u.email, ', ') as participantes_emails
FROM public.auditorias a
LEFT JOIN public.auditoria_participantes ap ON ap.auditoria_id = a.id
LEFT JOIN public.users u ON u.id = ap.user_id
WHERE a.id IN (
  '23c5fele-0760-4eb8-8d31-a9e9f3f3907',
  '55de33b1-e4ad-45dc-a315-60987eaeaded',
  '0de59665-96af-4507-a06b-caaba74424f7'
)
GROUP BY a.id, a.estado;

-- 7. Ver usuarios con rol 'auditado'
SELECT 
  id,
  email,
  full_name,
  role
FROM public.users
WHERE role = 'auditado'
ORDER BY full_name;

