# 📋 WORKFLOWS N8N DEFINITIVOS - PARA EXPORTAR

## ✅ WORKFLOWS QUE DEBES EXPORTAR A N8N (8 TOTAL)

### **1. Notificar Auditados - Auditoría Creada** 📧
**Archivo:** `n8n_workflow_notificar_auditados.json`  
**Webhook:** `/webhook/notificar-auditados`  
**Variable ENV:** `NEXT_PUBLIC_N8N_WEBHOOK_URL`

**Cuándo se activa:**
- Auditor hace clic en "Notificar Auditados" en `/auditorias/[id]`

**Qué hace:**
- Envía correo a cada auditado con: objetivo, alcance, criterios, fechas
- Crea solicitudes de documentación automáticamente (8 días hábiles)
- Actualiza estados en BD

**Componente:** `components/BotonNotificar.tsx`  
**API Route:** Se llama directamente desde componente

---

### **2. Notificar Auditado - Nueva Observación** 📋
**Archivo:** `n8n_workflow_notificar_auditado_observacion.json`  
**Webhook:** `/webhook/notificar-auditado-observacion`  
**Variable ENV:** `NEXT_PUBLIC_N8N_WEBHOOK_URL_NOTIFICAR_OBSERVACION`

**Cuándo se activa:**
- Auditor crea nueva observación con responsable de implementación asignado

**Qué hace:**
- Envía correo al auditado responsable con todos los detalles de la observación
- Incluye: número, título, descripción, recomendación, riesgo

**Componente:** `components/FormularioObservacion.tsx`  
**API Route:** `/api/notificar-auditado-observacion`

---

### **3. Notificar Auditado - Confirmación Fechas Asignadas** ✅
**Archivo:** `n8n_workflow_notificar_auditado_fechas_asignadas.json`  
**Webhook:** `/webhook/notificar-auditado-fechas-asignadas`  
**Variable ENV:** `NEXT_PUBLIC_N8N_WEBHOOK_URL_NOTIFICAR_AUDITADO_FECHAS`

**Cuándo se activa:**
- Auditado completa estrategia y asigna fechas de implementación

**Qué hace:**
- **Envía correo de confirmación al auditado** con las fechas que asignó
- Incluye: fecha inicio, fecha fin, duración, estrategia, entregable
- **IMPORTANTE:** Este es el correo que debe recibir el auditado según el profesor

**Componente:** `components/EstrategiaForm.tsx`  
**API Route:** `/api/notificar-auditado-fechas-asignadas`

---

### **4. Notificar Auditor - Fechas Asignadas por Auditado** 📅
**Archivo:** `n8n_workflow_notificar_auditor_fechas_implementacion.json`  
**Webhook:** `/webhook/notificar-auditor-fechas-implementacion`  
**Variable ENV:** `NEXT_PUBLIC_N8N_WEBHOOK_URL_NOTIFICAR_FECHAS_IMPLEMENTACION`

**Cuándo se activa:**
- Auditado asigna fechas de implementación (el auditor necesita saberlo también)

**Qué hace:**
- Envía correo al auditor responsable informándole que el auditado asignó fechas
- Incluye todas las fechas y estrategia para seguimiento

**Componente:** `components/EstrategiaForm.tsx`  
**API Route:** `/api/notificar-auditor-fechas-implementacion`

---

### **5. Notificar Auditor Interno - Informe para Revisar** 📄
**Archivo:** `n8n_workflow_notificar_auditor_interno_informe.json`  
**Webhook:** `/webhook/notificar-auditor-interno-informe`  
**Variable ENV:** `NEXT_PUBLIC_N8N_WEBHOOK_URL_NOTIFICAR_AUDITOR_INTERNO`

**Cuándo se activa:**
- Auditor hace clic en "Enviar a Revisión" en el informe borrador

**Qué hace:**
- Envía correo al auditor interno con todos los datos del informe
- Incluye: encabezado, asunto, de, para, fecha, link para revisar

**Componente:** `components/FormularioInformeBorrador.tsx`  
**API Route:** `/api/notificar-auditor-interno-informe`

