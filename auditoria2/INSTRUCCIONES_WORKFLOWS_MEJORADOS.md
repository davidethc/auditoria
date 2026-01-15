# 📋 INSTRUCCIONES: WORKFLOWS N8N MEJORADOS

## 🎯 RESUMEN

Se crearon versiones mejoradas de los 3 últimos workflows de N8N que obtienen datos **directamente de Supabase** sin depender de webhooks (excepto el de generar Word que sí necesita webhook para activarse).

---

## 📁 ARCHIVOS CREADOS

1. ✅ `n8n_workflow_recordatorios_cumplimiento_MEJORADO.json`
2. ✅ `n8n_workflow_recordatorios_fin_mes_MEJORADO.json`
3. ✅ `n8n_workflow_generar_word_MEJORADO.json`

---

## 🔄 WORKFLOW 1: RECORDATORIOS DE CUMPLIMIENTO (3 MESES ANTES)

### **Mejoras Implementadas:**

1. ✅ **Consulta directa a Supabase:**
   - Usa función RPC `get_observaciones_vencimiento_proximo(90)`
   - URL: `https://ksnehijfwxtfbspqvdwq.supabase.co/rest/v1/rpc/get_observaciones_vencimiento_proximo`
   - Headers con API key correcta

2. ✅ **Parseo mejorado:**
   - Maneja respuestas array u objeto
   - Filtra observaciones sin email
   - Extrae datos completos de responsable y auditoría

3. ✅ **HTML mejorado:**
   - Colores según urgencia (rojo < 30 días, amarillo < 60 días, azul > 60 días)
   - Badges visuales para días restantes
   - Botón de acceso al sistema

### **Cómo Importar:**

1. Abre N8N
2. Ve a Workflows → Import from File
3. Selecciona `n8n_workflow_recordatorios_cumplimiento_MEJORADO.json`
4. Configura credenciales:
   - Gmail OAuth2 (si no está configurado)
   - Variable de entorno `GMAIL_FROM_EMAIL`
5. Activa el workflow

### **Configuración Requerida:**

- ✅ Variable de entorno: `GMAIL_FROM_EMAIL` (ej: `auditoria@empresa.com`)
- ✅ Credenciales Gmail OAuth2
- ✅ La función `get_observaciones_vencimiento_proximo` ya está creada en Supabase

---

## 🔄 WORKFLOW 2: RECORDATORIOS FIN DE MES

### **Mejoras Implementadas:**

1. ✅ **Consulta directa a Supabase:**
   - Consulta `auditoria_observaciones` con filtros avanzados
   - Usa `or=(fecha_fin.eq.X,nueva_fecha_implementacion.eq.X)` para ambas fechas
   - Filtra por estado y fecha real de implementación

2. ✅ **Lógica mejorada:**
   - Verifica último día hábil del mes
   - Determina si es fecha final o no
   - Maneja `nueva_fecha_implementacion` si existe

3. ✅ **HTML diferenciado:**
   - Formato diferente para fecha final (rojo urgente)
   - Formato normal para solicitud de avance (azul)

### **Cómo Importar:**

1. Abre N8N
2. Ve a Workflows → Import from File
3. Selecciona `n8n_workflow_recordatorios_fin_mes_MEJORADO.json`
4. Configura credenciales:
   - Gmail OAuth2
   - Variable de entorno `GMAIL_FROM_EMAIL`
5. Activa el workflow

### **Configuración Requerida:**

- ✅ Variable de entorno: `GMAIL_FROM_EMAIL`
- ✅ Credenciales Gmail OAuth2
- ✅ Los triggers de Supabase ya están configurados

---

## 🔄 WORKFLOW 3: GENERAR WORD Y ACTUALIZAR MATRIZ

### **Mejoras Implementadas:**

1. ✅ **Consulta directa a Supabase:**
   - Obtiene informe completo con relaciones (auditoría, usuarios)
   - URL: `https://ksnehijfwxtfbspqvdwq.supabase.co/rest/v1/auditoria_informe?id=eq.{id}&select=...`
   - Headers con API key correcta

2. ✅ **Generación de HTML mejorada:**
   - Formato profesional tipo Word
   - Estilos CSS para impresión
   - Manejo de observaciones enumeradas
   - Formateo de fechas en español

3. ✅ **Conversión a Word:**
   - Usa CloudConvert API para convertir HTML → DOCX
   - Requiere API key de CloudConvert
   - Genera archivo Word real (no solo HTML)

4. ✅ **Actualización en Supabase:**
   - Actualiza `documento_word_url` después de subir a Drive
   - La matriz se actualiza automáticamente por trigger (no necesita llamada manual)

### **Cómo Importar:**

1. Abre N8N
2. Ve a Workflows → Import from File
3. Selecciona `n8n_workflow_generar_word_MEJORADO.json`
4. Configura credenciales:
   - Google Drive OAuth2
   - Variable de entorno `CLOUDCONVERT_API_KEY`
5. Activa el workflow

### **Configuración Requerida:**

