# 🚀 GUÍA COMPLETA: AUTOMATIZACIONES N8N DEFINITIVAS

## 📋 RESUMEN EJECUTIVO

**Total de automatizaciones:** 8 workflows obligatorios + 1 opcional  
**Tipo:** Webhooks (5) + Cron/Schedule (3) + Opcional (1)

---

## ✅ WORKFLOWS OBLIGATORIOS (8)

### **1. Notificar Auditados - Inicio de Auditoría** 📧
**Archivo:** `n8n_workflow_notificar_auditados.json`

**Cuándo:** Auditor hace clic en "Notificar Auditados"  
**Qué hace:** 
- Envía correo a cada auditado con objetivo, alcance, criterios, fechas
- Crea solicitudes de documentación (8 días hábiles)

**URL Webhook:** `/webhook/notificar-auditados`  
**Variable ENV:** `NEXT_PUBLIC_N8N_WEBHOOK_URL`  
**Componente:** `components/BotonNotificar.tsx`

---

### **2. Notificar Auditado - Nueva Observación** 📋
**Archivo:** `n8n_workflow_notificar_auditado_observacion.json`

**Cuándo:** Auditor crea nueva observación con responsable asignado  
**Qué hace:**
- Envía correo al auditado responsable con detalles de la observación

**URL Webhook:** `/webhook/notificar-auditado-observacion`  
**Variable ENV:** `NEXT_PUBLIC_N8N_WEBHOOK_URL_NOTIFICAR_OBSERVACION`  
**API Route:** `/api/notificar-auditado-observacion`  
**Componente:** `components/FormularioObservacion.tsx`

---

### **3. Confirmar Fechas Asignadas al Auditado** ✅ ⭐
**Archivo:** `n8n_workflow_notificar_auditado_fechas_asignadas.json`

**Cuándo:** Auditado completa estrategia y asigna fechas  
**Qué hace:**
- **Envía correo de confirmación al auditado** con las fechas que asignó
- Incluye: fecha inicio, fecha fin, duración, estrategia, entregable
- **ESTO ES LO QUE PIDE EL PROFESOR:** El auditado recibe correo con sus fechas

**URL Webhook:** `/webhook/notificar-auditado-fechas-asignadas`  
**Variable ENV:** `NEXT_PUBLIC_N8N_WEBHOOK_URL_NOTIFICAR_AUDITADO_FECHAS`  
**API Route:** `/api/notificar-auditado-fechas-asignadas`  
**Componente:** `components/EstrategiaForm.tsx`

---

### **4. Notificar Auditor - Fechas Asignadas** 📅
**Archivo:** `n8n_workflow_notificar_auditor_fechas_implementacion.json`

**Cuándo:** Auditado asigna fechas (informar al auditor)  
**Qué hace:**
- Envía correo al auditor informándole que el auditado asignó fechas
- Para seguimiento y control

**URL Webhook:** `/webhook/notificar-auditor-fechas-implementacion`  
**Variable ENV:** `NEXT_PUBLIC_N8N_WEBHOOK_URL_NOTIFICAR_FECHAS_IMPLEMENTACION`  
**API Route:** `/api/notificar-auditor-fechas-implementacion`  
**Componente:** `components/EstrategiaForm.tsx`

---

### **5. Notificar Auditor Interno - Informe para Revisar** 📄
**Archivo:** `n8n_workflow_notificar_auditor_interno_informe.json`

**Cuándo:** Auditor envía informe a revisión (botón "Enviar a Revisión")  
**Qué hace:**
- Envía correo al auditor interno con todos los datos del informe
- **CUMPLE PUNTO DEL PROFESOR:** Notificar auditor interno cuando informe está listo

**URL Webhook:** `/webhook/notificar-auditor-interno-informe`  
**Variable ENV:** `NEXT_PUBLIC_N8N_WEBHOOK_URL_NOTIFICAR_AUDITOR_INTERNO`  
**API Route:** `/api/notificar-auditor-interno-informe`  
**Componente:** `components/FormularioInformeBorrador.tsx`

---

