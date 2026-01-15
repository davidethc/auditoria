# 📖 GUÍA COMPLETA DE FLUJOS DEL SISTEMA

## 🎯 FLUJO COMPLETO PASO A PASO

### **PASO 1: AUDITOR INTERNO - Crear Plan y Asignar Auditor** 📅

**Quién:** Auditor Interno  
**Dónde:** `/plan-trabajo`  
**Qué hace:**
1. Crea Plan Anual (año, descripción)
2. Crea Actividades dentro del plan
3. **Asigna Auditor** a cada actividad (campo `auditor_id`)
4. Define fechas de inicio y fin de cada actividad

**Resultado:**
- Plan en `audit_plans`
- Actividades en `audit_activities`
- Auditor asignado

**Tiempo:** Variable (planificación anual)

---

### **PASO 2: AUDITOR - Crear Auditoría** 🆕

**Quién:** Auditor asignado  
**Dónde:** `/plan-trabajo` → Ver actividades → Click "Crear Auditoría"  
**Qué hace:**
1. Ve actividades asignadas a él
2. Selecciona una actividad
3. Click en "Crear Auditoría"
4. Define fechas de inicio y fin de la auditoría
5. Sistema crea auditoría

**Resultado:**
- Auditoría creada en `auditorias`
- Estado: `PLANIFICADA`
- `auditor_responsable_id` = ID del auditor
- `activity_id` = ID de la actividad

**Tiempo:** 2-5 minutos

---

### **PASO 3: AUDITOR - Completar Preparación** 📝

**Quién:** Auditor  
**Dónde:** `/auditorias/[id]` → Tab "Preparación"  
**Qué hace:**
1. Completa formulario:
   - **Objetivo** * (obligatorio)
   - **Alcance** * (obligatorio)
   - **Criterios** * (obligatorio)
   - Riesgos (opcional)
   - Metodología (opcional)
   - Recursos necesarios (opcional)
2. Guarda

**Resultado:**
- Preparación en `auditoria_preparacion`
- `preparacion_completada = true`

**Tiempo:** 15-30 minutos

---

### **PASO 4: AUDITOR - Agregar Auditados** 👥

**Quién:** Auditor  
**Dónde:** `/auditorias/[id]` → Tab "Participantes"  
**Qué hace:**
1. Selecciona usuarios con rol `auditado`
2. Asigna rol: `AUDITADO`, `OBSERVADOR`, o `APOYO`
3. Agrega cada participante

**Resultado:**
- Participantes en `auditoria_participantes`
- Estado: `PENDIENTE`

**Tiempo:** 5-10 minutos

---

### **PASO 5: AUDITOR - Notificar Auditados** 📧

**Quién:** Auditor  
**Dónde:** Botón "Notificar Auditados"  
**Requisitos:**
- ✅ Preparación completa
- ✅ Al menos un auditado

**Qué hace el sistema:**
1. Crea comunicaciones en `comunicaciones_auditado`
2. Actualiza participantes: `NOTIFICADO`, `fecha_notificacion`
3. Actualiza auditoría: `participantes_notificados = true`
4. **LLAMA WEBHOOK N8N** → `n8n_workflow_notificar_auditados.json`

**Qué hace N8N (automático):**
1. Recibe datos del webhook
2. Genera correo HTML con objetivo, alcance, criterios, fechas
3. **Envía correo a cada auditado**
4. **Crea solicitudes de documentación** (8 días hábiles)
5. Actualiza estados

**Resultado:**
- Auditados reciben correo
- Solicitudes creadas automáticamente
- Fecha límite: 8 días hábiles

**Tiempo:** Inmediato (automático)

---

### **PASO 6: AUDITADO - Entregar Documentación** 📄

**Quién:** Auditado  
**Dónde:** `/documents`  
**Plazo:** 8 días hábiles  
**Qué hace:**
1. Ve solicitudes pendientes
2. Responde con link de Google Drive (validado)
3. Envía

**Resultado:**
- Solicitud: `estado = 'ENVIADA'`, `fecha_respuesta = NOW()`
- Link guardado

**Tiempo:** 8 días hábiles (plazo)

---

### **PASO 7: AUDITOR - Iniciar Ejecución** ▶️