- ✅ Variable de entorno: `CLOUDCONVERT_API_KEY` (obtener de https://cloudconvert.com)
- ✅ Credenciales Google Drive OAuth2
- ✅ ID de carpeta de Google Drive: `1QHoiXg2FMGy36OS3tfstLllhWDLvWbSL`

### **Nota sobre CloudConvert:**

Si no quieres usar CloudConvert, puedes:
1. Eliminar el nodo "HTTP Request - Convertir HTML a Word"
2. Usar el nodo "Code" para generar Word con librería `docx` (requiere instalar en N8N)
3. O usar otro servicio de conversión

---

## 🔑 CREDENCIALES Y VARIABLES DE ENTORNO

### **Variables de Entorno Requeridas:**

```bash
# En N8N Settings → Environment Variables:

GMAIL_FROM_EMAIL=auditoria@empresa.com
CLOUDCONVERT_API_KEY=tu_api_key_de_cloudconvert  # Solo para workflow de Word
```

### **Credenciales N8N:**

1. **Gmail OAuth2:**
   - Crear en N8N → Credentials → Gmail OAuth2
   - Configurar con cuenta de Gmail que enviará correos

2. **Google Drive OAuth2:**
   - Crear en N8N → Credentials → Google Drive OAuth2
   - Configurar con cuenta que tiene acceso a la carpeta

3. **Supabase (ya configurado en workflows):**
   - URL: `https://ksnehijfwxtfbspqvdwq.supabase.co`
   - API Key: Ya incluida en los workflows (anon key)

---

## 📊 COMPARACIÓN: ANTES vs DESPUÉS

### **ANTES:**
- ❌ Dependía de webhooks para obtener datos
- ❌ Necesitaba que Next.js enviara datos completos
- ❌ Más puntos de fallo

### **DESPUÉS:**
- ✅ Obtiene datos directamente de Supabase
- ✅ No depende de Next.js para datos
- ✅ Más robusto y confiable
- ✅ Usa funciones SQL optimizadas
- ✅ Consultas directas con filtros avanzados

---

## 🧪 PRUEBAS

### **Workflow 1: Recordatorios Cumplimiento**
1. Activar workflow
2. Esperar cron (o ejecutar manualmente)
3. Verificar que:
   - Consulta función `get_observaciones_vencimiento_proximo`
   - Filtra observaciones con email
   - Envía correos correctamente

### **Workflow 2: Recordatorios Fin de Mes**
1. Activar workflow
2. Esperar último día hábil del mes (o cambiar fecha del sistema)
3. Verificar que:
   - Consulta observaciones con fecha fin de mes
   - Diferencia entre fecha final y no final
   - Envía correos según el caso

### **Workflow 3: Generar Word**
1. Activar workflow
2. Desde Next.js, llamar webhook con `informe_id`
3. Verificar que:
   - Obtiene informe de Supabase
   - Genera HTML correctamente
   - Convierte a Word (si CloudConvert configurado)
   - Sube a Google Drive
   - Actualiza URL en Supabase

---

## ⚠️ NOTAS IMPORTANTES

### **Workflow de Word:**
- **CloudConvert:** Requiere cuenta y API key (gratis hasta cierto límite)
- **Alternativa:** Puedes usar Pandoc o librería `docx` en N8N
- **Sin conversión:** El workflow puede funcionar solo subiendo HTML, pero no será un Word real

### **Workflows de Recordatorios:**
- **Cron:** Se ejecutan automáticamente según schedule
- **Prueba manual:** Puedes ejecutar manualmente desde N8N
- **Logs:** Revisa logs de N8N si hay errores

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN

- [ ] Importar `n8n_workflow_recordatorios_cumplimiento_MEJORADO.json`
- [ ] Importar `n8n_workflow_recordatorios_fin_mes_MEJORADO.json`
- [ ] Importar `n8n_workflow_generar_word_MEJORADO.json`
- [ ] Configurar variable `GMAIL_FROM_EMAIL`
- [ ] Configurar credenciales Gmail OAuth2
- [ ] Configurar credenciales Google Drive OAuth2 (solo para Word)
- [ ] Configurar variable `CLOUDCONVERT_API_KEY` (solo para Word)
- [ ] Activar workflows
- [ ] Probar cada workflow manualmente
- [ ] Verificar que los correos se envían correctamente

---

## 🎯 VENTAJAS DE LOS WORKFLOWS MEJORADOS

1. ✅ **Más robustos:** No dependen de Next.js
2. ✅ **Más rápidos:** Consultas directas a Supabase
3. ✅ **Más confiables:** Usan funciones SQL optimizadas
4. ✅ **Más mantenibles:** Todo en un solo lugar (N8N)
5. ✅ **Mejor logging:** Errores más fáciles de diagnosticar

---

## 📞 SOPORTE

Si hay problemas:
1. Revisa logs de N8N
2. Verifica que las funciones SQL existan en Supabase
3. Verifica que las credenciales estén configuradas
4. Prueba las consultas HTTP Request manualmente en N8N