---

### **6. Notificar Auditor - Actividad Asignada/Validada** 📋
**Archivo:** `n8n_workflow_notificar_auditor_actividad.json`  
**Webhook:** `/webhook/notificar-auditor-actividad`  
**Variable ENV:** `NEXT_PUBLIC_N8N_WEBHOOK_URL_NOTIFICAR_AUDITOR_ACTIVIDAD`

**Cuándo se activa:**
- Auditor interno hace clic en "Notificar por Correo" en tabla de actividades

**Qué hace:**
- Envía correo al auditor asignado informándole sobre la actividad
- Diferencia entre actividad nueva o validada como cumplida

**Componente:** `components/SelectValidacion.tsx`  
**API Route:** `/api/notificar-auditor-actividad`

---

### **7. Recordatorios de Cumplimiento (90/60/30 días antes)** ⏰
**Archivo:** `n8n_workflow_recordatorios_cumplimiento_MEJORADO.json`  
**Trigger:** Automático (Cron: Diario 9 AM)  
**Cron:** `0 9 * * *`

**Cuándo se activa:**
- Automáticamente todos los días a las 9 AM

**Qué hace:**
- Consulta observaciones que vencen en 90, 60, 30 días
- Envía correos de recordatorio con colores según urgencia
- Rojo < 30 días, Amarillo < 60 días, Azul > 60 días

**Requiere:** Función SQL `get_observaciones_vencimiento_proximo(90)` en Supabase

---

### **8. Recordatorios Fin de Mes** 📅
**Archivo:** `n8n_workflow_recordatorios_fin_mes_MEJORADO.json`  
**Trigger:** Automático (Cron: Último día hábil del mes 9 AM)  
**Cron:** `0 9 28-31 * *`

**Cuándo se activa:**
- Automáticamente el último día hábil del mes a las 9 AM

**Qué hace:**
- Verifica si es último día hábil
- Consulta observaciones con fecha fin en ese día
- Envía recordatorio urgente (rojo) si es fecha final
- Solicita avance mensual (azul) si no es fecha final

---

### **9. Generar Word - Informe** 📄
**Archivo:** `n8n_workflow_generar_word_MEJORADO.json`  
**Webhook:** `/webhook/generar-word-informe`  
**Variable ENV:** `NEXT_PUBLIC_N8N_WEBHOOK_URL_GENERAR_WORD`

**Cuándo se activa:**
- Auditor hace clic en "Generar Word" en `/auditorias/[id]/informe`

**Qué hace:**
- Obtiene informe completo de Supabase
- Genera HTML con formato profesional según `informe.markdown`
- Convierte a Word (CloudConvert o docx)
- Sube a Google Drive
- Actualiza `documento_word_url` en BD

**Componente:** `app/auditorias/[id]/informe/page.tsx`  
**API Route:** `/api/generar-word-informe`

---

## ⚠️ WORKFLOW OPCIONAL (Verificar si se necesita)

### **10. Notificaciones Mensuales - Actividades del Plan** 📅
**Archivo:** `n8n_workflow_notificaciones_mensuales.json`  
**Trigger:** Automático (Cron: Día 1 de cada mes 8 AM)  
**Cron:** `0 8 1 * *`

**Cuándo se activa:**
- Automáticamente el día 1 de cada mes a las 8 AM

**Qué hace:**
- Notifica a auditores sobre actividades que inician ese mes
- Consulta función SQL `get_monthly_activities_notifications`

**Decisión:** Si NO se usa, puedes borrarlo

---

## ❌ WORKFLOWS ELIMINADOS (Versiones Antiguas)

1. ❌ `n8n_workflow_recordatorios_cumplimiento.json` → Reemplazado por MEJORADO
2. ❌ `n8n_workflow_recordatorios_fin_mes.json` → Reemplazado por MEJORADO
3. ❌ `n8n_workflow_generar_word_y_matriz.json` → Reemplazado por MEJORADO
4. ❌ `Notificaciones Mensuales Auditoría.json` → Duplicado

---

## 📊 RESUMEN

