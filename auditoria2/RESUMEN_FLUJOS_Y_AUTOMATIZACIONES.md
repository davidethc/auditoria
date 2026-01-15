# 📘 RESUMEN COMPLETO: FLUJOS Y AUTOMATIZACIONES

## 🎯 FLUJO COMPLETO DESDE CERO

### **FASE 1: PLANIFICACIÓN** (Auditor Interno)

1. **Crear Plan de Trabajo**
   - Dónde: `/plan-trabajo`
   - Crea plan anual con actividades
   - Asigna auditor a cada actividad

2. **Auditor Crea Auditoría**
   - Dónde: `/plan-trabajo` → Click en actividad → "Crear Auditoría"
   - Define fechas
   - Estado: `PLANIFICADA`

---

### **FASE 2: PREPARACIÓN** (Auditor)

3. **Completar Preparación**
   - Dónde: `/auditorias/[id]` → Tab "Preparación"
   - Campos: Objetivo, Alcance, Criterios (obligatorios)
   - Tiempo: 15-30 min

4. **Agregar Auditados**
   - Dónde: `/auditorias/[id]` → Tab "Participantes"
   - Selecciona usuarios con rol `auditado`
   - Tiempo: 5-10 min

5. **Notificar Auditados** 📧
   - Dónde: Botón "Notificar Auditados"
   - **AUTOMATIZACIÓN N8N:** `n8n_workflow_notificar_auditados.json`
   - Qué hace:
     - Envía correo a cada auditado
     - Crea solicitudes de documentación (8 días hábiles)
   - Tiempo: Inmediato (automático)

---

### **FASE 3: EJECUCIÓN** (Auditor)

6. **Auditado Entrega Documentación**
   - Dónde: `/documents`
   - Plazo: 8 días hábiles
   - Responde con link de Drive

7. **Iniciar Ejecución**
   - Dónde: Botón "Iniciar Ejecución"
   - Estado: `PLANIFICADA` → `EN_EJECUCION`
   - Tiempo: Inmediato

8. **Registrar Observaciones**
   - Dónde: `/auditorias/[id]/ejecucion`
   - Crea observaciones con: título, descripción, recomendación, responsables
   - Tiempo: Variable (durante ejecución)

9. **Finalizar Ejecución**
   - Dónde: Botón "Finalizar Ejecución"
   - Estado: `EN_EJECUCION` → `EN_REPORTE`
   - Tiempo: Inmediato

---

### **FASE 4: INFORME** (Auditor → Auditor Interno)

10. **Crear Informe Borrador**
    - Dónde: `/auditorias/[id]/informe` → Tab "Borrador"
    - Completa todos los campos según `informe.markdown`
    - Selecciona observaciones a incluir
    - Tiempo: 1-2 horas

11. **Enviar a Revisión**
    - Dónde: Botón "Enviar a Revisión"
    - Estado: `BORRADOR` → `EN_REVISION`
    - **NOTIFICACIÓN AUTOMÁTICA:** Auditor Interno recibe notificación
    - Tiempo: Inmediato

12. **Auditor Interno Revisa**
    - Dónde: `/auditorias/[id]/informe` → Tab "Revisión"
    - Opciones: Aprobar o Solicitar Correcciones
    - Tiempo: 1-3 días

13. **Socializar Informe**
    - Dónde: Tab "Socialización"
    - Estado: `APROBADO` → `ENVIADO_A_AUDITADOS`
    - Tiempo: Inmediato

---

### **FASE 5: IMPLEMENTACIÓN** (Auditado)

14. **Presentar Descargos** (Opcional)
    - Dónde: Tab "Descargos"
    - Plazo: 5 días laborables
    - Tiempo: Variable

15. **Completar Estrategia y Fechas**
    - Dónde: Tab "Estrategia"
    - Plazo: 3 días hábiles
    - Completa: Estrategia, Fecha Inicio, Fecha Fin, Entregable
    - **NOTIFICACIÓN AUTOMÁTICA:** Auditor recibe notificación por cada observación
    - Tiempo: 3 días hábiles

16. **Reportar Avance Mensual**
    - Dónde: Matriz de Observaciones → Botón "Reportar Avance"
    - Completa: Porcentaje, Descripción, Evidencias
    - **NOTIFICACIÓN AUTOMÁTICA:** Auditor recibe notificación
    - **AUTOMATIZACIÓN N8N:** Recordatorios mensuales automáticos
    - Tiempo: Mensual

---

### **FASE 6: REVISIÓN Y CIERRE** (Auditor Interno → Todos)

17. **Revisar Descargos y Estrategias**
    - Dónde: `/auditorias/revision-descargos`
    - Aprobar o Rechazar con comentarios
    - Tiempo: Variable

