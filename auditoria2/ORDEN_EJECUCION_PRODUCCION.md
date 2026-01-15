# ⚡ ORDEN DE EJECUCIÓN PARA PRODUCCIÓN

## 🎯 OBJETIVO
Implementar sistema completo de automatización en **2-3 horas** para producción bancaria.

---

## 📋 PASO A PASO (SIGUE ESTE ORDEN EXACTO)

### **🔴 PASO 1: BASE DE DATOS (CRÍTICO - 10 minutos)**

**Ejecutar en Supabase SQL Editor (en este orden exacto):**

#### **1.1. Funciones Auxiliares**
```sql
-- Copiar y pegar contenido de:
CREATE_FUNCTION_CALCULAR_DIAS_LABORABLES.sql
```
✅ Verificar: `SELECT calcular_dias_laborables('2024-01-01', '2024-01-10');` → Debe retornar 8

---

#### **1.2. Función Actualizar Matriz**
```sql
-- Copiar y pegar contenido de:
CREATE_FUNCTION_ACTUALIZAR_MATRIZ_OBSERVACIONES.sql
```
✅ Verificar: Función creada sin errores

---

#### **1.3. Función Observaciones Vencimiento**
```sql
-- Copiar y pegar contenido de:
CREATE_FUNCTION_OBSERVACIONES_VENCIMIENTO_PROXIMO.sql
```
✅ Verificar: `SELECT * FROM get_observaciones_vencimiento_proximo(90);` → Debe retornar array (puede estar vacío)

---

#### **1.4. Triggers de Producción**
```sql
-- Copiar y pegar contenido de:
TRIGGERS_SUPABASE_PRODUCCION.sql
```
✅ Verificar: Debe mostrar mensaje "✅ Triggers de producción creados exitosamente"

---

#### **1.5. Funciones de KPIs**
```sql
-- Copiar y pegar contenido de:
FUNCIONES_KPIS_PRODUCCION.sql
```
✅ Verificar: `SELECT get_all_kpis(2024);` → Debe retornar JSON con KPIs

---

### **🟡 PASO 2: N8N WORKFLOWS (15-20 minutos)**

#### **2.1. Importar Workflow de Recordatorios**
1. Abrir N8N
2. Workflows → Import from File
3. Seleccionar: `n8n_workflow_recordatorios_cumplimiento.json`
4. Guardar

#### **2.2. Configurar Credenciales**
- **Supabase:** HTTP Header Auth
  - Header: `apikey` = `TU_SUPABASE_ANON_KEY`
  - Header: `Authorization` = `Bearer TU_SUPABASE_ANON_KEY`
- **Gmail:** OAuth2 (ya deberías tenerlo configurado)

#### **2.3. Activar Workflow**
- Toggle en esquina superior derecha → ACTIVAR

✅ Verificar: Workflow debe estar en estado "Active" (verde)

---

### **🟢 PASO 3: VERIFICAR INTEGRACIÓN (10 minutos)**

#### **3.1. Verificar Webhooks en Next.js**
- `components/BotonNotificar.tsx` → Debe llamar a `/webhook-test/notificar-auditados`
- Si hay botón "Generar Word" → Debe llamar a `/webhook-test/generar-word-informe`

#### **3.2. Probar Flujo Completo**
1. Crear auditoría de prueba
2. Completar preparación
3. Agregar participante
4. Hacer clic en "Notificar Auditados"
5. Verificar:
   - ✅ Correo enviado
   - ✅ Solicitud de documentación creada en DB
   - ✅ Comunicación guardada

---

### **🔵 PASO 4: PROBAR TRIGGERS (5 minutos)**

