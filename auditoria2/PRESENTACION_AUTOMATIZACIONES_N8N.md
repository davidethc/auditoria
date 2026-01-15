# 🚀 AUTOMATIZACIONES N8N - PRESENTACIÓN EJECUTIVA

## 📊 RESUMEN

**Total de automatizaciones:** 8 workflows obligatorios + 1 opcional  
**Tipo:** Webhooks (5) + Recordatorios automáticos (3) + Generación documentos (1)

---

## ✅ WORKFLOWS A EXPORTAR A N8N (8 OBLIGATORIOS)

### **1. Notificar Auditados - Inicio de Auditoría** 📧
**Archivo:** `n8n_workflow_notificar_auditados.json`

**Cuándo:** Auditor hace clic en "Notificar Auditados"  
**Qué hace:**
- ✅ Envía correo a cada auditado con objetivo, alcance, criterios, fechas
- ✅ Crea solicitudes de documentación automáticamente (8 días hábiles)
- ✅ Actualiza estados en BD

**URL Webhook:** `/webhook/notificar-auditados`  
**Variable ENV:** `NEXT_PUBLIC_N8N_WEBHOOK_URL`

---

### **2. Notificar Auditado - Nueva Observación** 📋
**Archivo:** `n8n_workflow_notificar_auditado_observacion.json`

**Cuándo:** Auditor crea nueva observación con responsable asignado  
**Qué hace:**
- ✅ Envía correo al auditado responsable con detalles completos de la observación
- ✅ Incluye: número, título, descripción, recomendación, riesgo

**URL Webhook:** `/webhook/notificar-auditado-observacion`  
**Variable ENV:** `NEXT_PUBLIC_N8N_WEBHOOK_URL_NOTIFICAR_OBSERVACION`

---

### **3. Confirmar Fechas Asignadas al Auditado** ✅ ⭐ **IMPORTANTE**
**Archivo:** `n8n_workflow_notificar_auditado_fechas_asignadas.json`

**Cuándo:** Auditado completa estrategia y asigna fechas de implementación  
**Qué hace:**
- ✅ **Envía correo de confirmación al auditado** con las fechas que asignó
- ✅ Incluye: **fecha inicio**, **fecha fin**, duración, estrategia, entregable
- ✅ **CUMPLE REQUISITO DEL PROFESOR:** El auditado recibe correo con sus fechas

**URL Webhook:** `/webhook/notificar-auditado-fechas-asignadas`  
**Variable ENV:** `NEXT_PUBLIC_N8N_WEBHOOK_URL_NOTIFICAR_AUDITADO_FECHAS`

---

### **4. Notificar Auditor - Fechas Asignadas** 📅
**Archivo:** `n8n_workflow_notificar_auditor_fechas_implementacion.json`

**Cuándo:** Auditado asigna fechas (informar al auditor para seguimiento)  
**Qué hace:**
- ✅ Envía correo al auditor informándole que el auditado asignó fechas
- ✅ Para seguimiento y control

**URL Webhook:** `/webhook/notificar-auditor-fechas-implementacion`  
**Variable ENV:** `NEXT_PUBLIC_N8N_WEBHOOK_URL_NOTIFICAR_FECHAS_IMPLEMENTACION`

---

### **5. Notificar Auditor Interno - Informe para Revisar** 📄 ⭐
**Archivo:** `n8n_workflow_notificar_auditor_interno_informe.json`

**Cuándo:** Auditor envía informe a revisión (botón "Enviar a Revisión")  
**Qué hace:**
- ✅ Envía correo al auditor interno con todos los datos del informe
- ✅ **CUMPLE REQUISITO DEL PROFESOR:** Notificar auditor interno cuando informe está listo

**URL Webhook:** `/webhook/notificar-auditor-interno-informe`  
**Variable ENV:** `NEXT_PUBLIC_N8N_WEBHOOK_URL_NOTIFICAR_AUDITOR_INTERNO`

---

### **6. Notificar Auditor - Actividad Asignada** 📋
**Archivo:** `n8n_workflow_notificar_auditor_actividad.json`

