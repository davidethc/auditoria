# 📄 GUÍA: GENERAR GOOGLE DOCS (SOLUCIÓN MEJORADA)

## ✅ SOLUCIÓN IMPLEMENTADA

He creado un **nuevo workflow** que usa la **API de Google Docs directamente** (sin HTML). Esto es mucho mejor porque:

- ✅ **Formato nativo** de Google Docs (no conversiones)
- ✅ **Sin problemas de HTML** o código fuente visible
- ✅ **Control total** de estilos y formato
- ✅ **Más rápido y estable**

---

## 📋 ARCHIVO NUEVO

**Usa este archivo:** `n8n_workflow_generar_google_docs.json`

**Reemplaza:** `n8n_workflow_generar_word_MEJORADO.json` (el anterior con problemas)

---

## 🔧 CÓMO FUNCIONA

### **Flujo del Workflow:**

1. **Webhook** recibe `informe_id`
2. **Obtiene informe** completo de Supabase
3. **Prepara datos** estructurados (sin HTML)
4. **Crea documento** Google Docs vacío con título
5. **Inserta contenido** usando `batchUpdate` con:
   - Títulos formateados (negrita, tamaño)
   - Párrafos normales
   - Etiquetas en negrita (De:, Para:, etc.)
6. **Mueve documento** a carpeta en Google Drive
7. **Actualiza URL** en Supabase

---

## ✅ PASOS PARA ACTIVAR

### **PASO 1: Importar Nuevo Workflow**

1. Abre N8N: `http://localhost:5678`
2. **Elimina** el workflow anterior (`generar-word-informe`)
3. **Workflows** → **Import from File**
4. Selecciona: `n8n_workflow_generar_google_docs.json`
5. Click **"Import"**

---

### **PASO 2: Configurar Credenciales Google Docs**

**IMPORTANTE:** Necesitas credenciales con scope de **Google Docs API** (no solo Drive)

1. Haz clic en el nodo **"HTTP Request - Crear Google Docs"**
2. En **"Authentication"** → **"OAuth2"**
3. **"Credential to connect with"** → **"Create New"**
4. Selecciona **"Google OAuth2 API"**
5. **Scopes requeridos:**
   - `https://www.googleapis.com/auth/documents`
   - `https://www.googleapis.com/auth/drive.file`
6. Click **"Connect my account"**
7. Autoriza con Google
8. Guarda credenciales
9. **Repite** para los otros nodos HTTP que usan Google (BatchUpdate, Mover a Carpeta)

---

### **PASO 3: Activar Workflow**

1. Click **"Save"**
2. Activa el workflow (toggle **"Active"**)
3. El webhook URL será: `http://localhost:5678/webhook-test/generar-word-informe`

---

### **PASO 4: Verificar Variable de Entorno**

Ya está en `.env.local`:
```bash
NEXT_PUBLIC_N8N_WEBHOOK_URL_GENERAR_WORD=http://localhost:5678/webhook-test/generar-word-informe
```

---

## 🧪 PROBAR

1. Ve a `/auditorias/[id]/informe`
2. Click en **"Generar Word"**
3. Espera 10-20 segundos
4. Revisa:
   - Consola del navegador (F12)
   - N8N → Executions
   - Google Drive → Carpeta configurada

---

## 📊 RESULTADO ESPERADO

- ✅ Documento de **Google Docs** (no HTML)
- ✅ Formato profesional con títulos en negrita
- ✅ Se ve correctamente renderizado
- ✅ Puedes editarlo directamente en Google Docs
- ✅ Puedes exportarlo como Word desde Google Docs

---

## ⚠️ SOLUCIÓN AL ERROR "Failed to fetch"

Este error puede ser por:

1. **N8N no está corriendo:**
   ```bash
   # Verifica que N8N esté activo
   # Debería estar en http://localhost:5678
   ```

2. **CORS o red:**
   - Verifica que puedas acceder a `http://localhost:5678` desde el navegador
   - El webhook debe estar activo (toggle "Active")

3. **URL incorrecta:**
   - Verifica que la URL en `.env.local` coincida con la del webhook en N8N

---

## 🔍 VERIFICACIÓN

### **Nodos del Workflow (10 nodos):**

1. ✅ Webhook - Recibir Solicitud
2. ✅ Respond to Webhook
3. ✅ Code - Validar
4. ✅ HTTP Request - Obtener Informe
5. ✅ Code - Preparar Datos Estructurados
6. ✅ HTTP Request - Crear Google Docs
7. ✅ Code - Generar Requests batchUpdate
8. ✅ HTTP Request - BatchUpdate Google Docs
9. ✅ HTTP Request - Mover a Carpeta
10. ✅ HTTP Request - Actualizar URL en Supabase
11. ✅ Code - Resultado Final

---

## ✅ CHECKLIST

- [ ] Workflow nuevo importado (`n8n_workflow_generar_google_docs.json`)
- [ ] Credenciales Google OAuth2 configuradas con scopes correctos
- [ ] Workflow activado
- [ ] Variable de entorno actualizada (ya está)
- [ ] Servidor Next.js reiniciado
- [ ] Probado desde la interfaz
- [ ] Documento aparece en Google Drive como Google Docs (no HTML)

---

**¡Listo!** Ahora el documento se generará como Google Docs nativo, sin problemas de HTML. 🎉