### **6. Notificar Auditor - Actividad Asignada** 📋
**Archivo:** `n8n_workflow_notificar_auditor_actividad.json`

**Cuándo:** Auditor interno hace clic en "Notificar por Correo" en tabla de actividades  
**Qué hace:**
- Envía correo al auditor asignado sobre la actividad
- Diferencia entre actividad nueva o validada

**URL Webhook:** `/webhook/notificar-auditor-actividad`  
**Variable ENV:** `NEXT_PUBLIC_N8N_WEBHOOK_URL_NOTIFICAR_AUDITOR_ACTIVIDAD`  
**API Route:** `/api/notificar-auditor-actividad`  
**Componente:** `components/SelectValidacion.tsx`

---

### **7. Recordatorios de Cumplimiento (90/60/30 días)** ⏰
**Archivo:** `n8n_workflow_recordatorios_cumplimiento_MEJORADO.json`

**Cuándo:** Automático (Cron: Diario 9 AM)  
**Cron:** `0 9 * * *`  
**Qué hace:**
- Consulta observaciones que vencen en 90, 60, 30 días
- Envía correos de recordatorio según urgencia

**Requiere:** Función SQL `get_observaciones_vencimiento_proximo(90)` en Supabase

---

### **8. Recordatorios Fin de Mes** 📅
**Archivo:** `n8n_workflow_recordatorios_fin_mes_MEJORADO.json`

**Cuándo:** Automático (Último día hábil del mes 9 AM)  
**Cron:** `0 9 28-31 * *`  
**Qué hace:**
- Recordatorio urgente si es fecha final
- Solicita avance mensual si no es fecha final

---

### **9. Generar Word - Informe** 📄
**Archivo:** `n8n_workflow_generar_word_MEJORADO.json`

**Cuándo:** Auditor hace clic en "Generar Word"  
**Qué hace:**
- Genera documento Word del informe
- Sube a Google Drive
- Actualiza URL en BD

**URL Webhook:** `/webhook/generar-word-informe`  
**Variable ENV:** `NEXT_PUBLIC_N8N_WEBHOOK_URL_GENERAR_WORD`  
**API Route:** `/api/generar-word-informe`  
**Componente:** `app/auditorias/[id]/informe/page.tsx`

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

## 📦 ARCHIVOS A EXPORTAR

### **✅ EXPORTAR ESTOS 8 (obligatorios):**

1. ✅ `n8n_workflow_notificar_auditados.json`
2. ✅ `n8n_workflow_notificar_auditado_observacion.json`
3. ✅ `n8n_workflow_notificar_auditado_fechas_asignadas.json` ⭐ (confirmación al auditado)
4. ✅ `n8n_workflow_notificar_auditor_fechas_implementacion.json`
5. ✅ `n8n_workflow_notificar_auditor_interno_informe.json`
6. ✅ `n8n_workflow_notificar_auditor_actividad.json`
7. ✅ `n8n_workflow_recordatorios_cumplimiento_MEJORADO.json`
8. ✅ `n8n_workflow_recordatorios_fin_mes_MEJORADO.json`
9. ✅ `n8n_workflow_generar_word_MEJORADO.json`

### **⚠️ OPCIONAL (verificar si se necesita):**

10. ⚠️ `n8n_workflow_notificaciones_mensuales.json` (si NO se usa, borrar)

---

## 🔧 PASOS DE CONFIGURACIÓN

### **1. Importar Workflows en N8N**
```
1. Abre N8N (http://localhost:5678)
2. Ve a "Workflows" → "Import from File"
3. Selecciona cada uno de los 8 workflows JSON
4. Repite para cada workflow
```

### **2. Configurar Credenciales Gmail**
```
Para CADA workflow que tenga nodo "Gmail - Enviar Correo":
1. Click en el nodo de Gmail
2. "Credential to connect with" → "Create New"
3. Selecciona "Gmail OAuth2"
4. Click en "Connect my account"
5. Autoriza con tu cuenta de Google
6. Guarda las credenciales
7. El icono rojo debería desaparecer ✅
```

