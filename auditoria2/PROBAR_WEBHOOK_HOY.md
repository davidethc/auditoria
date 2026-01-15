# 🚀 Probar Webhook HOY - Guía Paso a Paso

## ⚡ Pasos Rápidos (5 minutos)

### **Paso 1: Crear Datos de Prueba en la Base de Datos**

1. **Abre Supabase Dashboard:**
   - Ve a: https://supabase.com/dashboard/project/ksnehijfwxtfbspqvdwq
   - Ve a **SQL Editor**

2. **Ejecuta el script:**
   - Copia y pega el contenido de `DATOS_PRUEBA_WEBHOOK.sql`
   - Haz clic en **Run**
   - Debe mostrar: `✅ Auditoría de Prueba Creada`

3. **Copia el ID de la auditoría:**
   ```
   bb000000-0000-0000-0000-000000000001
   ```

---

### **Paso 2: Configurar N8N**

1. **Abre N8N:**
   - Local: `http://localhost:5678`
   - O tu URL de producción

2. **Importa el workflow:**
   - Ve a **Workflows** → **Import from File**
   - Selecciona: `n8n_workflow_notificar_auditados.json`

3. **Configura el Webhook:**
   - Haz clic en el nodo **"Webhook - Recibir Notificación"**
   - Copia la URL que aparece arriba (ej: `http://localhost:5678/webhook/notificar-auditados`)

4. **Configura Gmail (IMPORTANTE):**
   - Haz clic en el nodo **"Gmail - Enviar Correo"**
   - En **"Credential to connect with"**, haz clic en **"Create New"**
   - Selecciona **"Gmail OAuth2"**
   - Sigue los pasos para autenticar tu cuenta de Gmail
   - Guarda las credenciales

5. **Activa el workflow:**
   - Toggle **"Active"** en la parte superior del workflow
   - El webhook estará disponible

---

### **Paso 3: Probar el Webhook**

#### **Opción A: Desde la Terminal (Más Rápido)**

```bash
curl -X POST http://localhost:5678/webhook/notificar-auditados \
  -H "Content-Type: application/json" \
  -d '{"auditoria_id": "bb000000-0000-0000-0000-000000000001"}'
```

**Respuesta esperada:**
```json
{
  "success": true,
  "message": "Notificación recibida",
  "auditoria_id": "bb000000-0000-0000-0000-000000000001"
}
```

#### **Opción B: Desde Postman**

1. **Método:** `POST`
2. **URL:** `http://localhost:5678/webhook/notificar-auditados`
3. **Headers:**
   - `Content-Type: application/json`
4. **Body (raw JSON):**
   ```json
   {
     "auditoria_id": "bb000000-0000-0000-0000-000000000001"
   }
   ```
5. **Haz clic en "Send"**

#### **Opción C: Desde el Sistema (Automático)**

1. Ve a la auditoría de prueba en el sistema:
   ```
   http://localhost:3000/auditorias/bb000000-0000-0000-0000-000000000001
   ```
2. Verifica que tenga:
   - ✅ Preparación completa
   - ✅ Al menos un auditado
3. Haz clic en **"Notificar Auditados"**
4. El sistema llamará automáticamente al webhook

---

### **Paso 4: Verificar que Funcionó**

#### **1. Verificar en N8N:**

1. Ve a **Executions** (ejecuciones) en N8N
2. Debe aparecer una ejecución nueva
3. Haz clic en la ejecución
4. Verifica que todos los nodos tengan ✅ verde:
   - ✅ Webhook - Recibir Notificación
   - ✅ Respond to Webhook
   - ✅ Code - Validar y Preparar
   - ✅ IF - ¿Necesita consultar DB?
   - ✅ HTTP Request - Consultar DB (o Code - Preparar Datos si no se consultó)
   - ✅ Code - Preparar Datos Completos
   - ✅ Split Out - Por Auditado
   - ✅ Code - Generar HTML
   - ✅ Gmail - Enviar Correo
   - ✅ HTTP Request - Crear Solicitud Documentación
   - ✅ HTTP Request - Actualizar Comunicación

#### **2. Verificar Correos Enviados:**

- Revisa los emails de:
  - `auditado1@example.com`
  - `auditado2@example.com`
- Deben recibir correos con:
  - Objetivo, alcance, criterios
  - Fecha de inicio
  - Solicitud de documentación (8 días hábiles)

#### **3. Verificar en la Base de Datos:**

