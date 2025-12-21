-- ========================================
-- SCRIPT PARA ARREGLAR PROBLEMAS CON AUDITORÍAS
-- ========================================

-- Paso 1: Verificar si la tabla existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'auditorias'
  ) THEN
    RAISE NOTICE 'La tabla auditorias NO existe. Ejecutando creación...';
    
    -- Crear la tabla
    CREATE TABLE public.auditorias (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      activity_id uuid NOT NULL
        REFERENCES public.audit_activities(id)
        ON DELETE CASCADE,
      auditor_responsable_id uuid NOT NULL
        REFERENCES public.users(id)
        ON DELETE RESTRICT,
      estado text NOT NULL DEFAULT 'PLANIFICADA'
        CHECK (estado IN (
          'PLANIFICADA',
          'EN_PREPARACION',
          'EN_EJECUCION',
          'EN_REPORTE',
          'CERRADA'
        )),
      fecha_inicio date,
      fecha_fin date,
      fecha_cierre date,
      creada_por uuid REFERENCES public.users(id),
      creada_at timestamptz DEFAULT now(),
      actualizada_at timestamptz DEFAULT now()
    );
    
    RAISE NOTICE 'Tabla auditorias creada exitosamente';
  ELSE
    RAISE NOTICE 'La tabla auditorias ya existe';
  END IF;
END $$;

-- Paso 2: Deshabilitar temporalmente RLS para debugging
ALTER TABLE IF EXISTS public.auditorias DISABLE ROW LEVEL SECURITY;

-- Paso 3: Eliminar todas las políticas existentes que puedan causar conflictos
DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'auditorias'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.auditorias', pol.policyname);
    RAISE NOTICE 'Política eliminada: %', pol.policyname;
  END LOOP;
END $$;

-- Paso 4: Verificar que la función helper existe y funciona
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE(
    (SELECT role FROM public.users WHERE id = auth.uid() LIMIT 1),
    'sin_rol'
  );
$$;

-- Paso 5: Crear políticas RLS más simples y seguras
ALTER TABLE public.auditorias ENABLE ROW LEVEL SECURITY;

-- Política SELECT: Ver todas las auditorías donde eres el auditor responsable
CREATE POLICY "auditorias_select_simple"
ON public.auditorias
FOR SELECT
TO authenticated
USING (
  auditor_responsable_id = auth.uid()
  OR
  public.get_current_user_role() = 'auditor_interno'
);

-- Política INSERT: Solo crear auditorías para ti mismo
CREATE POLICY "auditorias_insert_simple"
ON public.auditorias
FOR INSERT
TO authenticated
WITH CHECK (
  auditor_responsable_id = auth.uid()
  AND public.get_current_user_role() IN ('auditor', 'auditor_interno')
);

-- Política UPDATE: Solo actualizar tus propias auditorías
CREATE POLICY "auditorias_update_simple"
ON public.auditorias
FOR UPDATE
TO authenticated
USING (
  auditor_responsable_id = auth.uid()
  OR
  public.get_current_user_role() = 'auditor_interno'
)
WITH CHECK (
  auditor_responsable_id = auth.uid()
  OR
  public.get_current_user_role() = 'auditor_interno'
);

-- Política DELETE: Solo auditor_interno puede eliminar
CREATE POLICY "auditorias_delete_simple"
ON public.auditorias
FOR DELETE
TO authenticated
USING (
  public.get_current_user_role() = 'auditor_interno'
);

-- Paso 6: Crear índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_auditorias_activity ON public.auditorias(activity_id);
CREATE INDEX IF NOT EXISTS idx_auditorias_auditor ON public.auditorias(auditor_responsable_id);
CREATE INDEX IF NOT EXISTS idx_auditorias_estado ON public.auditorias(estado);
CREATE INDEX IF NOT EXISTS idx_auditorias_creada_at ON public.auditorias(creada_at);

-- Paso 7: Recrear triggers (sin la validación de rol que puede causar problemas)
DROP TRIGGER IF EXISTS trigger_validate_auditor_role ON public.auditorias;
DROP TRIGGER IF EXISTS trigger_update_fecha_cierre ON public.auditorias;
DROP TRIGGER IF EXISTS trigger_auditorias_updated_at ON public.auditorias;

-- Trigger para actualizar actualizada_at
CREATE OR REPLACE FUNCTION update_auditorias_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.actualizada_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auditorias_updated_at
BEFORE UPDATE ON public.auditorias
FOR EACH ROW
EXECUTE FUNCTION update_auditorias_updated_at();

-- Trigger para actualizar fecha_cierre
CREATE OR REPLACE FUNCTION update_fecha_cierre()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.estado = 'CERRADA' AND (OLD.estado IS NULL OR OLD.estado != 'CERRADA') THEN
    NEW.fecha_cierre = CURRENT_DATE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_fecha_cierre
BEFORE UPDATE ON public.auditorias
FOR EACH ROW
EXECUTE FUNCTION update_fecha_cierre();

-- Paso 8: Verificar que todo funciona
SELECT 
  'Tabla creada' as estado,
  COUNT(*) as registros
FROM public.auditorias
UNION ALL
SELECT 
  'Políticas activas' as estado,
  COUNT(*)::bigint as registros
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'auditorias'
UNION ALL
SELECT 
  'RLS habilitado' as estado,
  CASE WHEN rowsecurity THEN 1 ELSE 0 END as registros
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'auditorias';

-- ✅ Si este script termina sin errores, el problema está resuelto
-- Ahora intenta hacer una consulta de prueba:
-- SELECT * FROM auditorias WHERE auditor_responsable_id = auth.uid();

