# 📋 Plan: Generación Word + Matriz de Observaciones

## 🎯 Objetivos

1. **Generar documento Word** del informe completo
2. **Subir a Google Drive** (carpeta específica)
3. **Actualizar matriz de observaciones** cuando el informe se completa

---

## 📊 Flujo Completo: Informe → Matriz de Observaciones

### **Flujo Actual:**
```
1. Auditor crea observaciones durante EJECUCIÓN
   ↓ (se guardan en auditoria_observaciones)
   
2. Auditor crea INFORME BORRADOR
   ↓ (selecciona observaciones → observaciones_enumeradas JSONB)
   
3. Auditor Interno APRUEBA informe
   ↓
   
4. Auditor SOCIALIZA informe
   ↓
   
5. Auditado completa ESTRATEGIA y FIRMA
   ↓
   
6. ✅ Informe COMPLETO
   ❌ PERO las observaciones NO tienen datos del informe
```

### **Flujo Deseado:**
```
1. Auditor crea observaciones durante EJECUCIÓN
   ↓ (se guardan en auditoria_observaciones)
   
2. Auditor crea INFORME BORRADOR
   ↓ (selecciona observaciones → observaciones_enumeradas JSONB)
   
3. Auditor Interno APRUEBA informe
   ↓
   
4. Auditor SOCIALIZA informe
   ↓
   
5. Auditado completa ESTRATEGIA y FIRMA
   ↓
   
6. ✅ Informe COMPLETO
   ↓
   
7. 🔄 N8N AUTOMÁTICO:
   - Genera documento Word
   - Sube a Google Drive
   - Actualiza documento_word_url
   - ACTUALIZA auditoria_observaciones con:
     * numero_informe (del encabezado)
     * fecha_emision_informe
     * fecha_envio_informe
     * estrategia (del informe o de cada observación)
     * entregable (del informe o de cada observación)
     * fecha_inicio (del informe)
     * fecha_fin (del informe)
     * responsable_estrategia
     * responsable_implementacion
```

---

## 📋 Matriz de Observaciones: Campos vs Base de Datos

### **Campos de la Matriz (Excel):**

| Campo Matriz | Campo BD | Fuente | Estado |
|--------------|----------|--------|--------|
| N° | `numero_observacion` | Ya existe | ✅ |
| AUDITOR | `auditor_id` → `users.full_name` | Ya existe | ✅ |
| N° DE INFORME | `numero_informe` | Del informe `encabezado` | ⚠️ Falta actualizar |
| FECHA DE EMISIÓN DEL INFORME | `fecha_emision_informe` | Del informe `fecha_elaboracion` | ⚠️ Falta actualizar |
| FECHA ENVÍO INFORME | `fecha_envio_informe` | Del informe `fecha_socializacion` o `fecha_aprobacion` | ⚠️ Falta actualizar |
| NOMBRE DE LA AUDITORÍA | `auditorias.nombre` | Ya existe (relación) | ✅ |
| N° DE OBS | `numero_observacion` | Ya existe | ✅ |
| TÍTULO DE LA OBS | `titulo_observacion` | Ya existe | ✅ |
| DESCRIPCIÓN DE LA OBSERVACIÓN | `descripcion_observacion` | Ya existe | ✅ |
| RECOMENDACIÓN | `recomendacion` | Ya existe | ✅ |
| ESTRATEGIA | `estrategia` | Del informe o de la observación | ⚠️ Puede venir de ambos |
| ENTREGABLE | `entregable` | Del informe o de la observación | ⚠️ Puede venir de ambos |
| PROBABILIDAD | `probabilidad` | Ya existe | ✅ |
| IMPACTO | `impacto` | Ya existe | ✅ |
| RIESGO | `riesgo` | Ya existe | ✅ |
| RESPONSABLE DE LA ESTRATEGIA | `responsable_estrategia` → `users.full_name` | Ya existe | ✅ |
| RESPONSABLE DE LA IMPLEMENTACIÓN | `responsable_implementacion` → `users.full_name` | Ya existe | ✅ |
| FECHA INICIO | `fecha_inicio` | Del informe `fecha_inicio_implementacion` | ⚠️ Falta actualizar |
| FECHA FIN | `fecha_fin` | Del informe `fecha_fin_implementacion` | ⚠️ Falta actualizar |
| PLAZO (DIAS LABORABLES) | `plazo_dias_laborables` | Calculado | ⚠️ Falta calcular |
| FECHA FINAL (NO APLICA) | `fecha_final_no_aplica` | Ya existe | ✅ |
| ESTADO DE LA OBSERVACIÓN | `estado_observacion` | Ya existe | ✅ |
| PORCENTAJE AVANCE | `porcentaje_avance` | Ya existe | ✅ |
| DESCRIPCIÓN DEL AVANCE | `descripcion_avance` | Ya existe | ✅ |
| NUEVA FECHA DE IMPLEMENTACIÓN | `nueva_fecha_implementacion` | Ya existe | ✅ |
| FECHA REAL DE IMPLEMENTACIÓN | `fecha_real_implementacion` | Ya existe | ✅ |
| DESCRIPCIÓN DE DESCARGOS | `descripcion_descargos` | Ya existe | ✅ |