**Cuándo:** Auditor interno hace clic en "Notificar por Correo" en tabla de actividades  
**Qué hace:**
- ✅ Envía correo al auditor asignado sobre la actividad
- ✅ Diferencia entre actividad nueva o validada

**URL Webhook:** `/webhook/notificar-auditor-actividad`  
**Variable ENV:** `NEXT_PUBLIC_N8N_WEBHOOK_URL_NOTIFICAR_AUDITOR_ACTIVIDAD`

---

### **7. Recordatorios de Cumplimiento (90/60/30 días)** ⏰
**Archivo:** `n8n_workflow_recordatorios_cumplimiento_MEJORADO.json`

**Cuándo:** Automático (Cron: Diario 9 AM)  
**Cron:** `0 9 * * *`  
**Qué hace:**
- ✅ Consulta observaciones que vencen en 90, 60, 30 días
- ✅ Envía correos de recordatorio con colores según urgencia
- ✅ Rojo < 30 días, Amarillo < 60 días, Azul > 60 días

**Requiere:** Función SQL `get_observaciones_vencimiento_proximo(90)` en Supabase

---

### **8. Recordatorios Fin de Mes** 📅
**Archivo:** `n8n_workflow_recordatorios_fin_mes_MEJORADO.json`

**Cuándo:** Automático (Último día hábil del mes 9 AM)  
**Cron:** `0 9 28-31 * *`  
**Qué hace:**
- ✅ Verifica si es último día hábil
- ✅ Envía recordatorio urgente si es fecha final (rojo)
- ✅ Solicita avance mensual si no es fecha final (azul)

---

### **9. Generar Word - Informe** 📄
**Archivo:** `n8n_workflow_generar_word_MEJORADO.json`

**Cuándo:** Auditor hace clic en "Generar Word"  
**Qué hace:**
- ✅ Genera documento Word del informe completo
- ✅ Sube a Google Drive automáticamente
- ✅ Actualiza URL en BD

**URL Webhook:** `/webhook/generar-word-informe`  
**Variable ENV:** `NEXT_PUBLIC_N8N_WEBHOOK_URL_GENERAR_WORD`

---

## ⚠️ WORKFLOW OPCIONAL (Verificar si se necesita)

### **10. Notificaciones Mensuales - Actividades** 📅
**Archivo:** `n8n_workflow_notificaciones_mensuales.json`

**Cuándo:** Automático (Día 1 de cada mes 8 AM)  
**Cron:** `0 8 1 * *`  
**Qué hace:**
- Notifica a auditores sobre actividades que inician ese mes

**Decisión:** Si NO se usa, borrarlo

---

## ✅ VERIFICACIÓN DE REQUISITOS DEL PROFESOR

