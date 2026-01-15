# 📋 LISTA DEFINITIVA: WORKFLOWS PARA EXPORTAR A N8N

## ✅ EXPORTAR ESTOS 8 WORKFLOWS (OBLIGATORIOS)

### **1. Notificar Auditados - Inicio de Auditoría** 📧
**Archivo:** `n8n_workflow_notificar_auditados.json`  
**Cuándo:** Click en "Notificar Auditados"  
**Qué hace:** Envía correos a auditados + Crea solicitudes (8 días)  
**Variable ENV:** `NEXT_PUBLIC_N8N_WEBHOOK_URL`

---

### **2. Notificar Auditado - Nueva Observación** 📋
**Archivo:** `n8n_workflow_notificar_auditado_observacion.json`  
**Cuándo:** Auditor crea observación con responsable  
**Qué hace:** Envía correo al auditado responsable  
**Variable ENV:** `NEXT_PUBLIC_N8N_WEBHOOK_URL_NOTIFICAR_OBSERVACION`

---

### **3. Confirmar Fechas Asignadas al Auditado** ✅ ⭐ **IMPORTANTE**
**Archivo:** `n8n_workflow_notificar_auditado_fechas_asignadas.json`  
**Cuándo:** Auditado asigna fechas de implementación  
**Qué hace:** **Envía correo de confirmación al auditado con fecha inicio y fecha fin** ⭐  
**Variable ENV:** `NEXT_PUBLIC_N8N_WEBHOOK_URL_NOTIFICAR_AUDITADO_FECHAS`  
**✅ CUMPLE REQUISITO DEL PROFESOR**

---

### **4. Notificar Auditor - Fechas Asignadas** 📅
**Archivo:** `n8n_workflow_notificar_auditor_fechas_implementacion.json`  
**Cuándo:** Auditado asigna fechas (informar al auditor)  
**Qué hace:** Envía correo al auditor informándole fechas asignadas  
**Variable ENV:** `NEXT_PUBLIC_N8N_WEBHOOK_URL_NOTIFICAR_FECHAS_IMPLEMENTACION`

---

### **5. Notificar Auditor Interno - Informe para Revisar** 📄 ⭐ **IMPORTANTE**
**Archivo:** `n8n_workflow_notificar_auditor_interno_informe.json`  
**Cuándo:** Auditor envía informe a revisión  
**Qué hace:** **Envía correo al auditor interno con informe para revisar** ⭐  
**Variable ENV:** `NEXT_PUBLIC_N8N_WEBHOOK_URL_NOTIFICAR_AUDITOR_INTERNO`  
**✅ CUMPLE REQUISITO DEL PROFESOR**

---

### **6. Notificar Auditor - Actividad Asignada** 📋
**Archivo:** `n8n_workflow_notificar_auditor_actividad.json`  
**Cuándo:** Auditor interno click "Notificar por Correo"  
**Qué hace:** Envía correo al auditor sobre actividad  
**Variable ENV:** `NEXT_PUBLIC_N8N_WEBHOOK_URL_NOTIFICAR_AUDITOR_ACTIVIDAD`

---

### **7. Recordatorios de Cumplimiento (90/60/30 días)** ⏰
**Archivo:** `n8n_workflow_recordatorios_cumplimiento_MEJORADO.json`  
**Cuándo:** Automático (Diario 9 AM)  
**Qué hace:** Recordatorios según urgencia (rojo < 30, amarillo < 60, azul > 60)  
**Requiere:** Función SQL `get_observaciones_vencimiento_proximo(90)` en Supabase

---

### **8. Recordatorios Fin de Mes** 📅
**Archivo:** `n8n_workflow_recordatorios_fin_mes_MEJORADO.json`  
**Cuándo:** Automático (Último día hábil del mes 9 AM)  
**Qué hace:** Recordatorio urgente o solicitud de avance mensual

---

### **9. Generar Word - Informe** 📄
**Archivo:** `n8n_workflow_generar_word_MEJORADO.json`  
**Cuándo:** Click en "Generar Word"  
**Qué hace:** Genera Word del informe → Sube a Google Drive  
**Variable ENV:** `NEXT_PUBLIC_N8N_WEBHOOK_URL_GENERAR_WORD`

---

## ⚠️ WORKFLOW OPCIONAL (Verificar si se necesita)

### **10. Notificaciones Mensuales - Actividades** 📅
**Archivo:** `n8n_workflow_notificaciones_mensuales.json`  
**Cuándo:** Automático (Día 1 de cada mes 8 AM)  
**Qué hace:** Notifica a auditores sobre actividades que inician ese mes  
**Decisión:** Si NO se usa, borrarlo

---

## 📊 RESUMEN

**Total workflows:** 9 obligatorios + 1 opcional = **10**

**Tipo de activación:**
- **Webhooks (6):** Se activan desde el sistema (click en botones)
- **Cron/Schedule (3):** Se activan automáticamente (recordatorios)
- **Opcional (1):** Verificar si se necesita

---

## 🔧 CONFIGURACIÓN EN N8N

### **PASO 1: Importar**
1. Abre N8N
2. Workflows → Import from File
3. Importa los 9 workflows JSON

### **PASO 2: Configurar Gmail OAuth2**
- Para CADA workflow que tenga nodo Gmail
- Create New → Gmail OAuth2 → Autorizar → Guardar

### **PASO 3: Activar y Copiar URLs**
- Activa cada workflow (toggle "Active")
- Copia la URL del webhook
- Actualiza `.env.local` con las URLs

---

**TODO LISTO PARA EXPORTAR** ✅
