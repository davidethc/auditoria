# 📄 GUÍA: CÓMO ACTIVAR Y USAR "GENERAR WORD"

## 🎯 ¿QUÉ HACE ESTE WORKFLOW?

El workflow `n8n_workflow_generar_word_MEJORADO.json` genera automáticamente un documento Word del informe de auditoría y lo sube a Google Drive.

**Flujo completo:**
1. Auditor hace clic en "Generar Word" en `/auditorias/[id]/informe`
2. Sistema llama API: `/api/generar-word-informe`
3. API llama webhook N8N: `http://localhost:5678/webhook-test/generar-word-informe`
4. N8N obtiene informe completo de Supabase
5. N8N genera HTML con formato profesional
6. N8N convierte HTML a Word
7. N8N sube archivo a Google Drive
8. N8N actualiza `documento_word_url` en la base de datos

---

## ✅ PASOS PARA ACTIVAR

### **PASO 1: Importar Workflow en N8N**

1. Abre N8N: `http://localhost:5678`
2. Ve a **"Workflows"** → **"Import from File"**
3. Selecciona: `n8n_workflow_generar_word_MEJORADO.json`
4. Click en **"Import"**

---

### **PASO 2: Configurar Credenciales**

#### **A. Google Drive OAuth2**

1. Haz clic en el nodo **"Google Drive - Upload File"** (debería tener icono rojo)
2. En **"Credential to connect with"** → **"Create New"**
3. Selecciona **"Google Drive OAuth2"**
4. Click en **"Connect my account"**
5. Autoriza con tu cuenta de Google
6. Guarda las credenciales
7. **Verifica:** El icono rojo debe desaparecer ✅

#### **B. Supabase (si es necesario)**

El workflow ya tiene la API key de Supabase hardcodeada, pero si quieres usar variables de entorno:

1. Ve a **"Settings"** → **"Credentials"**
2. Crea credenciales para Supabase si es necesario
3. Actualiza el nodo **"HTTP Request - Obtener Informe de Supabase"**

---

### **PASO 3: Activar Workflow y Obtener URL**

1. Haz clic en **"Save"** (esquina superior derecha)
2. Activa el workflow (toggle **"Active"** en parte superior)
3. Haz clic en el nodo **"Webhook - Recibir Solicitud"**
4. **Copia la URL** que aparece arriba del nodo
   - Debería ser: `http://localhost:5678/webhook-test/generar-word-informe`
5. **Guarda esta URL** para el siguiente paso

---

### **PASO 4: Configurar Variable de Entorno**

**Actualiza `.env.local`:**

```bash
NEXT_PUBLIC_N8N_WEBHOOK_URL_GENERAR_WORD=http://localhost:5678/webhook-test/generar-word-informe
```

**⚠️ IMPORTANTE:** Reemplaza la URL con la URL real que copiaste de N8N (puede variar)

---

### **PASO 5: Reiniciar Servidor Next.js**

```bash
# Detén el servidor (Ctrl+C) y vuelve a iniciarlo:
npm run dev
```

---

## 🧪 CÓMO PROBAR

### **Opción 1: Desde la Interfaz (Recomendado)**

1. Ve a una auditoría que tenga un informe creado
2. Ruta: `/auditorias/[id]/informe`
3. Haz clic en el botón **"Generar Word"**
4. Espera 1-2 minutos
5. Revisa:
   - Consola del navegador (F12) para ver logs
   - N8N para ver ejecución del workflow
   - Google Drive para ver el archivo generado

### **Opción 2: Desde Terminal (Testing)**

```bash
# Usa el script de prueba
./probar_generar_word.sh <informe_id>

# Ejemplo:
./probar_generar_word.sh 40ae1fa5-6f17-4fd0-9f87-47a445e52d05
```

---

## 📋 VERIFICACIÓN DEL WORKFLOW

### **Nodos que debe tener:**

1. ✅ **Webhook - Recibir Solicitud** (path: `generar-word-informe`)
2. ✅ **Respond to Webhook**
3. ✅ **Code - Validar** (valida `informe_id`)
4. ✅ **HTTP Request - Obtener Informe de Supabase** (obtiene datos)
5. ✅ **Code - Preparar Datos Informe** (prepara datos)
6. ✅ **Code - Generar HTML** (genera HTML con formato Word)
7. ✅ **Code - Convertir HTML a Word** (prepara para subir)
8. ✅ **Google Drive - Upload File** (sube a Drive)
9. ✅ **HTTP Request - Actualizar BD** (actualiza `documento_word_url`)

### **Verificar que:**

- ✅ Webhook está activo (toggle "Active")
- ✅ Credenciales Google Drive configuradas
- ✅ URL del webhook copiada correctamente
- ✅ Variable de entorno actualizada

---

## 🔧 CONFIGURACIÓN ADICIONAL

### **Carpeta en Google Drive**

El workflow sube el archivo a la raíz de Google Drive. Si quieres cambiar la carpeta:

1. Edita el nodo **"Google Drive - Upload File"**
2. En **"Parent Folder"**, selecciona o crea una carpeta
3. Ejemplo: `Auditorías/Informes Word`

### **Formato del Nombre del Archivo**

El nombre del archivo se genera automáticamente:
- Formato: `{encabezado}_{fecha_inicio}.docx`
- Ejemplo: `INFORME_ASIS-048-2025_01-septiembre-2025.docx`

---

## ❌ PROBLEMAS COMUNES

### **Error: "Falta informe_id"**
- **Causa:** El request no incluye `informe_id`
- **Solución:** Verifica que el botón "Generar Word" esté llamando correctamente a la API

### **Error: "No se encontró el informe en Supabase"**
- **Causa:** El `informe_id` no existe o hay problema de permisos RLS
- **Solución:** Verifica que el informe existe y que las credenciales de Supabase son correctas

### **Error: "Error al subir a Google Drive"**
- **Causa:** Credenciales Google Drive no configuradas o expiradas
- **Solución:** Reconfigura las credenciales OAuth2 de Google Drive

### **Error: "Error al actualizar BD"**
- **Causa:** Problema con permisos RLS o credenciales Supabase
- **Solución:** Verifica permisos RLS en la tabla `auditoria_informe`

---

## 📊 LOGS Y DEBUGGING

### **En N8N:**
1. Ve a **"Executions"** en N8N
2. Busca la ejecución más reciente
3. Revisa cada nodo para ver errores

### **En Next.js:**
1. Revisa la consola del servidor (donde corre `npm run dev`)
2. Busca logs que empiecen con: `📤 Llamando webhook de N8N`

### **En el Navegador:**
1. Abre DevTools (F12)
2. Ve a la pestaña **"Console"**
3. Busca logs de la función `handleGenerarWord`

---

## ✅ CHECKLIST FINAL

- [ ] Workflow importado en N8N
- [ ] Credenciales Google Drive OAuth2 configuradas
- [ ] Workflow activado (toggle "Active")
- [ ] URL del webhook copiada
- [ ] Variable de entorno actualizada en `.env.local`
- [ ] Servidor Next.js reiniciado
- [ ] Probado desde la interfaz
- [ ] Archivo aparece en Google Drive
- [ ] `documento_word_url` se actualiza en BD

---

**¡Listo!** El workflow debería funcionar correctamente. 🎉
