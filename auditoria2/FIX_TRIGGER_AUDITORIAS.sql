-- ============================================
-- FIX: Corregir trigger de auditorias
-- ============================================
-- Este script corrige el trigger que está causando el error:
-- "record \"new\" has no field \"updated_at\""
-- ============================================

-- Eliminar el trigger incorrecto si existe
DROP TRIGGER IF EXISTS update_auditorias_updated_at ON public.auditorias;

-- Asegurarse de que la función específica existe y es correcta
CREATE OR REPLACE FUNCTION update_auditorias_actualizada_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.actualizada_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear el trigger correcto usando la función específica
DROP TRIGGER IF EXISTS update_auditorias_actualizada_at_trigger ON public.auditorias;
CREATE TRIGGER update_auditorias_actualizada_at_trigger
  BEFORE UPDATE ON public.auditorias
  FOR EACH ROW
  EXECUTE FUNCTION update_auditorias_actualizada_at();

-- También corregir la función genérica para que no intente acceder a updated_at en auditorias
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  -- Solo actualizar updated_at si la tabla NO es auditorias
  IF TG_TABLE_NAME != 'auditorias' THEN
    -- Verificar si la columna updated_at existe usando un bloque de excepción
    BEGIN
      NEW.updated_at = NOW();
    EXCEPTION
      WHEN undefined_column THEN
        -- Si no existe updated_at, no hacer nada
        NULL;
    END;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  RAISE NOTICE '✅ Trigger de auditorias corregido';
END $$;