**Quién:** Auditor  
**Dónde:** Botón "Iniciar Ejecución"  
**Qué hace:**
1. Click en "Iniciar Ejecución"
2. Estado: `PLANIFICADA` → `EN_EJECUCION`
3. Tab "Ejecución" aparece

**Tiempo:** Inmediato

---

### **PASO 8: AUDITOR - Registrar Observaciones** 🔍

**Quién:** Auditor  
**Dónde:** `/auditorias/[id]/ejecucion`  
**Qué hace:**
1. Click "Nueva Observación"
2. Completa:
   - Título *, Descripción *, Recomendación *
   - Probabilidad, Impacto, Riesgo
   - Responsable de Estrategia
   - **Responsable de Implementación** (auditado)
3. Guarda

**Resultado:**
- Observación en `auditoria_observaciones`
- `numero_observacion` automático
- Estado: `NO_INICIADA`

**Tiempo:** Variable (durante ejecución)

---

### **PASO 9: AUDITOR - Finalizar Ejecución** ✅

**Quién:** Auditor  
**Dónde:** Botón "Finalizar Ejecución"  
**Qué hace:**
1. Click en "Finalizar Ejecución"
2. Estado: `EN_EJECUCION` → `EN_REPORTE`
3. Tab "Informe" aparece

**Tiempo:** Inmediato

---

### **PASO 10: AUDITOR - Crear Informe Borrador** 📄

**Quién:** Auditor  
**Dónde:** `/auditorias/[id]/informe` → Tab "Borrador"  
**Qué hace:**
1. Completa formulario según `informe.markdown`:
   - Encabezado (N° informe) *
   - De, Para, Asunto *
   - Fecha del Informe *
   - Antecedentes *, Objetivos *, Alcance *
   - Resultados de revisión
   - Selecciona observaciones *
   - Conclusiones, Recomendaciones
2. Guarda o envía a revisión

**Resultado:**
- Informe en `auditoria_informe`
- Estado: `BORRADOR`
- Observaciones actualizadas: `numero_informe`, `fecha_emision_informe`

**Tiempo:** 1-2 horas

---

### **PASO 11: AUDITOR - Enviar a Revisión** 📤

**Quién:** Auditor  
**Dónde:** Botón "Enviar a Revisión"  
**Qué hace:**
1. Click en "Enviar a Revisión"
2. Estado: `BORRADOR` → `EN_REVISION`
3. **NOTIFICA AUTOMÁTICAMENTE AL AUDITOR INTERNO** ✅

**Resultado:**
- Estado: `EN_REVISION`
- Auditor Interno recibe notificación

**Tiempo:** Inmediato

---

### **PASO 12: AUDITOR INTERNO - Revisar** 👁️

**Quién:** Auditor Interno  
**Dónde:** `/auditorias/[id]/informe` → Tab "Revisión"  
**Opciones:**
- **Aprobar** → Estado: `APROBADO`
- **Solicitar Correcciones** → Estado: `CON_CORRECCIONES`

**Tiempo:** 1-3 días

---

### **PASO 13: AUDITOR - Socializar** 🤝

**Quién:** Auditor  
**Dónde:** Tab "Socialización"  
**Qué hace:**
1. Selecciona participantes
2. Click "Enviar a Auditados"
3. Estado: `APROBADO` → `ENVIADO_A_AUDITADOS`
4. Observaciones actualizadas: `fecha_envio_informe`

**Tiempo:** Inmediato

---

### **PASO 14: AUDITADO - Completar Estrategia** 📅

**Quién:** Auditado  
**Dónde:** Tab "Estrategia"  
**Plazo:** 3 días hábiles  
**Qué hace:**
1. Completa: Estrategia *, Fecha Inicio *, Fecha Fin *, Entregable *
2. Guarda

**Qué hace el sistema:**
1. Guarda en informe
2. **NOTIFICA AL AUDITOR POR CADA OBSERVACIÓN** ✅
   - Una notificación por cada observación individual
   - Incluye fechas, estrategia, entregable

**Resultado:**
- Estrategia guardada
- Fechas propagadas a observaciones (trigger)
- Auditor recibe notificaciones

**Tiempo:** 3 días hábiles

---