**Total workflows para exportar:** 8 (obligatorios) + 1 (opcional) = **9**

| # | Workflow | Tipo | Activación |
|---|----------|------|------------|
| 1 | `notificar_auditados.json` | Webhook | Click en botón |
| 2 | `notificar_auditado_observacion.json` | Webhook | Crear observación |
| 3 | `notificar_auditado_fechas_asignadas.json` | Webhook | Asignar fechas |
| 4 | `notificar_auditor_fechas_implementacion.json` | Webhook | Asignar fechas |
| 5 | `notificar_auditor_interno_informe.json` | Webhook | Enviar a revisión |
| 6 | `notificar_auditor_actividad.json` | Webhook | Click en botón |
| 7 | `recordatorios_cumplimiento_MEJORADO.json` | Cron | Diario 9 AM |
| 8 | `recordatorios_fin_mes_MEJORADO.json` | Cron | Fin de mes |
| 9 | `generar_word_MEJORADO.json` | Webhook | Click en botón |
| 10 | `notificaciones_mensuales.json` | Cron | Día 1 del mes |

---

## 🔧 CONFIGURACIÓN COMPLETA

### **Variables de Entorno (.env.local):**

```bash
# Workflows Webhook (llamados desde el sistema)
NEXT_PUBLIC_N8N_WEBHOOK_URL=http://localhost:5678/webhook-test/notificar-auditados
NEXT_PUBLIC_N8N_WEBHOOK_URL_NOTIFICAR_OBSERVACION=http://localhost:5678/webhook-test/notificar-auditado-observacion
NEXT_PUBLIC_N8N_WEBHOOK_URL_NOTIFICAR_AUDITADO_FECHAS=http://localhost:5678/webhook-test/notificar-auditado-fechas-asignadas
NEXT_PUBLIC_N8N_WEBHOOK_URL_NOTIFICAR_FECHAS_IMPLEMENTACION=http://localhost:5678/webhook-test/notificar-auditor-fechas-implementacion
NEXT_PUBLIC_N8N_WEBHOOK_URL_NOTIFICAR_AUDITOR_INTERNO=http://localhost:5678/webhook-test/notificar-auditor-interno-informe
NEXT_PUBLIC_N8N_WEBHOOK_URL_NOTIFICAR_AUDITOR_ACTIVIDAD=http://localhost:5678/webhook-test/notificar-auditor-actividad
NEXT_PUBLIC_N8N_WEBHOOK_URL_GENERAR_WORD=http://localhost:5678/webhook-test/generar-word-informe
```

---

## ✅ PASOS PARA EXPORTAR A N8N

### **Paso 1: Importar Workflows**
1. Abre N8N
2. Workflows → Import from File
3. Importa cada uno de los 8-9 workflows JSON

### **Paso 2: Configurar Credenciales**
Para cada workflow que tenga nodo Gmail:
1. Click en nodo "Gmail - Enviar Correo"
2. "Credential to connect with" → "Create New"
3. Selecciona "Gmail OAuth2"
4. Autoriza con Google
5. Guarda credenciales

### **Paso 3: Configurar URLs de Webhook**
1. Activa cada workflow (toggle "Active")
2. Copia la URL del webhook (aparece arriba del nodo webhook)
3. Actualiza `.env.local` con las URLs correctas

### **Paso 4: Activar Workflows con Cron**
Para `recordatorios_cumplimiento_MEJORADO.json` y `recordatorios_fin_mes_MEJORADO.json`:
1. El cron ya está configurado en el workflow
2. Solo activa el workflow (toggle "Active")
3. Verifica que el Schedule Trigger esté activo

---

## 📋 CHECKLIST ANTES DE PRESENTAR

- [ ] 8 workflows obligatorios importados en N8N
- [ ] Credenciales Gmail OAuth2 configuradas en cada workflow
- [ ] URLs de webhooks copiadas y actualizadas en `.env.local`
- [ ] Workflows activados (toggle "Active")
- [ ] Verificar que el workflow de notificaciones_mensuales es necesario o borrarlo
- [ ] Probar cada workflow manualmente

---

**Última actualización:** 2025-01-08
