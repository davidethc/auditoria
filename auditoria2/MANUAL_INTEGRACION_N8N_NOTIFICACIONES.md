# 📘 Manual: Integración N8N - Notificación de Auditados

## 🎯 Objetivo

Automatizar el envío de correos electrónicos a auditados cuando el auditor hace clic en "Notificar Auditados", incluyendo:
1. ✅ Envío de correo con objetivo, alcance y fecha de inicio
2. ✅ Creación automática de solicitudes de documentación (8 días hábiles)
3. ✅ Actualización de estados en la base de datos

---

## 📋 Paso 1: Configurar N8N

### 1.1 Importar el Workflow

1. Abre N8N
2. Ve a **Workflows** → **Import from File**
3. Selecciona el archivo: `n8n_workflow_notificar_auditados.json`
4. El workflow se importará con todos los nodos configurados

### 1.2 Obtener URL del Webhook

1. En el workflow importado, haz clic en el nodo **"Webhook - Recibir Notificación"**
2. En la parte superior verás la URL del webhook, algo como:
   ```
   http://localhost:5678/webhook/notificar-auditados
   ```
   O si es producción:
   ```
   https://tu-n8n.com/webhook/notificar-auditados
   ```
3. **Copia esta URL** - la necesitarás para el sistema

### 1.3 Configurar Credenciales de Gmail

1. Haz clic en el nodo **"Gmail - Enviar Correo"**
2. En **"Credential to connect with"**, haz clic en **"Create New"** o selecciona una existente
3. Configura tu cuenta de Gmail con OAuth2
4. Guarda las credenciales

### 1.4 Activar el Workflow

1. En la parte superior del workflow, activa el toggle **"Active"**
2. El webhook estará disponible para recibir requests

---

## 📋 Paso 2: Configurar el Sistema (Next.js)

### 2.1 Agregar Variable de Entorno

1. Abre el archivo `.env.local` (o créalo si no existe)
2. Agrega la URL del webhook:

```env
NEXT_PUBLIC_N8N_WEBHOOK_URL=http://localhost:5678/webhook/notificar-auditados
```

**Para producción:**
```env
NEXT_PUBLIC_N8N_WEBHOOK_URL=https://tu-n8n.com/webhook/notificar-auditados
```

### 2.2 Verificar que el Código Esté Actualizado

El archivo `components/BotonNotificar.tsx` ya está modificado para:
- ✅ Llamar al webhook después de insertar en DB
- ✅ Enviar todos los datos necesarios
- ✅ No bloquear si el webhook falla (los datos quedan en DB)

### 2.3 Reiniciar el Servidor

```bash
npm run dev
```

---

## 🔄 Flujo Completo Paso a Paso

### **En el Sistema (Next.js):**

1. **Auditor completa la preparación:**
   - Objetivo ✅
   - Alcance ✅
   - Criterios ✅
   - (Opcional) Riesgos, Metodología, Recursos

2. **Auditor agrega auditados:**
   - En la sección "Participantes"
   - Selecciona usuarios con rol "AUDITADO"

3. **Auditor hace clic en "Notificar Auditados":**
   - El sistema valida que todo esté completo
   - Inserta en `comunicaciones_auditado` (metodo_envio: 'SISTEMA')
   - Actualiza `auditoria_participantes` (estado: 'NOTIFICADO')
   - Actualiza `auditorias` (participantes_notificados: true)
   - **NUEVO:** Llama al webhook de N8N con todos los datos

### **En N8N (Automático):**

1. **Webhook recibe el POST:**
   - Recibe: `auditoria_id`, `preparacion`, `actividad`, `fechas`, `auditados`

2. **Code - Validar y Preparar:**
   - Valida que tenga `auditoria_id`
   - Verifica si necesita consultar DB (si faltan datos)

3. **IF - ¿Necesita consultar DB?**
   - Si faltan datos → Consulta función SQL
   - Si tiene todos los datos → Continúa directamente

4. **HTTP Request - Consultar DB (si es necesario):**
   - Llama a `get_notificacion_auditados_data(auditoria_id)`
   - Obtiene todos los datos completos

5. **Code - Preparar Datos Completos:**
   - Combina datos del webhook con datos de DB
   - Estructura datos para procesamiento

6. **Split Out - Por Auditado:**
   - Divide en items (uno por cada auditado)

7. **Code - Generar HTML:**
   - Genera HTML profesional del correo con:
     - Objetivo
     - Alcance
     - Fecha de inicio
     - Criterios, Riesgos (si existen)
     - Solicitud de documentación (8 días hábiles)
   - Calcula fecha límite automáticamente

8. **Gmail - Enviar Correo:**
   - Envía correo HTML a cada auditado
   - Asunto: "Auditoría - Actividad #X - Notificación de Inicio"

9. **HTTP Request - Crear Solicitud Documentación:**
   - Crea registro en `solicitudes_documentacion` para cada auditado
   - Título: "Solicitud de Documentación - Auditoría"
   - Fecha límite: 8 días hábiles desde hoy
   - Estado: 'PENDIENTE'

10. **HTTP Request - Actualizar Comunicación:**
    - Actualiza `comunicaciones_auditado.confirmado = true`
    - Actualiza `metodo_envio = 'AMBOS'` (SISTEMA + EMAIL)
    - Marca `fecha_confirmacion`

---

## 📊 Estructura de Datos

### **Datos que envía el Sistema al Webhook:**