### **3. Obtener URLs de Webhooks**
```
Para CADA workflow webhook:
1. Activa el workflow (toggle "Active")
2. Click en el nodo "Webhook"
3. Copia la URL que aparece arriba
   Ejemplo: http://localhost:5678/webhook-test/notificar-auditados
4. Guarda esta URL para el siguiente paso
```

### **4. Configurar Variables de Entorno**
```
Agrega a .env.local:
NEXT_PUBLIC_N8N_WEBHOOK_URL=http://localhost:5678/webhook-test/notificar-auditados
NEXT_PUBLIC_N8N_WEBHOOK_URL_NOTIFICAR_OBSERVACION=http://localhost:5678/webhook-test/notificar-auditado-observacion
NEXT_PUBLIC_N8N_WEBHOOK_URL_NOTIFICAR_AUDITADO_FECHAS=http://localhost:5678/webhook-test/notificar-auditado-fechas-asignadas
NEXT_PUBLIC_N8N_WEBHOOK_URL_NOTIFICAR_FECHAS_IMPLEMENTACION=http://localhost:5678/webhook-test/notificar-auditor-fechas-implementacion
NEXT_PUBLIC_N8N_WEBHOOK_URL_NOTIFICAR_AUDITOR_INTERNO=http://localhost:5678/webhook-test/notificar-auditor-interno-informe
NEXT_PUBLIC_N8N_WEBHOOK_URL_NOTIFICAR_AUDITOR_ACTIVIDAD=http://localhost:5678/webhook-test/notificar-auditor-actividad
NEXT_PUBLIC_N8N_WEBHOOK_URL_GENERAR_WORD=http://localhost:5678/webhook-test/generar-word-informe
```

---

## 🎯 CÓMO FUNCIONA EL SISTEMA

### **Flujo Completo con Automatizaciones:**

```
1. AUDITOR INTERNO
   └─> Crea Plan → Crea Actividades → Asigna Auditor
   └─> Click "Notificar por Correo" 
       └─> [N8N #6] Envía correo al auditor

2. AUDITOR
   └─> Crea Auditoría
   └─> Completa Preparación
   └─> Agrega Auditados
   └─> Click "Notificar Auditados"
       └─> [N8N #1] Envía correos a auditados + Crea solicitudes (8 días)

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
       └─> [N8N #5] Envía correo al auditor interno ✅

7. AUDITADO
   └─> Completa Estrategia y asigna Fechas
       └─> [N8N #3] Recibe correo de confirmación con sus fechas ✅ ⭐
       └─> [N8N #4] Auditor también recibe notificación

8. AUTOMÁTICO (N8N)
   └─> [N8N #7] Recordatorios diarios (90/60/30 días antes)
   └─> [N8N #8] Recordatorios fin de mes

9. AUDITOR
   └─> Click "Generar Word"
       └─> [N8N #9] Genera Word → Sube a Drive
```

---

## ✅ VERIFICACIÓN DE PUNTOS DEL PROFESOR

### **1. CADA OBSERVACION SE NOTIFIQUE CON FECHA DE INICIO Y DE FIN** ✅
- **Workflow:** `n8n_workflow_notificar_auditado_fechas_asignadas.json` (#3)
- **El auditado recibe correo** con fecha inicio y fecha fin que asignó
- ✅ CUMPLE

### **2. AUDITOR INTERNO RECIBE NOTIFICACION QUE TIENE Q REVISAR INFORME** ✅
- **Workflow:** `n8n_workflow_notificar_auditor_interno_informe.json` (#5)
- **Se activa cuando:** Auditor envía informe a revisión
- ✅ CUMPLE

### **3. AUDITADO PUEDE SOLICITAR CORRECCIONES** ✅
- Implementado en `SolicitarCorreccionObservacion.tsx`
- Redacción corregida: "solicitar al auditor"
- ✅ CUMPLE

### **4. AUDITADO TIENE ACCESO AL HISTORIAL** ✅
- Página: `/auditorias/historial-hallazgos`
- Visible en Sidebar para auditados
- ✅ CUMPLE

---

**TODO LISTO PARA PRESENTAR** ✅
