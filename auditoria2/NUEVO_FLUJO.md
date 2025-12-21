# ✅ NUEVO FLUJO: Asignación y Validación

## 🎯 Cambios Implementados

### 1️⃣ **SelectResponsable (Asignación)**
- ✅ Solo **auditor_interno** puede asignar/cambiar responsable
- ❌ **Auditor** NO puede cambiar la asignación
- ❌ **Auditado** NO puede cambiar la asignación
- ✅ Si está "Sin asignar", solo auditor_interno puede asignar

### 2️⃣ **SelectValidacion (Nuevo Componente)**
- ✅ **Auditor** puede marcar si cumplió o no su actividad
- ✅ **Auditor_interno** también puede cambiar validación
- ❌ **Auditado** solo ve el estado (no puede cambiar)
- ✅ Botones: "Pendiente" y "Cumplido"
- ✅ Actualiza `validation_status` en la BD

### 3️⃣ **Tabla Actualizada**
- ✅ Nueva columna "Validación" al final
- ✅ Removida columna "Estado" (ahora es "Validación")
- ✅ Columna "Responsable" solo editable por auditor_interno

## 📋 Flujo Completo

### Como Auditor Interno:

1. **Ve todas las actividades**
2. **Asigna responsable** usando dropdown "Responsable"
   - Selecciona auditor o auditado
   - Se actualiza `auditor_id`
3. **Puede cambiar validación** usando botones "Pendiente"/"Cumplido"
   - Se actualiza `validation_status`

### Como Auditor (César):

1. **Solo ve sus actividades asignadas**
2. **NO puede cambiar responsable** (solo lectura)
3. **SÍ puede cambiar validación** usando botones
   - Marca "Cumplido" cuando termina
   - Marca "Pendiente" si aún no termina
   - Se actualiza `validation_status`

### Como Auditado:

1. **Solo ve sus actividades asignadas**
2. **NO puede cambiar responsable** (solo lectura)
3. **NO puede cambiar validación** (solo lectura)

## 🔧 Configuración RLS en Supabase

Ejecuta este script en **Supabase SQL Editor**:

```sql
-- Eliminar políticas antiguas
DROP POLICY IF EXISTS "Solo auditor interno puede asignar actividades" ON public.audit_activities;
DROP POLICY IF EXISTS "Auditor interno y auditor actualizan actividades" ON public.audit_activities;

-- POLÍTICA 1: Solo auditor_interno puede cambiar responsable (auditor_id)
CREATE POLICY "Solo auditor interno puede asignar responsable"
ON public.audit_activities
FOR UPDATE
TO authenticated
USING (
  public.get_current_user_role() = 'auditor_interno'
)
WITH CHECK (
  public.get_current_user_role() = 'auditor_interno'
);

-- POLÍTICA 2: Auditor puede actualizar validation_status de sus actividades
CREATE POLICY "Auditor puede validar sus actividades"
ON public.audit_activities
FOR UPDATE
TO authenticated
USING (
  public.get_current_user_role() = 'auditor'
  AND auditor_id = auth.uid()
)
WITH CHECK (
  public.get_current_user_role() = 'auditor'
  AND auditor_id = auth.uid()
);
```

**⚠️ NOTA:** Las políticas RLS permiten UPDATE completo, pero el frontend solo envía el campo que se actualiza:
- `SelectResponsable` → solo actualiza `auditor_id`
- `SelectValidacion` → solo actualiza `validation_status`

## 📊 Permisos Resumen

| Acción | auditor_interno | auditor | auditado |
|--------|----------------|---------|----------|
| Ver actividades | ✅ Todas | ✅ Solo asignadas | ✅ Solo asignadas |
| Asignar responsable | ✅ Sí | ❌ No | ❌ No |
| Cambiar validación | ✅ Sí | ✅ Sí (solo suyas) | ❌ No |

## 🧪 Probar el Flujo

### Paso 1: Auditor Interno Asigna
1. Selecciona actividad
2. En "Responsable" → Elige "César"
3. ✅ `auditor_id` se actualiza

### Paso 2: César Valida
1. Ve su actividad asignada
2. En "Validación" → Click "Cumplido"
3. ✅ `validation_status` se actualiza a "cumplido"

## ✅ Checklist

- [ ] Ejecutaste el script RLS en Supabase
- [ ] Auditor_interno puede asignar responsables
- [ ] Auditor NO puede cambiar responsable
- [ ] Auditor puede cambiar validación
- [ ] Auditado solo ve (no puede cambiar nada)
- [ ] Columna "Validación" aparece en la tabla
- [ ] Botones "Pendiente"/"Cumplido" funcionan

¡Listo! El nuevo flujo está implementado 🎉

