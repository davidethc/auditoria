# 🚀 INSTRUCCIONES FINALES: APLICAR CORRECCIONES

## 📋 RESUMEN

Este documento contiene las instrucciones paso a paso para aplicar todas las correcciones identificadas en la auditoría completa del sistema.

---

## ✅ ESTADO ACTUAL

### **Correcciones en Código:**
- ✅ `PreparacionForm.tsx` - Ya actualiza `preparacion_completada` y `fecha_preparacion_completada` correctamente

### **Correcciones Pendientes:**
- ⚠️ Ejecutar correcciones SQL en Supabase
- ⚠️ Ajustar workflow N8N "Notificar Auditados" (eliminar nodo duplicado)

---

## 🔧 PASO 1: EJECUTAR CORRECCIONES SQL

### **1.1. Ejecutar Función de Observaciones**

**Archivo:** `CREATE_FUNCTION_OBSERVACIONES_VENCIMIENTO_PROXIMO.sql`

**Cómo ejecutar:**
1. Abre Supabase Dashboard
2. Ve a SQL Editor
3. Copia y pega el contenido de `CREATE_FUNCTION_OBSERVACIONES_VENCIMIENTO_PROXIMO.sql`
4. Ejecuta el script
5. Verifica que no haya errores

**Qué hace:**
- Crea función `get_observaciones_vencimiento_proximo(dias_anticipacion)`
- Necesaria para el workflow N8N "Recordatorios de Cumplimiento"

---

### **1.2. Ejecutar Correcciones de Triggers**

**Archivo:** `CORRECCIONES_CRITICAS_TRIGGERS.sql`

**Cómo ejecutar:**
1. En Supabase SQL Editor
2. Copia y pega el contenido de `CORRECCIONES_CRITICAS_TRIGGERS.sql`
3. Ejecuta el script
4. Verifica que no haya errores

**Qué corrige:**
1. ✅ `trigger_crear_solicitud_doc` - Corrige cálculo de fecha límite
2. ✅ `trigger_actualizar_matriz_informe` - Solo ejecuta cuando cambia estado
3. ✅ `trigger_marcar_actividad_cumplida_aud` - Elimina consulta redundante
4. ✅ `trigger_actualizar_estado_obs` - Maneja observaciones sin fecha_fin

---

### **1.3. Verificar Correcciones**

**Archivo:** `SCRIPT_PRUEBA_CORRECCIONES.sql`

**Cómo ejecutar:**
1. En Supabase SQL Editor
2. Copia y pega el contenido de `SCRIPT_PRUEBA_CORRECCIONES.sql`
3. Ejecuta el script
4. Revisa los mensajes de verificación

**Qué verifica:**
- ✅ Función `get_observaciones_vencimiento_proximo` existe
- ✅ Triggers están corregidos
- ✅ Tablas tienen campos correctos

**Resultado esperado:**
- Todas las verificaciones deben mostrar ✅
- Si alguna muestra ❌, ejecuta el archivo SQL indicado

---

## 🤖 PASO 2: AJUSTAR WORKFLOW N8N

### **2.1. Eliminar Nodo Duplicado en "Notificar Auditados"**

**Problema:** El workflow crea solicitudes de documentación, pero el trigger también lo hace (duplicación).

**Solución:** Eliminar el nodo "HTTP Request - Crear Solicitud Documentación" del workflow.

**Cómo hacerlo:**
1. Abre N8N
2. Abre el workflow "Notificar Auditados"
3. Busca el nodo "HTTP Request - Crear Solicitud Documentación"
4. Elimínalo (o desactívalo)
5. Conecta el nodo anterior directamente al siguiente nodo
6. Guarda el workflow

**Nota:** El trigger `trigger_crear_solicitud_doc` ya crea las solicitudes automáticamente cuando se notifica a un auditado, así que el nodo N8N es redundante.

---

## 🧪 PASO 3: PROBAR FUNCIONALIDAD

### **3.1. Probar Guardar Preparación**

1. Abre una auditoría en estado `PLANIFICADA`
2. Ve a la pestaña "Preparación"
3. Llena los campos obligatorios (Objetivo, Alcance, Criterios)
4. Haz clic en "Guardar Preparación"
5. Verifica en la base de datos que:
   - `auditorias.preparacion_completada = true`
   - `auditorias.fecha_preparacion_completada` tiene fecha actual

---

### **3.2. Probar Notificar Auditados**

1. Con una auditoría que tenga preparación completa y auditados agregados
2. Haz clic en "Notificar Auditados"
3. Verifica que:
   - Se crea una solicitud de documentación por cada auditado (sin duplicados)
   - La fecha límite es 8 días hábiles desde hoy (excluye sábados y domingos)
   - Se envía correo a cada auditado
   - `auditorias.participantes_notificados = true`

**Si hay duplicados:**
- Verifica que eliminaste el nodo del workflow N8N
- Verifica que el trigger está activo

---

### **3.3. Probar Actualizar Informe**

1. Crea un informe borrador
2. Cambia el estado a `ENVIADO_A_AUDITADOS`
3. Verifica que:
   - La matriz de observaciones se actualiza SOLO cuando cambia el estado
   - No se actualiza en cada UPDATE del informe