---

## 🔄 Proceso: Informe → Matriz

### **Cuándo se actualiza la matriz:**
Cuando el informe está **COMPLETO** (todos los campos llenos, firmado, estado = `COMPLETADO` o `ENVIADO_A_AUDITADOS`)

### **Qué se actualiza:**
Para cada observación en `observaciones_enumeradas` del informe:

1. **Buscar observación en `auditoria_observaciones`** por `id` o `numero_observacion`
2. **Actualizar campos del informe:**
   ```sql
   UPDATE auditoria_observaciones
   SET
     numero_informe = informe.encabezado,  -- Ej: "ASIS-01-2024"
     fecha_emision_informe = informe.fecha_elaboracion,
     fecha_envio_informe = informe.fecha_socializacion,
     estrategia = COALESCE(observacion.estrategia, informe.estrategia),
     entregable = COALESCE(observacion.entregable, informe.entregable),
     fecha_inicio = informe.fecha_inicio_implementacion,
     fecha_fin = informe.fecha_fin_implementacion,
     plazo_dias_laborables = calcular_dias_laborables(
       informe.fecha_inicio_implementacion,
       informe.fecha_fin_implementacion
     ),
     responsable_estrategia = observacion.responsable_id,  -- del JSONB
     responsable_implementacion = observacion.responsable_id  -- del JSONB
   WHERE id = observacion.id;
   ```

---

## 🤖 N8N Workflow: Generar Word + Actualizar Matriz

### **Trigger:**
- **Webhook** desde Next.js cuando el informe está completo
- O **Supabase Database Trigger** cuando `auditoria_informe.estado = 'COMPLETADO'`

### **Nodos del Workflow:**

1. **Webhook** (o Supabase Trigger)
   - Recibe: `informe_id` o datos completos del informe

2. **HTTP Request: Obtener Informe Completo**
   - GET `/rest/v1/auditoria_informe?id=eq.{informe_id}&select=*`
   - Incluir relaciones: auditoria, observaciones, firmas

3. **Code: Preparar Datos para Word**
   - Formatear datos del informe
   - Preparar estructura del documento

4. **Code: Generar Documento Word**
   - Usar librería `docx` (Node.js)
   - Crear documento con formato estándar
   - Incluir:
     * Encabezado, De, Para, Asunto
     * Antecedentes, Objetivos, Alcance
     * Resultados, Metodología
     * Observaciones enumeradas
     * Conclusiones, Recomendaciones
     * Estrategia, Fechas, Entregable (del auditado)
     * Firmas (si están disponibles)

5. **Google Drive: Subir Archivo**
   - Carpeta: `1QHoiXg2FMGy36OS3tfstLllhWDLvWbSL`
   - Nombre: `{numero_informe}_{nombre_auditoria}_{fecha}.docx`
   - Subir archivo

6. **HTTP Request: Actualizar documento_word_url**
   - PATCH `/rest/v1/auditoria_informe?id=eq.{informe_id}`
   - Body: `{ documento_word_url: "https://drive.google.com/..." }`

7. **Code: Actualizar Matriz de Observaciones**
   - Para cada observación en `observaciones_enumeradas`:
     * Buscar en `auditoria_observaciones`
     * Actualizar campos del informe

8. **HTTP Request: Actualizar Observaciones**
   - PATCH `/rest/v1/auditoria_observaciones?id=eq.{observacion_id}`
   - Body: Datos actualizados

---

## 📝 Estructura del Documento Word

### **Formato Estándar:**

