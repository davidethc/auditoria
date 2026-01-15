# 🔄 FLUJO COMPLETO DEL SISTEMA - DESDE CERO

## 📋 ÍNDICE

1. [Flujo Completo: Crear Auditoría → Cierre](#flujo-completo)
2. [Flujo de Informes y Matriz](#flujo-informes-matriz)
3. [Automatizaciones N8N](#automatizaciones-n8n)
4. [Tiempos y Plazos](#tiempos-y-plazos)

---

## 🎯 FLUJO COMPLETO: CREAR AUDITORÍA → CIERRE

### **PASO 1: AUDITOR INTERNO - Crear Plan de Trabajo** 📅

**Quién:** Auditor Interno  
**Dónde:** `/plan-trabajo`  
**Qué hace:**
1. Crea Plan Anual (año, descripción)
2. Crea Actividades dentro del plan
3. **Asigna Auditor** a cada actividad
4. Define fechas de inicio y fin

**Resultado:**
- Plan creado en `audit_plans`
- Actividades creadas en `audit_activities`
- Auditor asignado en `auditor_id`

**Tiempo:** Variable (planificación anual)

---

### **PASO 2: AUDITOR - Crear Auditoría desde Actividad** 🆕

**Quién:** Auditor asignado  
**Dónde:** `/plan-trabajo` → Click en actividad → "Crear Auditoría"  
**Qué hace:**
1. Selecciona una actividad del plan
2. Click en "Crear Auditoría"
3. Define fechas de inicio y fin de la auditoría
4. Sistema crea auditoría en estado `PLANIFICADA`

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
1. Completa formulario de preparación:
   - **Objetivo** (obligatorio)
   - **Alcance** (obligatorio)
   - **Criterios** (obligatorio)
   - Riesgos (opcional)
   - Metodología (opcional)
   - Recursos necesarios (opcional)
2. Guarda la preparación

**Resultado:**
- Preparación guardada en `auditoria_preparacion`
- `preparacion_completada = true` en `auditorias`
- `fecha_preparacion_completada = NOW()`

**Tiempo:** 15-30 minutos

---

### **PASO 4: AUDITOR - Agregar Auditados (Participantes)** 👥

**Quién:** Auditor  
**Dónde:** `/auditorias/[id]` → Tab "Participantes"  
**Qué hace:**
1. Selecciona usuarios con rol `auditado`
2. Asigna rol en auditoría:
   - `AUDITADO` (principal)
   - `OBSERVADOR` (opcional)
   - `APOYO` (opcional)
3. Agrega cada participante

**Resultado:**
- Participantes creados en `auditoria_participantes`
- Estado inicial: `PENDIENTE`
- `rol_en_auditoria` definido

**Tiempo:** 5-10 minutos

---

### **PASO 5: AUDITOR - Notificar Auditados** 📧

**Quién:** Auditor  
**Dónde:** `/auditorias/[id]` → Tab "Participantes" → Botón "Notificar Auditados"  
**Requisitos:**
- ✅ Preparación completa (objetivo, alcance, criterios)
- ✅ Al menos un auditado agregado

**Qué hace el sistema:**
1. Valida requisitos
2. Crea comunicaciones en `comunicaciones_auditado` (metodo: 'SISTEMA')
3. Actualiza participantes: `estado_participacion = 'NOTIFICADO'`, `fecha_notificacion = NOW()`
4. Actualiza auditoría: `participantes_notificados = true`, `fecha_notificacion = NOW()`
5. **LLAMA WEBHOOK N8N** → `n8n_workflow_notificar_auditados.json`

**Qué hace N8N (automático):**
1. Recibe datos del webhook
2. Genera correo HTML profesional con:
   - Objetivo, Alcance, Criterios
   - Fechas de inicio y fin
   - Información de la actividad
3. **Envía correo a cada auditado**
4. **Crea solicitudes de documentación** automáticamente (8 días hábiles)
5. Actualiza estados en BD

**Resultado:**
- Auditados reciben correo electrónico
- Solicitudes de documentación creadas en `solicitudes_documentacion`
- Fecha límite calculada automáticamente (8 días hábiles)

**Tiempo:** Inmediato (automático)

---

### **PASO 6: AUDITADO - Recibir Notificación y Confirmar** ✅

**Quién:** Auditado  
**Dónde:** Correo electrónico + Sistema  
**Qué recibe:**
- Correo con objetivo, alcance, criterios, fechas
- Notificación en sistema (`comunicaciones_auditado`)

**Qué hace:**
1. Lee el correo
2. Entra al sistema
3. Ve la auditoría en `/auditorias`
4. Puede confirmar participación (opcional)

**Tiempo:** 1-2 días (plazo para confirmar)

---

### **PASO 7: AUDITADO - Entregar Documentación** 📄

**Quién:** Auditado  
**Dónde:** `/documents`  
**Plazo:** 8 días hábiles desde notificación  
**Qué hace:**
1. Ve solicitudes de documentación pendientes
2. Responde con:
   - Link de Google Drive (obligatorio, validado)
   - Comentarios (opcional)
3. Envía respuesta

**Resultado:**
- Solicitud actualizada: `estado = 'ENVIADA'`, `fecha_respuesta = NOW()`
- Link guardado en `link_drive`
- Auditor recibe notificación

**Tiempo:** 8 días hábiles (plazo)

---

### **PASO 8: AUDITOR - Iniciar Ejecución** ▶️

**Quién:** Auditor  
**Dónde:** `/auditorias/[id]` → Botón "Iniciar Ejecución"  
**Requisitos:**
- ✅ Preparación completa
- ✅ Auditados notificados

**Qué hace:**
1. Click en "Iniciar Ejecución"
2. Sistema cambia estado: `PLANIFICADA` → `EN_EJECUCION`
3. Actualiza: `ejecucion_iniciada = true`, `fecha_inicio_ejecucion = NOW()`
4. Aparece nuevo tab "Ejecución"

**Resultado:**
- Estado: `EN_EJECUCION`
- Tab "Ejecución" disponible

**Tiempo:** Inmediato

---

### **PASO 9: AUDITOR - Registrar Observaciones** 🔍

**Quién:** Auditor  
**Dónde:** `/auditorias/[id]/ejecucion`  
**Qué hace:**
1. Durante la ejecución, registra observaciones encontradas
2. Click en "Nueva Observación"
3. Completa formulario:
   - **Título** (obligatorio)
   - **Descripción** (obligatorio)
   - **Recomendación** (obligatorio)
   - Probabilidad, Impacto, Riesgo
   - Responsable de Estrategia
   - **Responsable de Implementación** (auditado)
   - Estrategia, Entregable (opcional - se completa después)

**Resultado:**
- Observación creada en `auditoria_observaciones`
- `numero_observacion` asignado automáticamente
- `estado_observacion = 'NO_INICIADA'`
- `porcentaje_avance = 0`

**Tiempo:** Variable (durante ejecución)

---

### **PASO 10: AUDITOR - Finalizar Ejecución** ✅

**Quién:** Auditor  
**Dónde:** `/auditorias/[id]/ejecucion` → Botón "Finalizar Ejecución"  
**Qué hace:**
1. Cuando termina de registrar todas las observaciones
2. Click en "Finalizar Ejecución"
3. Sistema cambia estado: `EN_EJECUCION` → `EN_REPORTE`
4. Actualiza: `ejecucion_iniciada = true`

**Resultado:**
- Estado: `EN_REPORTE`
- Tab "Informe" aparece disponible

**Tiempo:** Inmediato

---

### **PASO 11: AUDITOR - Crear Informe Borrador** 📄

**Quién:** Auditor  
**Dónde:** `/auditorias/[id]/informe` → Tab "Borrador"  
**Qué hace:**
1. Completa formulario de informe:
   - **Encabezado** (N° de informe, ej: "ASIS-048-2025") *
   - **De** (ej: "Auditoría Interna") *
   - **Para** (destinatarios, múltiples líneas) *
   - **Asunto** *
   - **Fecha del Informe** (fecha de emisión) *
   - **Antecedentes** *
   - **Objetivos** *
   - **Alcance** *
   - Resultados de revisión
   - Metodología aplicada
   - **Selecciona observaciones** a incluir
   - Conclusiones
   - Recomendaciones generales
2. Guarda borrador o envía a revisión

**Resultado:**
- Informe creado en `auditoria_informe`
- Estado: `BORRADOR`
- Observaciones seleccionadas en `observaciones_enumeradas` (JSONB)
- Observaciones actualizadas: `numero_informe`, `fecha_emision_informe`

**Tiempo:** 1-2 horas

---

### **PASO 12: AUDITOR - Enviar Informe a Revisión** 📤

**Quién:** Auditor  
**Dónde:** `/auditorias/[id]/informe` → Tab "Borrador" → "Enviar a Revisión"  
**Qué hace:**
1. Click en "Enviar a Revisión"
2. Sistema valida campos obligatorios
3. Cambia estado: `BORRADOR` → `EN_REVISION`
4. **NOTIFICA AUTOMÁTICAMENTE AL AUDITOR INTERNO** ✅
   - Crea comunicación en `comunicaciones_auditado`
   - Tipo: `NOTIFICACION`
   - Destinatario: Auditor Interno

**Resultado:**
- Estado: `EN_REVISION`
- Tab "Revisión" aparece para Auditor Interno
- Auditor Interno recibe notificación

**Tiempo:** Inmediato

---

### **PASO 13: AUDITOR INTERNO - Revisar Informe** 👁️

**Quién:** Auditor Interno  
**Dónde:** `/auditorias/[id]/informe` → Tab "Revisión"  
**Qué hace:**
1. Ve el informe borrador
2. Revisa contenido, observaciones, formato
3. Tiene 2 opciones:

**Opción A: Aprobar** ✅
- Click en "Aprobar Informe"
- Estado cambia: `EN_REVISION` → `APROBADO`
- `fecha_aprobacion = NOW()`
- `aprobado_por = auditor_interno_id`

**Opción B: Solicitar Correcciones** ❌
- Click en "Solicitar Correcciones"
- Escribe comentarios de corrección
- Estado cambia: `EN_REVISION` → `CON_CORRECCIONES`
- Auditor recibe notificación

**Resultado:**
- Si aprobado → Siguiente paso
- Si correcciones → Auditor corrige y vuelve a enviar

**Tiempo:** 1-3 días (plazo de revisión)

---

### **PASO 14: AUDITOR - Socializar Informe** 🤝

**Quién:** Auditor  
**Dónde:** `/auditorias/[id]/informe` → Tab "Socialización"  
**Requisito:** Informe debe estar `APROBADO`  
**Qué hace:**
1. Selecciona participantes para socialización
2. Click en "Enviar a Auditados"
3. Sistema cambia estado: `APROBADO` → `ENVIADO_A_AUDITADOS`
4. Actualiza: `fecha_socializacion = NOW()`
5. Actualiza observaciones: `fecha_envio_informe = NOW()`

**Resultado:**
- Estado: `ENVIADO_A_AUDITADOS`
- Auditados pueden ver el informe
- Plazo de 3 días hábiles para completar estrategia

**Tiempo:** Inmediato

---

### **PASO 15: AUDITADO - Presentar Descargos (Opcional)** 📝

**Quién:** Auditado  
**Dónde:** `/auditorias/[id]/informe` → Tab "Descargos"  
**Plazo:** 5 días laborables antes del informe final  
**Qué hace:**
1. Selecciona observación
2. Escribe descripción del descargo
3. Sube link de evidencia (Google Drive)
4. Envía descargo

**Resultado:**
- Descargo creado en `observacion_evidencias` (tipo: 'DESCARGO')
- `descripcion_descargos` actualizada en observación
- Auditor recibe notificación

**Tiempo:** 5 días laborables (si aplica)

---

### **PASO 16: AUDITADO - Completar Estrategia y Fechas** 📅

**Quién:** Auditado  
**Dónde:** `/auditorias/[id]/informe` → Tab "Estrategia"  
**Plazo:** 3 días hábiles desde socialización  
**Qué hace:**
1. Completa formulario:
   - **Estrategia de Implementación** *
   - **Fecha de Inicio** *
   - **Fecha de Fin** *
   - **Entregable** *
2. Guarda estrategia

**Qué hace el sistema:**
1. Guarda en `auditoria_informe`
2. **NOTIFICA AL AUDITOR POR CADA OBSERVACIÓN** ✅
   - Crea comunicación en `comunicaciones_auditado` por cada observación
   - Incluye: fechas, estrategia, entregable, observaciones afectadas

**Resultado:**
- Estrategia guardada
- Fechas propagadas a observaciones (trigger automático)
- Auditor recibe notificaciones (una por cada observación)

**Tiempo:** 3 días hábiles (plazo)

---

### **PASO 17: AUDITADO - Reportar Avance Mensual** 📊

**Quién:** Auditado  
**Dónde:** `/auditorias/[id]` → Matriz de Observaciones → Botón "Reportar Avance"  
**Cuándo:** Mensualmente (incluso si fecha final no ha llegado)  
**Qué hace:**
1. Click en botón de reporte de avance (icono TrendingUp)
2. Completa:
   - **Porcentaje de avance** (0-100%) *
   - **Descripción del avance** *
   - Link de evidencia (opcional)
3. Envía reporte

**Qué hace el sistema:**
1. Actualiza: `porcentaje_avance`, `descripcion_avance` en observación
2. Crea evidencia en `observacion_evidencias` (si hay link)
3. **NOTIFICA AL AUDITOR** ✅
   - Crea comunicación con avance reportado

**Resultado:**
- Avance guardado
- Auditor recibe notificación
- Evidencias guardadas

**Tiempo:** Mensual (automático con recordatorios N8N)

---

### **PASO 18: AUDITOR INTERNO - Revisar Descargos y Estrategias** 🔍

**Quién:** Auditor Interno / Auditor  
**Dónde:** `/auditorias/revision-descargos`  
**Qué hace:**
1. Ve todas las observaciones con descargos/evidencias
2. Revisa estrategias, avances, descargos
3. Para cada evidencia/descargo:
   - **Aprobar** → Marca como `aprobada = true`, `revisada = true`
   - **Rechazar** → Marca como `aprobada = false`, escribe comentarios

**Resultado:**
- Descargos/evidencias aprobados o rechazados
- Comentarios guardados
- Auditado recibe notificación si es rechazado

**Tiempo:** Variable (según necesidad)

---

### **PASO 19: AUDITOR - Generar Documento Word** 📄

**Quién:** Auditor  
**Dónde:** `/auditorias/[id]/informe` → Botón "Generar Word"  
**Cuándo:** Cuando informe está completo  
**Qué hace:**
1. Click en "Generar Word"
2. Sistema llama API: `/api/generar-word-informe`
3. API llama webhook N8N: `n8n_workflow_generar_word_MEJORADO.json`

**Qué hace N8N (automático):**
1. Obtiene informe completo de Supabase
2. Genera HTML con formato profesional
3. Convierte a Word (CloudConvert o docx)
4. Sube a Google Drive
5. Actualiza `documento_word_url` en BD

**Resultado:**
- Documento Word generado
- Subido a Google Drive
- URL guardada en BD

**Tiempo:** 1-2 minutos (automático)

---

### **PASO 20: AUDITOR Y AUDITADOS - Firmar Informe** ✍️

**Quién:** Auditor + Auditados  
**Dónde:** `/auditorias/[id]/informe` → Tab "Firmas"  
**Qué hace:**
1. Cada firmante hace click en "Firmar Informe"
2. Sistema crea registro en `informe_firmas`
3. `firmado = true`, `fecha_firma = NOW()`
4. Cuando **TODOS** firman:
   - Estado cambia: `ENVIADO_A_AUDITADOS` → `COMPLETADO`
   - Auditoría cambia: `estado = 'CERRADA'`, `fecha_cierre = NOW()`

**Resultado:**
- Informe firmado electrónicamente
- Auditoría cerrada
- Proceso completo

**Tiempo:** 1-3 días (plazo para firmar)

---

## 📊 FLUJO DE INFORMES Y MATRIZ

### **¿Cuándo se Genera el Informe?**

**Punto 1: Creación del Borrador** (Paso 11)
- Auditor crea informe borrador
- Selecciona observaciones a incluir
- Se guarda en `auditoria_informe`
- Observaciones se actualizan: `numero_informe`, `fecha_emision_informe`

**Punto 2: Envío a Revisión** (Paso 12)
- Auditor envía a revisión
- Estado: `EN_REVISION`
- Auditor Interno recibe notificación

**Punto 3: Aprobación** (Paso 13)
- Auditor Interno aprueba
- Estado: `APROBADO`

**Punto 4: Socialización** (Paso 14)
- Auditor envía a auditados
- Estado: `ENVIADO_A_AUDITADOS`
- Observaciones se actualizan: `fecha_envio_informe`

**Punto 5: Generación de Word** (Paso 19)
- Auditor hace click en "Generar Word"
- N8N genera documento Word
- Sube a Google Drive
- URL guardada en `documento_word_url`

**Punto 6: Firma** (Paso 20)
- Todos firman
- Estado: `COMPLETADO`
- Auditoría: `CERRADA`

---

### **¿Cuándo se Actualiza la Matriz?**

**Actualización Automática (Triggers):**

1. **Cuando informe se completa:**
   - Trigger: `trigger_actualizar_matriz_desde_informe`
   - Se ejecuta cuando informe cambia a `COMPLETADO` o `ENVIADO_A_AUDITADOS`
   - Actualiza observaciones con:
     - `numero_informe`
     - `fecha_emision_informe`
     - `fecha_envio_informe`
     - `estrategia`
     - `entregable`
     - `fecha_inicio`
     - `fecha_fin`
     - `plazo_dias_laborables` (calculado automáticamente)
     - `responsable_estrategia`
     - `responsable_implementacion`

2. **Cuando auditado completa estrategia:**
   - Fechas se propagan a observaciones
   - Matriz se actualiza automáticamente

3. **Cuando auditado reporta avance:**
   - `porcentaje_avance` actualizado
   - `descripcion_avance` actualizado

**Actualización Manual:**
- Auditor puede editar observaciones directamente
- Cambios se reflejan en matriz

**Exportación a Excel:**
- Cualquier momento: Botón "Exportar Excel" en `MatrizObservaciones`
- Genera Excel con todos los 30 campos
- Descarga directa

---

## ⏰ TIEMPOS Y PLAZOS

### **Plazos del Auditado:**

1. **Confirmar participación:** 1-2 días (opcional)
2. **Entregar documentación:** 8 días hábiles desde notificación
3. **Presentar descargos:** 5 días laborables antes del informe final
4. **Completar estrategia:** 3 días hábiles desde socialización
5. **Firmar informe:** 3 días hábiles desde socialización
6. **Reportar avance:** Mensualmente (incluso si fecha final no ha llegado)

### **Plazos del Auditor:**

1. **Completar preparación:** Variable
2. **Ejecutar auditoría:** Según fechas definidas
3. **Crear informe:** 1-2 semanas después de ejecución
4. **Revisar descargos:** Variable

### **Plazos del Auditor Interno:**

1. **Revisar informe:** 1-3 días desde envío
2. **Revisar descargos:** Variable

---

## 🔄 AUTOMATIZACIONES N8N

### **Workflow 1: Notificar Auditados** 📧
**Archivo:** `n8n_workflow_notificar_auditados.json`  
**Cuándo se activa:** Cuando auditor hace click en "Notificar Auditados"  
**Qué hace:**
- Recibe webhook con datos de auditoría
- Genera correo HTML profesional
- Envía correo a cada auditado
- Crea solicitudes de documentación automáticamente (8 días hábiles)
- Actualiza estados en BD

**Configuración:**
- Webhook URL: `/webhook/notificar-auditados`
- Credenciales: Gmail OAuth2
- Variable: `GMAIL_FROM_EMAIL`

---

### **Workflow 2: Recordatorios de Cumplimiento** ⏰
**Archivo:** `n8n_workflow_recordatorios_cumplimiento_MEJORADO.json`  
**Cuándo se activa:** Automático (Cron: Diario a las 9 AM)  
**Qué hace:**
- Consulta observaciones que vencen en 90, 60, 30 días
- Envía correos de recordatorio a responsables
- Colores según urgencia (rojo < 30 días, amarillo < 60 días, azul > 60 días)

**Configuración:**
- Cron: `0 9 * * *` (diario 9 AM)
- Función SQL: `get_observaciones_vencimiento_proximo(90)`
- Credenciales: Gmail OAuth2

---

### **Workflow 3: Recordatorios Fin de Mes** 📅
**Archivo:** `n8n_workflow_recordatorios_fin_mes_MEJORADO.json`  
**Cuándo se activa:** Automático (Cron: Último día hábil del mes a las 9 AM)  
**Qué hace:**
- Verifica si es último día hábil del mes
- Consulta observaciones con fecha fin en ese día
- Envía correos diferenciados:
  - Si es fecha final → Recordatorio urgente (rojo)
  - Si no es fecha final → Solicitud de avance (azul)

**Configuración:**
- Cron: `0 9 28-31 * *` (últimos días del mes)
- Consulta directa a Supabase
- Credenciales: Gmail OAuth2

---

### **Workflow 4: Generar Word** 📄
**Archivo:** `n8n_workflow_generar_word_MEJORADO.json`  
**Cuándo se activa:** Cuando auditor hace click en "Generar Word"  
**Qué hace:**
- Recibe webhook con `informe_id`
- Obtiene informe completo de Supabase
- Genera HTML con formato profesional
- Convierte a Word (CloudConvert o docx)
- Sube a Google Drive
- Actualiza `documento_word_url` en BD

**Configuración:**
- Webhook URL: `/webhook/generar-word-informe`
- Credenciales: Google Drive OAuth2
- Variable: `CLOUDCONVERT_API_KEY` (opcional)
- Carpeta Drive: `1QHoiXg2FMGy36OS3tfstLllhWDLvWbSL`

---

## 📋 RESUMEN DE WORKFLOWS N8N

### **✅ USAR ESTOS 4:**

1. ✅ `n8n_workflow_notificar_auditados.json`
   - **Cuándo:** Click en "Notificar Auditados"
   - **Función:** Enviar correos y crear solicitudes

2. ✅ `n8n_workflow_recordatorios_cumplimiento_MEJORADO.json`
   - **Cuándo:** Diario 9 AM (automático)
   - **Función:** Recordatorios 90/60/30 días antes

3. ✅ `n8n_workflow_recordatorios_fin_mes_MEJORADO.json`
   - **Cuándo:** Último día hábil del mes (automático)
   - **Función:** Recordatorios fin de mes

4. ✅ `n8n_workflow_generar_word_MEJORADO.json`
   - **Cuándo:** Click en "Generar Word"
   - **Función:** Generar documento Word

### **❌ BORRAR ESTOS (VERSIONES ANTIGUAS):**

1. ❌ `n8n_workflow_recordatorios_cumplimiento.json` (reemplazado)
2. ❌ `n8n_workflow_recordatorios_fin_mes.json` (reemplazado)
3. ❌ `n8n_workflow_generar_word_y_matriz.json` (reemplazado)

### **⚠️ VERIFICAR:**

1. ⚠️ `n8n_workflow_notificaciones_mensuales.json`
   - Parece ser para notificar a auditores sobre actividades del mes
   - No relacionado con observaciones
   - **Decisión:** Si no se usa, borrar

---

## 🎯 SECUENCIA COMPLETA VISUAL

```
1. AUDITOR INTERNO
   └─> Crea Plan → Crea Actividades → Asigna Auditor
   
2. AUDITOR
   └─> Crea Auditoría desde Actividad
   └─> Completa Preparación (objetivo, alcance, criterios)
   └─> Agrega Auditados
   └─> Click "Notificar Auditados"
       └─> [N8N] Envía correos + Crea solicitudes (8 días)
   
3. AUDITADO
   └─> Recibe correo
   └─> Entra al sistema
   └─> Entrega documentación (8 días hábiles)
   
4. AUDITOR
   └─> Click "Iniciar Ejecución"
   └─> Registra Observaciones
   └─> Click "Finalizar Ejecución"
   
5. AUDITOR
   └─> Crea Informe Borrador
   └─> Selecciona observaciones
   └─> Click "Enviar a Revisión"
       └─> [SISTEMA] Notifica Auditor Interno
   
6. AUDITOR INTERNO
   └─> Revisa Informe
   └─> Aprobar o Solicitar Correcciones
   
7. AUDITOR
   └─> Click "Enviar a Auditados"
   └─> Estado: ENVIADO_A_AUDITADOS
   
8. AUDITADO
   └─> Presenta Descargos (5 días, opcional)
   └─> Completa Estrategia y Fechas (3 días hábiles)
       └─> [SISTEMA] Notifica Auditor (por cada observación)
   └─> Reporta Avance Mensual
       └─> [SISTEMA] Notifica Auditor
   
9. AUDITOR INTERNO
   └─> Revisa Descargos y Estrategias
   └─> Aprueba o Rechaza
   
10. AUDITOR
    └─> Click "Generar Word"
        └─> [N8N] Genera Word → Sube a Drive
    
11. AUDITOR + AUDITADOS
    └─> Firman Informe
    └─> Cuando todos firman → COMPLETADO → CERRADA
```

---

## 📊 CUANDO SE GENERAN ARCHIVOS

### **Excel (Matriz):**
- **Cuándo:** Cualquier momento
- **Cómo:** Botón "Exportar Excel" en `MatrizObservaciones`
- **Qué incluye:** Todos los 30 campos de la matriz
- **Dónde:** Descarga directa del navegador

### **Word (Informe):**
- **Cuándo:** Cuando auditor hace click en "Generar Word"
- **Cómo:** Workflow N8N automático
- **Qué incluye:** Todo el contenido del informe según `informe.markdown`
- **Dónde:** Google Drive (carpeta específica)
- **URL:** Guardada en `documento_word_url`

---

## 🔄 AUTOMATIZACIONES MENSUALES

### **Recordatorios de Cumplimiento:**
- **Cuándo:** Diario a las 9 AM
- **Qué hace:** Envía recordatorios a observaciones que vencen en 90/60/30 días
- **Workflow:** `n8n_workflow_recordatorios_cumplimiento_MEJORADO.json`

### **Recordatorios Fin de Mes:**
- **Cuándo:** Último día hábil del mes a las 9 AM
- **Qué hace:** Solicita avances o recuerda fechas finales
- **Workflow:** `n8n_workflow_recordatorios_fin_mes_MEJORADO.json`

---

**Última actualización:** 2025-01-08