#### **4.1. Probar Trigger de Matriz**
```sql
-- Crear informe de prueba completo
UPDATE auditoria_informe
SET 
  estado = 'COMPLETADO',
  estrategia = 'Estrategia de prueba',
  fecha_inicio_implementacion = CURRENT_DATE,
  fecha_fin_implementacion = CURRENT_DATE + INTERVAL '30 days'
WHERE id = 'UUID-DE-INFORME-PRUEBA';

-- Verificar que matriz se actualizó
SELECT 
  numero_informe,
  fecha_emision_informe,
  estrategia,
  fecha_inicio,
  fecha_fin
FROM auditoria_observaciones
WHERE auditoria_id = 'UUID-DE-AUDITORIA-PRUEBA';
```

✅ Verificar: Campos deben estar actualizados

---

#### **4.2. Probar Trigger de Solicitud Documentación**
```sql
-- Actualizar participante a NOTIFICADO
UPDATE auditoria_participantes
SET estado_participacion = 'NOTIFICADO'
WHERE id = 'UUID-DE-PARTICIPANTE-PRUEBA';

-- Verificar que se creó solicitud
SELECT * FROM solicitudes_documentacion
WHERE solicitado_a_id = 'UUID-DE-AUDITADO-PRUEBA';
```

✅ Verificar: Debe existir solicitud creada automáticamente

---

### **🟣 PASO 5: PROBAR KPIs (5 minutos)**

```sql
-- Probar cada KPI individualmente
SELECT * FROM get_kpi_auditorias_ejecutadas_vs_plan(2024);
SELECT * FROM get_kpi_recomendaciones_implementadas_plazo(2024);
SELECT * FROM get_kpi_tiempo_promedio_cierre(2024);
SELECT * FROM get_kpi_estado_recomendaciones_por_area(2024);

-- Probar función general
SELECT get_all_kpis(2024);
```

✅ Verificar: Todas deben retornar datos (pueden ser 0 si no hay datos)

---

## ✅ CHECKLIST FINAL

### **Base de Datos:**
- [ ] Funciones auxiliares creadas
- [ ] Triggers creados
- [ ] Funciones KPIs creadas
- [ ] Triggers probados
- [ ] KPIs probados

### **N8N:**
- [ ] Workflow de recordatorios importado
- [ ] Credenciales configuradas
- [ ] Workflow activado
- [ ] Otros workflows activos

### **Next.js:**
- [ ] Webhooks configurados
- [ ] Flujo completo probado

---

## 🎯 RESULTADO ESPERADO

Después de seguir estos pasos:

✅ **Datos se guardan automáticamente** (triggers)  
✅ **Notificaciones se envían automáticamente** (N8N)  
✅ **Matriz se actualiza automáticamente** (triggers)  
✅ **KPIs están disponibles** (funciones SQL)  
✅ **Sistema listo para producción bancaria**

---

## 🐛 SI ALGO FALLA

### **Error en SQL:**
1. Verificar que no haya errores de sintaxis
2. Verificar que funciones anteriores estén creadas
3. Revisar logs de Supabase

### **Error en N8N:**
1. Verificar que workflow esté activo
2. Verificar credenciales
3. Revisar logs de ejecución

### **Error en Next.js:**
1. Verificar que webhooks estén configurados
2. Verificar que N8N esté activo
3. Revisar consola del navegador

---

## 📞 SIGUIENTE PASO

Una vez completado todo:
1. ✅ Revisar `RESUMEN_EJECUTIVO_PRODUCCION.md` para entender el sistema completo
2. ✅ Revisar `FLUJOS_COMPLETOS_PRODUCCION.md` para detalles técnicos
3. ✅ Crear dashboard de KPIs (opcional pero recomendado)

---

## ⏱️ TIEMPO TOTAL

- **Paso 1 (Base de Datos):** 10 minutos
- **Paso 2 (N8N):** 15-20 minutos
- **Paso 3 (Verificar):** 10 minutos
- **Paso 4 (Probar Triggers):** 5 minutos
- **Paso 5 (Probar KPIs):** 5 minutos

**Total: 45-50 minutos** para implementación completa

---

## 🎉 ¡LISTO PARA PRODUCCIÓN!

Sistema completamente automatizado y validado para uso bancario.