```
═══════════════════════════════════════════════════════
{ENCABEZADO}
═══════════════════════════════════════════════════════

De: {DE}
Para: {PARA}
Asunto: {ASUNTO}
Fecha: {FECHA_INICIO_INFORME}

═══════════════════════════════════════════════════════
1. ANTECEDENTES
═══════════════════════════════════════════════════════
{ANTECEDENTES}

═══════════════════════════════════════════════════════
2. OBJETIVOS
═══════════════════════════════════════════════════════
{OBJETIVOS}

═══════════════════════════════════════════════════════
3. ALCANCE
═══════════════════════════════════════════════════════
{ALCANCE}

═══════════════════════════════════════════════════════
4. RESULTADOS DE LA REVISIÓN
═══════════════════════════════════════════════════════
{RESULTADOS_REVISION}

═══════════════════════════════════════════════════════
5. METODOLOGÍA APLICADA
═══════════════════════════════════════════════════════
{METODOLOGIA_APLICADA}

═══════════════════════════════════════════════════════
6. {TITULO_OBSERVACIONES}
═══════════════════════════════════════════════════════

{Por cada observación:}

OBSERVACIÓN N° {numero}
Título: {titulo}
Descripción: {descripcion}
Recomendación: {recomendacion}
Responsable: {responsable.full_name}

═══════════════════════════════════════════════════════
7. ESTRATEGIA DE IMPLEMENTACIÓN
═══════════════════════════════════════════════════════
{ESTRATEGIA}

Fecha de inicio: {FECHA_INICIO_IMPLEMENTACION}
Fecha de fin: {FECHA_FIN_IMPLEMENTACION}
Entregable: {ENTREGABLE}

═══════════════════════════════════════════════════════
8. CONCLUSIONES
═══════════════════════════════════════════════════════
{CONCLUSIONES}

═══════════════════════════════════════════════════════
9. RECOMENDACIONES GENERALES
═══════════════════════════════════════════════════════
{RECOMENDACIONES_GENERALES}

═══════════════════════════════════════════════════════
FIRMAS
═══════════════════════════════════════════════════════

Auditor: {elaborado_por_user.full_name}
Fecha: {fecha_elaboracion}

{Por cada auditado que firmó:}
Auditado: {firmante.full_name}
Fecha: {fecha_firma}
```

---

## 🔧 Implementación Técnica

### **1. N8N Workflow JSON**
- Crear workflow con todos los nodos
- Configurar Google Drive API
- Configurar Supabase HTTP Requests

### **2. Función SQL: Calcular Días Laborables**
```sql
CREATE OR REPLACE FUNCTION calcular_dias_laborables(
  fecha_inicio DATE,
  fecha_fin DATE
) RETURNS INTEGER AS $$
DECLARE
  dias INTEGER := 0;
  fecha_actual DATE;
BEGIN
  fecha_actual := fecha_inicio;
  
  WHILE fecha_actual <= fecha_fin LOOP
    -- Excluir sábados (6) y domingos (0)
    IF EXTRACT(DOW FROM fecha_actual) NOT IN (0, 6) THEN
      dias := dias + 1;
    END IF;
    fecha_actual := fecha_actual + INTERVAL '1 day';
  END LOOP;
  
  RETURN dias;
END;
$$ LANGUAGE plpgsql;
```

### **3. Trigger o Webhook desde Next.js**
- Cuando el informe se completa, llamar al webhook de N8N
- O crear trigger en Supabase que llame al webhook

---

## ✅ Checklist de Implementación

- [ ] Crear función SQL `calcular_dias_laborables`
- [ ] Crear N8N workflow para generar Word
- [ ] Configurar Google Drive API en N8N
- [ ] Implementar generación de Word con `docx`
- [ ] Subir archivo a Google Drive
- [ ] Actualizar `documento_word_url` en `auditoria_informe`
- [ ] Implementar actualización de matriz de observaciones
- [ ] Crear webhook desde Next.js o trigger en Supabase
- [ ] Probar flujo completo
- [ ] Documentar proceso

---

## 📌 Notas Importantes

1. **Estrategia y Entregable:**
   - Pueden venir del informe (general) o de cada observación (específico)
   - Prioridad: Si la observación tiene estrategia/entregable, usar esa. Si no, usar la del informe.

2. **Responsables:**
   - `responsable_estrategia` y `responsable_implementacion` vienen del JSONB `observaciones_enumeradas`
   - Cada observación puede tener su propio responsable

3. **Fechas:**
   - `fecha_emision_informe`: `fecha_elaboracion` del informe
   - `fecha_envio_informe`: `fecha_socializacion` o `fecha_aprobacion`
   - `fecha_inicio` y `fecha_fin`: Del informe `fecha_inicio_implementacion` y `fecha_fin_implementacion`

4. **Google Drive:**
   - Carpeta compartida: `1QHoiXg2FMGy36OS3tfstLllhWDLvWbSL`
   - Necesitas configurar Google Drive API en N8N con credenciales OAuth2