**Cómo verificar:**
- Actualiza un campo del informe sin cambiar el estado
- Verifica que la matriz NO se actualiza
- Cambia el estado a `ENVIADO_A_AUDITADOS`
- Verifica que la matriz SÍ se actualiza

---

### **3.4. Probar Cerrar Auditoría**

1. Con una auditoría completada
2. Cambia el estado a `CERRADA`
3. Verifica que:
   - `audit_activities.validation_status = 'CUMPLIDA'`
   - `audit_activities.end_date` tiene fecha de cierre
   - No hay errores en la consola

---

## 📊 CHECKLIST COMPLETO

### **SQL:**
- [ ] Ejecutar `CREATE_FUNCTION_OBSERVACIONES_VENCIMIENTO_PROXIMO.sql`
- [ ] Ejecutar `CORRECCIONES_CRITICAS_TRIGGERS.sql`
- [ ] Ejecutar `SCRIPT_PRUEBA_CORRECCIONES.sql`
- [ ] Verificar que todas las verificaciones muestren ✅

### **N8N:**
- [ ] Eliminar nodo "HTTP Request - Crear Solicitud Documentación" del workflow "Notificar Auditados"
- [ ] Verificar que el workflow sigue funcionando correctamente

### **Pruebas:**
- [ ] Probar guardar preparación
- [ ] Probar notificar auditados (sin duplicados)
- [ ] Probar actualizar informe (solo cuando cambia estado)
- [ ] Probar cerrar auditoría

---

## 🐛 SOLUCIÓN DE PROBLEMAS

### **Error: "function get_observaciones_vencimiento_proximo does not exist"**
- **Causa:** No se ejecutó `CREATE_FUNCTION_OBSERVACIONES_VENCIMIENTO_PROXIMO.sql`
- **Solución:** Ejecutar el archivo SQL en Supabase

### **Error: "duplicate key value violates unique constraint" en solicitudes_documentacion**
- **Causa:** El workflow N8N y el trigger crean solicitudes (duplicación)
- **Solución:** Eliminar el nodo del workflow N8N (el trigger ya lo hace)

### **Error: "trigger_crear_solicitud_doc: invalid input syntax for type date"**
- **Causa:** El trigger usa `calcular_dias_laborables` incorrectamente
- **Solución:** Ejecutar `CORRECCIONES_CRITICAS_TRIGGERS.sql`

### **La matriz se actualiza en cada UPDATE del informe**
- **Causa:** El trigger no verifica cambio de estado
- **Solución:** Ejecutar `CORRECCIONES_CRITICAS_TRIGGERS.sql` (Corrección 2)

---

## 📝 NOTAS ADICIONALES

### **Sobre el Workflow "Generar Word":**
- ⚠️ Actualmente NO genera Word real, solo HTML
- Para producción, necesitarás agregar conversión HTML→Word (CloudConvert API)
- Por ahora, el workflow puede fallar al subir a Google Drive

### **Sobre el Workflow "Recordatorios Cumplimiento":**
- ✅ Requiere función `get_observaciones_vencimiento_proximo`
- ✅ Ejecutar `CREATE_FUNCTION_OBSERVACIONES_VENCIMIENTO_PROXIMO.sql` antes de activar

### **Sobre el Workflow "Recordatorios Fin de Mes":**
- ⚠️ Necesita prueba manual para verificar que funciona correctamente
- Verifica que los filtros de Supabase funcionen correctamente

---

## ✅ ESTADO FINAL ESPERADO

Después de aplicar todas las correcciones:

1. ✅ Todos los triggers funcionan correctamente
2. ✅ No hay duplicación de solicitudes de documentación
3. ✅ La matriz se actualiza solo cuando cambia el estado del informe
4. ✅ Las actividades se marcan como cumplidas al cerrar auditorías
5. ✅ Los flags de auditoría se actualizan correctamente
6. ✅ Los workflows N8N funcionan sin errores

---

## 🎯 PRÓXIMOS PASOS DESPUÉS DE CORRECCIONES

1. **Monitorear logs** de Supabase para verificar que no hay errores
2. **Probar flujo completo** de una auditoría de principio a fin
3. **Verificar KPIs** funcionan correctamente
4. **Documentar** cualquier comportamiento inesperado

---

## 📞 SOPORTE

Si encuentras problemas:
1. Revisa los mensajes de error en Supabase SQL Editor
2. Ejecuta `SCRIPT_PRUEBA_CORRECCIONES.sql` para identificar qué falta
3. Verifica los logs de N8N si hay problemas con workflows
4. Revisa la consola del navegador para errores en Next.js

---

## 📚 DOCUMENTOS RELACIONADOS

- `AUDITORIA_COMPLETA_SISTEMA.md` - Reporte completo de auditoría
- `EXPLICACION_DETALLADA_FLUJOS_N8N.md` - Explicación de cada flujo N8N
- `RESUMEN_CORRECCIONES_APLICADAS.md` - Resumen de correcciones
- `CORRECCIONES_CRITICAS_TRIGGERS.sql` - Correcciones SQL
- `SCRIPT_PRUEBA_CORRECCIONES.sql` - Script de verificación