### **PASO 15: AUDITADO - Reportar Avance Mensual** 📊

**Quién:** Auditado  
**Dónde:** Matriz de Observaciones → Botón "Reportar Avance" (icono TrendingUp)  
**Cuándo:** Mensualmente  
**Qué hace:**
1. Completa: Porcentaje *, Descripción *, Evidencia (opcional)
2. Envía

**Qué hace el sistema:**
1. Actualiza: `porcentaje_avance`, `descripcion_avance`
2. Crea evidencia si hay link
3. **NOTIFICA AL AUDITOR** ✅

**AUTOMATIZACIÓN N8N:**
- **Recordatorios mensuales:** `n8n_workflow_recordatorios_fin_mes_MEJORADO.json`
- **Recordatorios 90/60/30 días:** `n8n_workflow_recordatorios_cumplimiento_MEJORADO.json`

**Tiempo:** Mensual

---

### **PASO 16: AUDITOR INTERNO - Revisar Descargos** 🔍

**Quién:** Auditor Interno / Auditor  
**Dónde:** `/auditorias/revision-descargos`  
**Qué hace:**
1. Ve todas las observaciones con descargos/evidencias
2. Revisa estrategias, avances
3. Aprobar o Rechazar con comentarios

**Tiempo:** Variable

---

### **PASO 17: AUDITOR - Generar Word** 📄

**Quién:** Auditor  
**Dónde:** Botón "Generar Word"  
**Qué hace:**
1. Click en "Generar Word"
2. Sistema llama API → Webhook N8N
3. **N8N genera Word automáticamente** ✅
   - Workflow: `n8n_workflow_generar_word_MEJORADO.json`
   - Obtiene informe de Supabase
   - Genera HTML → Convierte a Word
   - Sube a Google Drive
   - Actualiza `documento_word_url`

**Resultado:**
- Word generado
- Subido a Drive
- URL guardada

**Tiempo:** 1-2 minutos (automático)

---

### **PASO 18: TODOS - Firmar** ✍️

**Quién:** Auditor + Auditados  
**Dónde:** Tab "Firmas"  
**Qué hace:**
1. Cada uno hace click en "Firmar Informe"
2. Sistema registra firma
3. Cuando **TODOS** firman:
   - Estado: `COMPLETADO`
   - Auditoría: `CERRADA`

**Tiempo:** 1-3 días

---

## 📊 SECUENCIA DE GENERACIÓN DE ARCHIVOS

### **Excel (Matriz):**
- **Cuándo:** Cualquier momento
- **Cómo:** Botón "Exportar Excel" en `MatrizObservaciones`
- **Qué incluye:** 30 campos de la matriz
- **Dónde:** Descarga directa

### **Word (Informe):**
- **Cuándo:** Paso 17 (click en "Generar Word")
- **Cómo:** N8N automático
- **Qué incluye:** Todo según `informe.markdown`
- **Dónde:** Google Drive

---

## 🔄 AUTOMATIZACIONES N8N - LISTA FINAL

### **✅ USAR ESTOS 4:**

1. **`n8n_workflow_notificar_auditados.json`**
   - Click "Notificar Auditados"
   - Envía correos + Crea solicitudes

2. **`n8n_workflow_recordatorios_cumplimiento_MEJORADO.json`**
   - Diario 9 AM (automático)
   - Recordatorios 90/60/30 días

3. **`n8n_workflow_recordatorios_fin_mes_MEJORADO.json`**
   - Último día hábil del mes 9 AM (automático)
   - Solicita avances o recuerda fechas

4. **`n8n_workflow_generar_word_MEJORADO.json`**
   - Click "Generar Word"
   - Genera Word → Sube a Drive

### **⚠️ OPCIONAL:**

5. **`n8n_workflow_notificaciones_mensuales.json`**
   - Día 1 de cada mes 8 AM
   - Notifica a auditores sobre actividades del mes
   - **Decisión:** Si no se usa, borrar

---

## 📋 RESUMEN DE ARCHIVOS

**Workflows N8N en tu proyecto:**
- ✅ 4 workflows obligatorios
- ⚠️ 1 workflow opcional
- ❌ 3 workflows borrados (versiones antiguas)

**Todo está listo para usar.** 🎉