18. **Generar Word** 📄
    - Dónde: Botón "Generar Word"
    - **AUTOMATIZACIÓN N8N:** `n8n_workflow_generar_word_MEJORADO.json`
    - Genera Word → Sube a Drive
    - Tiempo: 1-2 minutos (automático)

19. **Firmar Informe**
    - Dónde: Tab "Firmas"
    - Auditor + Auditados firman
    - Cuando todos firman → `COMPLETADO` → `CERRADA`
    - Tiempo: 1-3 días

---

## 📊 FLUJO DE INFORMES Y MATRIZ

### **¿Cuándo se Genera el Informe?**

**Punto 1:** Creación del Borrador (Paso 10)
- Auditor crea informe
- Observaciones se actualizan: `numero_informe`, `fecha_emision_informe`

**Punto 2:** Envío a Revisión (Paso 11)
- Estado: `EN_REVISION`
- Auditor Interno recibe notificación

**Punto 3:** Aprobación (Paso 12)
- Estado: `APROBADO`

**Punto 4:** Socialización (Paso 13)
- Estado: `ENVIADO_A_AUDITADOS`
- Observaciones se actualizan: `fecha_envio_informe`

**Punto 5:** Generación Word (Paso 18)
- N8N genera Word automáticamente
- Sube a Google Drive
- URL guardada en `documento_word_url`

**Punto 6:** Firma (Paso 19)
- Estado: `COMPLETADO`
- Auditoría: `CERRADA`

---

### **¿Cuándo se Actualiza la Matriz?**

**Automático (Triggers):**

1. **Cuando informe se completa:**
   - Trigger: `trigger_actualizar_matriz_desde_informe`
   - Actualiza: numero_informe, fechas, estrategia, entregable, responsables, plazo

2. **Cuando auditado completa estrategia:**
   - Fechas se propagan a observaciones
   - Matriz se actualiza automáticamente

3. **Cuando auditado reporta avance:**
   - porcentaje_avance, descripcion_avance actualizados

**Manual:**
- Exportar a Excel: Botón "Exportar Excel" (cualquier momento)
- Editar observaciones: Auditor puede editar directamente

---

## 🔄 AUTOMATIZACIONES N8N

### **1. Notificar Auditados** 📧
- **Cuándo:** Click en "Notificar Auditados"
- **Archivo:** `n8n_workflow_notificar_auditados.json`
- **Función:** Envía correos + Crea solicitudes (8 días)

### **2. Recordatorios de Cumplimiento** ⏰
- **Cuándo:** Diario 9 AM (automático)
- **Archivo:** `n8n_workflow_recordatorios_cumplimiento_MEJORADO.json`
- **Función:** Recordatorios 90/60/30 días antes

### **3. Recordatorios Fin de Mes** 📅
- **Cuándo:** Último día hábil del mes 9 AM (automático)
- **Archivo:** `n8n_workflow_recordatorios_fin_mes_MEJORADO.json`
- **Función:** Solicita avances o recuerda fechas finales

### **4. Generar Word** 📄
- **Cuándo:** Click en "Generar Word"
- **Archivo:** `n8n_workflow_generar_word_MEJORADO.json`
- **Función:** Genera Word → Sube a Drive

---

## ⏰ TIEMPOS Y PLAZOS

| Acción | Responsable | Plazo | Automatización |
|--------|-------------|-------|----------------|
| Confirmar participación | Auditado | 1-2 días | - |
| Entregar documentación | Auditado | 8 días hábiles | ✅ N8N crea solicitud |
| Presentar descargos | Auditado | 5 días laborables | - |
| Completar estrategia | Auditado | 3 días hábiles | ✅ Notifica auditor |
| Firmar informe | Todos | 3 días hábiles | - |
| Reportar avance | Auditado | Mensual | ✅ N8N recordatorios |
| Revisar informe | Auditor Interno | 1-3 días | ✅ Notificación |

---

## 📋 ARCHIVOS FINALES EN TU PROYECTO

### **Workflows N8N (4 obligatorios):**
1. ✅ `n8n_workflow_notificar_auditados.json`
2. ✅ `n8n_workflow_recordatorios_cumplimiento_MEJORADO.json`
3. ✅ `n8n_workflow_recordatorios_fin_mes_MEJORADO.json`
4. ✅ `n8n_workflow_generar_word_MEJORADO.json`

### **Workflow Opcional:**
5. ⚠️ `n8n_workflow_notificaciones_mensuales.json` (para actividades del plan)

### **Archivos Eliminados:**
- ❌ `n8n_workflow_recordatorios_cumplimiento.json` (antiguo)
- ❌ `n8n_workflow_recordatorios_fin_mes.json` (antiguo)
- ❌ `n8n_workflow_generar_word_y_matriz.json` (antiguo)

---

**Todo está listo y funcionando.** 🎉