Ejecuta en Supabase SQL Editor:

```sql
-- Verificar comunicaciones actualizadas
SELECT 
  id,
  auditoria_id,
  destinatario_id,
  confirmado,
  metodo_envio,
  fecha_confirmacion
FROM comunicaciones_auditado 
WHERE auditoria_id = 'bb000000-0000-0000-0000-000000000001'
ORDER BY fecha_envio DESC;

-- Verificar solicitudes de documentación creadas
SELECT 
  id,
  auditoria_id,
  destinatario_id,
  titulo,
  fecha_limite,
  estado
FROM solicitudes_documentacion 
WHERE auditoria_id = 'bb000000-0000-0000-0000-000000000001'
ORDER BY fecha_creacion DESC;
```

**Resultado esperado:**
- `comunicaciones_auditado.confirmado` = `true`
- `comunicaciones_auditado.metodo_envio` = `'AMBOS'`
- `solicitudes_documentacion` tiene 2 registros (uno por cada auditado)
- `fecha_limite` = 8 días hábiles desde hoy

---

## 🔧 Si Algo No Funciona

### **Error: "Webhook not found" o 404**

**Solución:**
1. Verifica que el workflow esté **activo** en N8N
2. Verifica que la URL sea correcta
3. Verifica que N8N esté corriendo

### **Error: "Falta auditoria_id"**

**Solución:**
- Asegúrate de incluir `auditoria_id` en el body del request
- Usa el ID: `bb000000-0000-0000-0000-000000000001`

### **Error: "Faltan datos necesarios"**

**Solución:**
1. Verifica que ejecutaste el script SQL de datos de prueba
2. Verifica que la auditoría tenga preparación y auditados:
   ```sql
   SELECT * FROM auditoria_preparacion 
   WHERE auditoria_id = 'bb000000-0000-0000-0000-000000000001' 
     AND es_version_actual = true;
   
   SELECT * FROM auditoria_participantes 
   WHERE auditoria_id = 'bb000000-0000-0000-0000-000000000001' 
     AND rol_en_auditoria = 'AUDITADO';
   ```

### **Los correos no se envían**

**Solución:**
1. Verifica credenciales de Gmail en N8N
2. Verifica que los emails de auditados sean válidos
3. Revisa los logs de ejecución en N8N
4. Verifica que el nodo Gmail tenga permisos

### **No se crean solicitudes de documentación**

**Solución:**
1. Verifica que el nodo "HTTP Request - Crear Solicitud" se ejecute
2. Revisa los logs de ejecución en N8N
3. Verifica permisos RLS en Supabase

---

## 📋 Checklist Rápido

- [ ] Script SQL ejecutado en Supabase
- [ ] Workflow importado en N8N
- [ ] Workflow activado en N8N
- [ ] Credenciales de Gmail configuradas
- [ ] URL del webhook copiada
- [ ] Webhook probado (curl, Postman o desde sistema)
- [ ] Ejecución aparece en N8N
- [ ] Correos enviados correctamente
- [ ] Solicitudes creadas en DB
- [ ] Comunicaciones actualizadas en DB

---

## 🎯 Datos para Probar

**ID de Auditoría de Prueba:**
```
bb000000-0000-0000-0000-000000000001
```

**Payload Mínimo:**
```json
{
  "auditoria_id": "bb000000-0000-0000-0000-000000000001"
}
```

**Comando curl:**
```bash
curl -X POST http://localhost:5678/webhook/notificar-auditados \
  -H "Content-Type: application/json" \
  -d '{"auditoria_id": "bb000000-0000-0000-0000-000000000001"}'
```

---

## ✅ Resultado Esperado

Después de ejecutar el webhook:

1. ✅ **Respuesta inmediata:** `{"success": true, "message": "Notificación recibida"}`
2. ✅ **Ejecución en N8N:** Aparece en "Executions" con todos los nodos ✅
3. ✅ **Correos enviados:** Cada auditado recibe un correo HTML
4. ✅ **Solicitudes creadas:** 2 registros en `solicitudes_documentacion`
5. ✅ **Comunicaciones actualizadas:** `confirmado = true`, `metodo_envio = 'AMBOS'`

---

## 🚀 ¡Listo para Probar!

1. Ejecuta el script SQL
2. Configura N8N
3. Prueba el webhook
4. Verifica los resultados

**Tiempo estimado: 5-10 minutos**

