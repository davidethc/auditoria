-- ============================================
-- SCRIPT FINAL: CORREGIR TRIGGER DE AUDITORIAS
-- ============================================
-- Corrige el error: record "new" has no field "updated_at"
-- ============================================

-- Crear función específica para auditorias
CREATE OR REPLACE FUNCTION update_auditorias_actualizada_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.actualizada_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Eliminar trigger antiguo
DROP TRIGGER IF EXISTS update_auditorias_updated_at ON public.auditorias;
DROP TRIGGER IF EXISTS update_auditorias_actualizada_at_trigger ON public.auditorias;

-- Crear trigger correcto
CREATE TRIGGER update_auditorias_actualizada_at_trigger
  BEFORE UPDATE ON public.auditorias
  FOR EACH ROW
  EXECUTE FUNCTION update_auditorias_actualizada_at();