### **1. CADA OBSERVACION SE NOTIFIQUE CON FECHA DE INICIO Y DE FIN** ✅
- ✅ **Workflow:** `n8n_workflow_notificar_auditado_fechas_asignadas.json` (#3)
- ✅ **El auditado recibe correo** con fecha inicio y fecha fin que asignó
- ✅ **CUMPLE:** Correo incluye ambas fechas destacadas

### **2. AUDITOR INTERNO RECIBE NOTIFICACION QUE TIENE Q REVISAR INFORME** ✅
- ✅ **Workflow:** `n8n_workflow_notificar_auditor_interno_informe.json` (#5)
- ✅ **Se activa cuando:** Auditor envía informe a revisión
- ✅ **CUMPLE:** Correo automático al auditor interno

### **3. AUDITADO PUEDE SOLICITAR CORRECCIONES** ✅
- ✅ **Implementado:** `SolicitarCorreccionObservacion.tsx`
- ✅ **Redacción corregida:** "solicitar al auditor" (clarificado)
- ✅ **CUMPLE:** El auditado solicita, el auditor decide

### **4. AUDITADO TIENE ACCESO AL HISTORIAL** ✅
- ✅ **Página:** `/auditorias/historial-hallazgos`
- ✅ **Visible en Sidebar:** Solo para auditados
- ✅ **CUMPLE:** Muestra todas sus observaciones

---

## 🔧 CONFIGURACIÓN PASO A PASO

### **PASO 1: Importar Workflows en N8N**

1. Abre N8N: `http://localhost:5678`
2. Ve a **"Workflows"** → **"Import from File"**
3. Importa cada uno de estos 8 workflows (en este orden):
   - `n8n_workflow_notificar_auditados.json`
   - `n8n_workflow_notificar_auditado_observacion.json`
   - `n8n_workflow_notificar_auditado_fechas_asignadas.json` ⭐
   - `n8n_workflow_notificar_auditor_fechas_implementacion.json`
   - `n8n_workflow_notificar_auditor_interno_informe.json` ⭐
   - `n8n_workflow_notificar_auditor_actividad.json`
   - `n8n_workflow_recordatorios_cumplimiento_MEJORADO.json`
   - `n8n_workflow_recordatorios_fin_mes_MEJORADO.json`
   - `n8n_workflow_generar_word_MEJORADO.json`

---

### **PASO 2: Configurar Credenciales Gmail OAuth2**

**Para CADA workflow que tenga nodo "Gmail - Enviar Correo" (todos):**

1. Haz clic en el nodo **"Gmail - Enviar Correo"** (el que tiene icono rojo)
2. En **"Credential to connect with"** → **"Create New"**
3. Selecciona **"Gmail OAuth2"**
4. Haz clic en **"Connect my account"**
5. Autoriza con tu cuenta de Google
6. Guarda las credenciales
7. **Verifica:** El icono rojo debe desaparecer ✅
8. Repite para cada workflow

---

### **PASO 3: Activar Workflows y Obtener URLs**

**Para CADA workflow:**

1. Haz clic en **"Save"** (esquina superior derecha)
2. Activa el workflow (toggle **"Active"** en parte superior)
3. Haz clic en el nodo **"Webhook"**
4. **Copia la URL** que aparece arriba del nodo
   - Ejemplo: `http://localhost:5678/webhook-test/notificar-auditados`
5. **Guarda esta URL** para el siguiente paso

---

### **PASO 4: Configurar Variables de Entorno**

**Agrega a `.env.local`:**

```bash
# Workflows Webhook
NEXT_PUBLIC_N8N_WEBHOOK_URL=http://localhost:5678/webhook-test/notificar-auditados
NEXT_PUBLIC_N8N_WEBHOOK_URL_NOTIFICAR_OBSERVACION=http://localhost:5678/webhook-test/notificar-auditado-observacion
NEXT_PUBLIC_N8N_WEBHOOK_URL_NOTIFICAR_AUDITADO_FECHAS=http://localhost:5678/webhook-test/notificar-auditado-fechas-asignadas
NEXT_PUBLIC_N8N_WEBHOOK_URL_NOTIFICAR_FECHAS_IMPLEMENTACION=http://localhost:5678/webhook-test/notificar-auditor-fechas-implementacion
NEXT_PUBLIC_N8N_WEBHOOK_URL_NOTIFICAR_AUDITOR_INTERNO=http://localhost:5678/webhook-test/notificar-auditor-interno-informe
NEXT_PUBLIC_N8N_WEBHOOK_URL_NOTIFICAR_AUDITOR_ACTIVIDAD=http://localhost:5678/webhook-test/notificar-auditor-actividad
NEXT_PUBLIC_N8N_WEBHOOK_URL_GENERAR_WORD=http://localhost:5678/webhook-test/generar-word-informe
```

**⚠️ IMPORTANTE:** Reemplaza las URLs con las URLs reales que copiaste de N8N

---

## 📋 TABLA RESUMEN - QUÉ HACE CADA AUTOMATIZACIÓN

| # | Nombre | Archivo | Activación | Destinatario | Función |
|---|--------|---------|------------|--------------|---------|
| 1 | Notificar Auditados | `notificar_auditados.json` | Click botón | Auditados | Correo inicial + Solicitudes (8 días) |
| 2 | Notificar Observación | `notificar_auditado_observacion.json` | Crear observación | Auditado responsable | Correo con detalles de observación |
| 3 | Confirmar Fechas ⭐ | `notificar_auditado_fechas_asignadas.json` | Asignar fechas | **Auditado** | **Correo confirmación con fechas** |
| 4 | Notificar Auditor Fechas | `notificar_auditor_fechas_implementacion.json` | Asignar fechas | Auditor | Correo informando fechas asignadas |
| 5 | Notificar Auditor Interno ⭐ | `notificar_auditor_interno_informe.json` | Enviar a revisión | **Auditor Interno** | **Correo con informe para revisar** |
| 6 | Notificar Actividad | `notificar_auditor_actividad.json` | Click botón | Auditor asignado | Correo sobre actividad |
| 7 | Recordatorios Cumplimiento | `recordatorios_cumplimiento_MEJORADO.json` | Diario 9 AM | Responsables | Recordatorios 90/60/30 días |
| 8 | Recordatorios Fin Mes | `recordatorios_fin_mes_MEJORADO.json` | Fin de mes 9 AM | Responsables | Recordatorios o solicitud avance |
| 9 | Generar Word | `generar_word_MEJORADO.json` | Click botón | Sistema | Genera Word → Sube Drive |

---

## 🎯 FLUJO COMPLETO CON AUTOMATIZACIONES

```
1. AUDITOR INTERNO
   └─> Crea Plan → Crea Actividades → Asigna Auditor
   └─> Click "Notificar por Correo" 
       └─> [N8N #6] Envía correo al auditor ✅

2. AUDITOR
   └─> Crea Auditoría
   └─> Completa Preparación
   └─> Agrega Auditados
   └─> Click "Notificar Auditados"
       └─> [N8N #1] Envía correos a auditados + Crea solicitudes (8 días) ✅

3. AUDITADO
   └─> Recibe correo de notificación ✅
   └─> Entrega documentación (8 días)

4. AUDITOR
   └─> Inicia Ejecución
   └─> Crea Observación con responsable asignado
       └─> [N8N #2] Envía correo al auditado responsable ✅

5. AUDITADO
   └─> Recibe correo de nueva observación ✅
   └─> Ve observación en sistema

6. AUDITOR
   └─> Crea Informe Borrador
   └─> Click "Enviar a Revisión"
       └─> [N8N #5] Envía correo al auditor interno ✅ ⭐

7. AUDITADO
   └─> Completa Estrategia y asigna Fechas
       └─> [N8N #3] Recibe correo de confirmación con sus fechas ✅ ⭐
       └─> [N8N #4] Auditor también recibe notificación ✅

8. AUTOMÁTICO (N8N)
   └─> [N8N #7] Recordatorios diarios (90/60/30 días antes) ✅
   └─> [N8N #8] Recordatorios fin de mes ✅

9. AUDITOR
   └─> Click "Generar Word"
       └─> [N8N #9] Genera Word → Sube a Drive ✅
```

---

## ✅ CHECKLIST ANTES DE PRESENTAR

- [ ] 8 workflows importados en N8N
- [ ] Credenciales Gmail OAuth2 configuradas en cada workflow
- [ ] URLs de webhooks copiadas de N8N
- [ ] Variables de entorno actualizadas en `.env.local`
- [ ] Todos los workflows activados (toggle "Active")
- [ ] Probar cada workflow manualmente
- [ ] Verificar que correos lleguen correctamente

---

**TODO LISTO PARA PRESENTAR** ✅

**Tiempo estimado de configuración:** 15-20 minutos  
**Documentos creados:**
- ✅ `WORKFLOWS_N8N_DEFINITIVOS_PARA_EXPORTAR.md` (detallado)
- ✅ `GUIA_COMPLETA_AUTOMATIZACIONES_N8N.md` (técnico)
- ✅ `PRESENTACION_AUTOMATIZACIONES_N8N.md` (ejecutivo - ESTE)
