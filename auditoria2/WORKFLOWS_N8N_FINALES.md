# 📋 WORKFLOWS N8N FINALES - LISTA COMPLETA

## ✅ WORKFLOWS A USAR EN N8N (4 TOTAL)

### **1. Notificar Auditados** 📧
**Archivo:** `n8n_workflow_notificar_auditados.json`  
**Cuándo se activa:** Cuando auditor hace click en "Notificar Auditados"  
**Webhook:** `/webhook/notificar-auditados`  
**Qué hace:**
- Recibe datos de auditoría (objetivo, alcance, criterios, fechas, auditados)
- Genera correo HTML profesional
- Envía correo a cada auditado
- Crea solicitudes de documentación automáticamente (8 días hábiles)
- Actualiza estados en BD

**Configuración necesaria:**
- ✅ Credenciales Gmail OAuth2
- ✅ Variable: `GMAIL_FROM_EMAIL`

---

### **2. Recordatorios de Cumplimiento (3 meses antes)** ⏰
**Archivo:** `n8n_workflow_recordatorios_cumplimiento_MEJORADO.json`  
**Cuándo se activa:** Automático (Cron: Diario a las 9 AM)  
**Cron:** `0 9 * * *`  
**Qué hace:**
- Consulta función SQL: `get_observaciones_vencimiento_proximo(90)`
- Obtiene observaciones que vencen en 90, 60, 30 días
- Envía correos de recordatorio a responsables
- Colores según urgencia:
  - 🔴 Rojo: < 30 días
  - 🟡 Amarillo: < 60 días
  - 🔵 Azul: > 60 días

**Configuración necesaria:**
- ✅ Credenciales Gmail OAuth2
- ✅ Variable: `GMAIL_FROM_EMAIL`
- ✅ Función SQL: `get_observaciones_vencimiento_proximo` (ya existe en Supabase)

---

### **3. Recordatorios Fin de Mes** 📅
**Archivo:** `n8n_workflow_recordatorios_fin_mes_MEJORADO.json`  
**Cuándo se activa:** Automático (Cron: Último día hábil del mes a las 9 AM)  
**Cron:** `0 9 28-31 * *`  
**Qué hace:**
- Verifica si es último día hábil del mes
- Consulta observaciones con `fecha_fin` o `nueva_fecha_implementacion` en ese día
- Diferencia entre:
  - **Fecha final** → Recordatorio urgente (rojo)
  - **No fecha final** → Solicitud de avance (azul)
- Envía correos diferenciados

**Configuración necesaria:**
- ✅ Credenciales Gmail OAuth2
- ✅ Variable: `GMAIL_FROM_EMAIL`

---

### **4. Generar Word y Actualizar Matriz** 📄
**Archivo:** `n8n_workflow_generar_word_MEJORADO.json`  
**Cuándo se activa:** Cuando auditor hace click en "Generar Word"  
**Webhook:** `/webhook/generar-word-informe`  
**Qué hace:**
- Recibe `informe_id` del webhook
- Obtiene informe completo de Supabase (con relaciones)
- Genera HTML con formato profesional (según `informe.markdown`)
- Convierte a Word (CloudConvert o docx)
- Sube a Google Drive (carpeta específica)
- Actualiza `documento_word_url` en BD
- La matriz se actualiza automáticamente por trigger (no necesita llamada manual)

**Configuración necesaria:**
- ✅ Credenciales Google Drive OAuth2
- ✅ Variable: `CLOUDCONVERT_API_KEY` (opcional, para conversión real)
- ✅ Carpeta Drive: `1QHoiXg2FMGy36OS3tfstLllhWDLvWbSL`

---

## ⚠️ WORKFLOW OPCIONAL (Verificar si se necesita)

### **5. Notificaciones Mensuales de Actividades** 📋
**Archivo:** `n8n_workflow_notificaciones_mensuales.json`  
**Cuándo se activa:** Automático (Cron: Día 1 de cada mes a las 8 AM)  
**Cron:** `0 8 1 * *`  
**Qué hace:**
- Notifica a auditores sobre actividades que inician ese mes
- Consulta función SQL: `get_monthly_activities_notifications`
- Envía correo con lista de actividades asignadas

**Nota:** Este workflow es para notificar sobre **actividades del plan**, no sobre **observaciones**.  
**Decisión:** Si no se usa, se puede borrar.

---

## ❌ WORKFLOWS BORRADOS (Versiones Antiguas)

Los siguientes workflows fueron **eliminados** porque son versiones antiguas reemplazadas:

1. ❌ `n8n_workflow_recordatorios_cumplimiento.json` → Reemplazado por versión MEJORADA
2. ❌ `n8n_workflow_recordatorios_fin_mes.json` → Reemplazado por versión MEJORADA
3. ❌ `n8n_workflow_generar_word_y_matriz.json` → Reemplazado por versión MEJORADA

---

## 📊 RESUMEN

**Total de workflows en el proyecto:** 5  
**Workflows a usar:** 4 (obligatorios)  
**Workflow opcional:** 1 (verificar si se necesita)  
**Workflows borrados:** 3 (versiones antiguas)

---

## 🔧 CONFIGURACIÓN EN N8N

### **Variables de Entorno:**
```bash
GMAIL_FROM_EMAIL=auditoria@empresa.com
CLOUDCONVERT_API_KEY=tu_api_key_de_cloudconvert  # Solo para workflow de Word
```

### **Credenciales:**
1. **Gmail OAuth2** (para workflows 1, 2, 3)
2. **Google Drive OAuth2** (para workflow 4)

### **Funciones SQL en Supabase:**
1. ✅ `get_observaciones_vencimiento_proximo(dias_anticipacion)` - Para workflow 2
2. ⚠️ `get_monthly_activities_notifications(p_month_date)` - Para workflow 5 (opcional)

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN

- [ ] Importar `n8n_workflow_notificar_auditados.json`
- [ ] Importar `n8n_workflow_recordatorios_cumplimiento_MEJORADO.json`
- [ ] Importar `n8n_workflow_recordatorios_fin_mes_MEJORADO.json`
- [ ] Importar `n8n_workflow_generar_word_MEJORADO.json`
- [ ] (Opcional) Importar `n8n_workflow_notificaciones_mensuales.json`
- [ ] Configurar variable `GMAIL_FROM_EMAIL`
- [ ] Configurar credenciales Gmail OAuth2
- [ ] Configurar credenciales Google Drive OAuth2
- [ ] Configurar variable `CLOUDCONVERT_API_KEY` (opcional)
- [ ] Activar todos los workflows
- [ ] Probar cada workflow manualmente
- [ ] Verificar que los correos se envían correctamente

---

**Última actualización:** 2025-01-08