```json
{
  "auditoria_id": "uuid",
  "preparacion": {
    "objetivo": "...",
    "alcance": "...",
    "criterios": "...",
    "riesgos": "...",
    "metodologia": "...",
    "recursos_necesarios": "..."
  },
  "actividad": {
    "numero": 1,
    "descripcion": "...",
    "componente": "...",
    "subcomponente": "...",
    "priority": "..."
  },
  "fechas": {
    "inicio": "2026-01-15",
    "fin": "2026-02-28"
  },
  "auditados": [
    {
      "user_id": "uuid",
      "comunicacion_id": "uuid"
    }
  ],
  "comunicaciones_ids": ["uuid1", "uuid2"]
}
```

### **Datos que retorna la función SQL (si se consulta):**

```json
{
  "auditoria": {
    "id": "uuid",
    "fecha_inicio": "2026-01-15",
    "fecha_fin": "2026-02-28",
    "estado": "PLANIFICADA"
  },
  "preparacion": {
    "objetivo": "...",
    "alcance": "...",
    "criterios": "...",
    "riesgos": "...",
    "metodologia": "...",
    "recursos_necesarios": "..."
  },
  "actividad": {
    "numero": 1,
    "descripcion": "...",
    "componente": "...",
    "subcomponente": "...",
    "priority": "..."
  },
  "auditor_responsable": {
    "id": "uuid",
    "nombre": "...",
    "email": "..."
  },
  "auditados": [
    {
      "user_id": "uuid",
      "email": "auditado@example.com",
      "nombre": "Nombre Auditado",
      "comunicacion_id": "uuid"
    }
  ]
}
```

---

## ✅ Verificación

### **Verificar que Funciona:**

1. **En el Sistema:**
   - Completa preparación
   - Agrega auditados
   - Haz clic en "Notificar Auditados"
   - Debe mostrar: "✅ Información enviada a X auditado(s)"

2. **En N8N:**
   - Ve a **Executions** (ejecuciones)
   - Debe aparecer una ejecución nueva
   - Verifica que todos los nodos tengan ✅ verde

3. **En Gmail:**
   - Cada auditado debe recibir un correo
   - El correo debe tener HTML formateado
   - Debe incluir objetivo, alcance, fecha de inicio

4. **En la Base de Datos:**
   - `comunicaciones_auditado.confirmado` debe ser `true`
   - `comunicaciones_auditado.metodo_envio` debe ser `'AMBOS'`
   - `solicitudes_documentacion` debe tener registros nuevos
   - `solicitudes_documentacion.fecha_limite` debe ser 8 días hábiles desde hoy

---

## 🔧 Troubleshooting

### **Problema 1: El webhook no se ejecuta**

**Síntomas:**
- Los datos se guardan en DB pero no se envían correos

**Soluciones:**
1. Verifica que el workflow esté **activo** en N8N
2. Verifica la URL del webhook en `.env.local`
3. Verifica que N8N esté corriendo
4. Revisa la consola del navegador para ver errores de fetch

### **Problema 2: Error 404 en webhook**

**Síntomas:**
- Error en consola: "Failed to fetch" o 404

**Soluciones:**
1. Verifica que la URL del webhook sea correcta
2. Verifica que el path del webhook sea: `/webhook/notificar-auditados`
3. Si N8N está en producción, verifica que la URL sea HTTPS

### **Problema 3: Los correos no se envían**

**Síntomas:**
- El workflow se ejecuta pero no llegan correos

**Soluciones:**
1. Verifica credenciales de Gmail en N8N
2. Verifica que los emails de auditados sean válidos
3. Revisa los logs de ejecución en N8N
4. Verifica que el nodo Gmail tenga permisos para enviar

### **Problema 4: No se crean solicitudes de documentación**

**Síntomas:**
- Los correos se envían pero no hay registros en `solicitudes_documentacion`

**Soluciones:**
1. Verifica que el nodo "HTTP Request - Crear Solicitud" se ejecute
2. Revisa los logs de ejecución en N8N
3. Verifica permisos RLS en Supabase para insertar en `solicitudes_documentacion`

### **Problema 5: Fecha límite incorrecta**

**Síntomas:**
- La fecha límite no es 8 días hábiles

**Soluciones:**
1. El código calcula 8 días hábiles (excluye sábados y domingos)
2. Verifica que el cálculo sea correcto en el nodo "Code - Generar HTML"
3. Si necesitas ajustar, modifica el código JavaScript en ese nodo

---

## 📝 Notas Importantes

1. **El sistema guarda primero en DB**: Si N8N falla, los datos no se pierden
2. **El webhook es asíncrono**: No bloquea la UI del sistema
3. **Si el webhook falla**: Solo se loguea el error, no se muestra al usuario
4. **Las solicitudes se crean automáticamente**: Cada auditado recibe una solicitud de documentación
5. **La fecha límite se calcula automáticamente**: 8 días hábiles desde hoy

---

## 🎯 Resultado Final

Cuando el auditor hace clic en "Notificar Auditados":

✅ **Se guarda en DB** (como antes)
✅ **Se envía correo real** a cada auditado (NUEVO)
✅ **Se crea solicitud de documentación** automáticamente (NUEVO)
✅ **Se actualiza estado** de comunicación (confirmado = true)

Cada auditado recibe:
- 📧 Correo con objetivo, alcance, fecha de inicio
- 📄 Solicitud de documentación con plazo de 8 días hábiles
- 🔗 Link al sistema para ver más detalles

---

## 📞 Soporte

Si algo no funciona:
1. Revisa los logs de ejecución en N8N
2. Revisa la consola del navegador
3. Verifica que todas las variables de entorno estén configuradas
4. Verifica que el workflow esté activo en N8N

