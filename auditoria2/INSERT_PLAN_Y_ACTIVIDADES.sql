-- ============================================
-- SCRIPT DE INSERCIÓN: PLAN Y ACTIVIDADES 2025
-- ============================================
-- Este script crea:
-- 1. Un plan de trabajo para el año 2025
-- 2. 7 actividades de auditoría asociadas al plan
-- 
-- ⚠️ IMPORTANTE: Asegúrate de estar autenticado o tener usuarios en la tabla users
-- ============================================

DO $$
DECLARE
  v_plan_id UUID;
  v_user_id UUID;
BEGIN
  -- ============================================
  -- OBTENER USUARIO PARA created_by
  -- ============================================
  -- Intenta obtener el usuario autenticado primero
  SELECT auth.uid() INTO v_user_id;
  
  -- Si no hay usuario autenticado, busca un auditor_interno
  IF v_user_id IS NULL THEN
    SELECT id INTO v_user_id
    FROM public.users
    WHERE role = 'auditor_interno'
    LIMIT 1;
  END IF;
  
  -- Si aún no hay usuario, busca cualquier usuario
  IF v_user_id IS NULL THEN
    SELECT id INTO v_user_id
    FROM public.users
    LIMIT 1;
  END IF;
  
  -- Si no hay usuarios en la tabla, mostrar error
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'No se encontró ningún usuario. Por favor, crea al menos un usuario en la tabla users antes de ejecutar este script.';
  END IF;
  
  RAISE NOTICE 'Usando usuario ID: %', v_user_id;
  
  -- ============================================
  -- CREAR O OBTENER EL PLAN DE TRABAJO
  -- ============================================
  -- Obtener el plan si ya existe
  SELECT id INTO v_plan_id
  FROM public.audit_plans
  WHERE year = 2025 AND plan_type = 'PLAN DE TRABAJO INTERNO'
  LIMIT 1;
  
  -- Si no existe, crearlo
  IF v_plan_id IS NULL THEN
    INSERT INTO public.audit_plans (
      year,
      plan_type,
      description,
      created_by
    ) VALUES (
      2025,
      'PLAN DE TRABAJO INTERNO',
      'Plan de Trabajo Interno 2025 - Actividades de cumplimiento normativo, priorizadas SEPS y auditoría informática',
      v_user_id
    )
    RETURNING id INTO v_plan_id;
    
    RAISE NOTICE '✅ Plan de trabajo creado con ID: %', v_plan_id;
  ELSE
    RAISE NOTICE '✅ Plan de trabajo ya existe con ID: %', v_plan_id;
  END IF;
  
  -- ============================================
  -- PARTE 2: CREAR LAS ACTIVIDADES
  -- ============================================
  
  -- Actividad 1
  INSERT INTO public.audit_activities (
    plan_id,
    activity_number,
    year,
    activity_type,
    regulation_code,
    regulation_name,
    regulation_date,
    activity_description,
    priority,
    subcomponent,
    component,
    deliverable_type,
    deliverable,
    periodicity,
    periods_number,
    additional_parameter,
    review_time,
    cutoff_date,
    start_date,
    end_date,
    applies,
    validation_status,
    auditor_id
  ) VALUES (
    v_plan_id,
    1,
    2025,
    'ACTIVIDADES DE CUMPLIMIENTO NORMATIVO',
    'SEPS-IGT-IGS-INSESF-INR-INGINT-INSEPS-IGJ-0116',
    'Norma de control para la Administración del Riesgo Operativo en las entidades del Sector Financiero Popular y Solidario',
    '2024-07-02',
    'Evaluar el cumplimiento de la Norma de control para la Administración de Riesgo Operativo en las entidades del Sector Financiero Popular y Solidario',
    'RIESGO OPERATIVO',
    'EVALUACIÓN DE RIESGO',
    'EXAMEN',
    'EXAMEN',
    'EXAMEN',
    'ANUAL',
    NULL,
    '22',
    20,
    '2025-01-02',
    '2025-02-03',
    '2025-02-28',
    TRUE,
    'CUMPLIDO',
    NULL
  );

  -- Actividad 2
  INSERT INTO public.audit_activities (
    plan_id,
    activity_number,
    year,
    activity_type,
    regulation_code,
    regulation_name,
    regulation_date,
    activity_description,
    priority,
    subcomponent,
    component,
    deliverable_type,
    deliverable,
    periodicity,
    periods_number,
    additional_parameter,
    review_time,
    cutoff_date,
    start_date,
    end_date,
    applies,
    validation_status,
    auditor_id
  ) VALUES (
    v_plan_id,
    2,
    2025,
    'ACTIVIDADES DE CUMPLIMIENTO NORMATIVO',
    'SEPS-IGT-IGS-INSESF-INR-INGINT-INSEPS-009',
    'Norma de control de seguridades en el uso de canales electrónicos para las entidades financieras controladas por la SEPS',
    '2023-04-14',
    'Verificar la efectividad de las medidas de seguridad en las transferencias electrónicas y recomendar medidas correctivas.',
    'RIESGO OPERATIVO',
    'EVALUACIÓN DE RIESGO',
    'EXAMEN',
    'EXAMEN',
    'EXAMEN',
    'ANUAL',
    NULL,
    '42',
    14,
    '2025-01-02',
    '2025-03-05',
    '2025-03-24',
    TRUE,
    'CUMPLIDO',
    NULL
  );

  -- Actividad 3
  INSERT INTO public.audit_activities (
    plan_id,
    activity_number,
    year,
    activity_type,
    regulation_code,
    regulation_name,
    regulation_date,
    activity_description,
    priority,
    subcomponent,
    component,
    deliverable_type,
    deliverable,
    periodicity,
    periods_number,
    additional_parameter,
    review_time,
    cutoff_date,
    start_date,
    end_date,
    applies,
    validation_status,
    auditor_id
  ) VALUES (
    v_plan_id,
    3,
    2025,
    'ACTIVIDADES PRIORIZADAS SEPS',
    NULL,
    NULL,
    NULL,
    'Verificar la definición, actualización e implementación de los planes de contingencia y continuidad del negocio para la mitigación de los posibles efectos por los cortes energéticos.',
    'RIESGO OPERATIVO',
    'EVALUACIÓN DE RIESGO',
    'EXAMEN',
    'EXAMEN',
    'Examen verificar la definición, actualización e implementación de los planes de contingencia y continuidad del negocio',
    'ANUAL',
    1,
    '25',
    20,
    '2025-04-30',
    '2025-06-06',
    '2025-07-03',
    TRUE,
    'CUMPLIDO',
    NULL
  );

  -- Actividad 4
  INSERT INTO public.audit_activities (
    plan_id,
    activity_number,
    year,
    activity_type,
    regulation_code,
    regulation_name,
    regulation_date,
    activity_description,
    priority,
    subcomponent,
    component,
    deliverable_type,
    deliverable,
    periodicity,
    periods_number,
    additional_parameter,
    review_time,
    cutoff_date,
    start_date,
    end_date,
    applies,
    validation_status,
    auditor_id
  ) VALUES (
    v_plan_id,
    4,
    2025,
    'ACTIVIDADES DE AUDITOR INFORMATICO',
    NULL,
    NULL,
    NULL,
    'Evaluar el cumplimiento de la norma vigente de control respecto a la seguridad de la información (SGSI).',
    'RIESGO OPERATIVO',
    'EVALUACIÓN DE RIESGO',
    'EXAMEN',
    'EXAMEN',
    'Examen evaluar el cumplimiento de la norma vigente de control respecto a la seguridad de la información (SGSI).',
    'ANUAL',
    1,
    '17',
    25,
    '2025-03-31',
    '2025-04-24',
    '2025-05-30',
    TRUE,
    'CUMPLIDO',
    NULL
  );

  -- Actividad 5
  INSERT INTO public.audit_activities (
    plan_id,
    activity_number,
    year,
    activity_type,
    regulation_code,
    regulation_name,
    regulation_date,
    activity_description,
    priority,
    subcomponent,
    component,
    deliverable_type,
    deliverable,
    periodicity,
    periods_number,
    additional_parameter,
    review_time,
    cutoff_date,
    start_date,
    end_date,
    applies,
    validation_status,
    auditor_id
  ) VALUES (
    v_plan_id,
    5,
    2025,
    'ACTIVIDADES DE AUDITOR INFORMATICO',
    NULL,
    NULL,
    NULL,
    'Evaluar políticas, procesos y procedimientos de la Gestión de las operaciones de TI.',
    'RIESGO OPERATIVO',
    'EVALUACIÓN DE RIESGO',
    'EXAMEN',
    'EXAMEN',
    'Examen evaluar políticas, procesos y procedimientos de la Gestión de las operaciones de TI.',
    'ANUAL',
    1,
    '20',
    25,
    '2025-05-31',
    '2025-06-27',
    '2025-07-31',
    TRUE,
    'PENDIENTE',
    NULL
  );

  -- Actividad 6
  INSERT INTO public.audit_activities (
    plan_id,
    activity_number,
    year,
    activity_type,
    regulation_code,
    regulation_name,
    regulation_date,
    activity_description,
    priority,
    subcomponent,
    component,
    deliverable_type,
    deliverable,
    periodicity,
    periods_number,
    additional_parameter,
    review_time,
    cutoff_date,
    start_date,
    end_date,
    applies,
    validation_status,
    auditor_id
  ) VALUES (
    v_plan_id,
    6,
    2025,
    'ACTIVIDADES DE AUDITOR INFORMATICO',
    NULL,
    NULL,
    NULL,
    'Verificar que existan controles de acceso lógico que aseguren que el acceso a sistemas, datos y programas está restringido a usuarios autorizados.',
    'RIESGO OPERATIVO',
    'EVALUACIÓN DE RIESGO',
    'EXAMEN',
    'EXAMEN',
    'Examen verificar que existan controles de acceso lógico.',
    'ANUAL',
    1,
    '18',
    25,
    '2025-07-31',
    '2025-08-27',
    '2025-09-30',
    TRUE,
    'CUMPLIDO',
    NULL
  );

  -- Actividad 7
  INSERT INTO public.audit_activities (
    plan_id,
    activity_number,
    year,
    activity_type,
    regulation_code,
    regulation_name,
    regulation_date,
    activity_description,
    priority,
    subcomponent,
    component,
    deliverable_type,
    deliverable,
    periodicity,
    periods_number,
    additional_parameter,
    review_time,
    cutoff_date,
    start_date,
    end_date,
    applies,
    validation_status,
    auditor_id
  ) VALUES (
    v_plan_id,
    7,
    2025,
    'ACTIVIDADES DE AUDITOR INFORMATICO',
    NULL,
    NULL,
    NULL,
    'Evaluar políticas, procesos y procedimientos para la administración de base de datos.',
    'RIESGO OPERATIVO',
    'EVALUACIÓN DE RIESGO',
    'EXAMEN',
    'EXAMEN',
    'Examen evaluar políticas, procesos y procedimientos para la administración de base de datos.',
    'ANUAL',
    1,
    '18',
    25,
    '2025-09-27',
    '2025-10-23',
    '2025-11-28',
    TRUE,
    'PENDIENTE',
    NULL
  );

  RAISE NOTICE '✅ Plan y actividades creados exitosamente';
  RAISE NOTICE 'Plan ID: %', v_plan_id;
  
END $$;

-- ============================================
-- VERIFICACIÓN
-- ============================================

-- Verificar que se creó el plan
SELECT 
  id,
  year,
  plan_type,
  description,
  created_at
FROM public.audit_plans
WHERE year = 2025 AND plan_type = 'PLAN DE TRABAJO INTERNO';

-- Verificar que se crearon las actividades
SELECT 
  activity_number,
  activity_type,
  activity_description,
  validation_status,
  start_date,
  end_date
FROM public.audit_activities
WHERE year = 2025
ORDER BY activity_number;

-- Contar actividades por tipo
SELECT 
  activity_type,
  COUNT(*) as total,
  COUNT(CASE WHEN validation_status = 'CUMPLIDO' THEN 1 END) as cumplidas,
  COUNT(CASE WHEN validation_status = 'PENDIENTE' THEN 1 END) as pendientes
FROM public.audit_activities
WHERE year = 2025
GROUP BY activity_type;

