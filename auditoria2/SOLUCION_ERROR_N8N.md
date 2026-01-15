# 🔧 SOLUCIÓN: Error 500 en N8N Workflow

## ❌ Problema
El workflow no puede ejecutarse porque el nodo **"Gmail - Enviar Correo"** no tiene credenciales configuradas.

**Error visible:** Icono rojo ⚠️ en el nodo de Gmail + Error 500 "There was a problem executing the workflow"

---

## ✅ SOLUCIÓN PASO A PASO

### **Paso 1: Configurar Credenciales de Gmail**

1. **Haz clic en el nodo "Gmail - Enviar Correo"** (el que tiene el icono rojo)

2. **En "Credential to connect with":**
   - Si ya tienes credenciales creadas: Selecciónalas del dropdown
   - Si NO tienes credenciales:
     - Haz clic en **"Create New"** o **"OAuth2 API"**
     - Selecciona **"Gmail OAuth2"**

3. **Configuración OAuth2 de Gmail:**
   - **Name:** (déjalo por defecto o pon "Gmail Auditoría")
   - **Google Client ID:** (si ya tienes uno configurado)
   - **Google Client Secret:** (si ya tienes uno configurado)
   - **O haz clic en "Connect my account"** para autenticarte con Google

4. **Autoriza la conexión:**
   - Se abrirá una ventana para autorizar N8N a enviar correos desde tu cuenta de Gmail
   - Acepta los permisos

5. **Guarda las credenciales:**
   - Haz clic en **"Save"** o **"Create"**

6. **Cierra el modal del nodo:**
   - El icono rojo debería desaparecer ✅

---

### **Paso 2: Guardar el Workflow**

1. Haz clic en **"Save"** en la parte superior del workflow

2. Verifica que el nodo de Gmail ya no tenga el icono rojo

---

### **Paso 3: Probar el Workflow**

1. **Desde la terminal (opcional):**
```bash
curl -X POST http://localhost:5678/webhook-test/notificar-auditor-actividad \
  -H "Content-Type: application/json" \
  -d '{
    "activity_id": "test-123",
    "activity_number": 1,
    "activity_description": "Prueba de notificación",
    "auditor_email": "tu-email@ejemplo.com",
    "auditor_name": "Test Auditor",
    "validation_status": "pendiente"
  }'
```

2. **O desde el sistema:**
   - Ve a `/plan-trabajo`
   - Haz clic en "Notificar por Correo" en cualquier actividad
   - Debería funcionar sin errores ✅

---

## ⚠️ NOTAS IMPORTANTES

### **¿Por qué pasa esto?**
- Las credenciales NO se exportan en el JSON del workflow (por seguridad)
- Cada usuario debe configurar sus propias credenciales en N8N
- Sin credenciales, N8N no puede ejecutar nodos que requieren autenticación

### **Si no tienes acceso a Gmail OAuth2:**
- Opción 1: Usa una cuenta personal de Gmail para pruebas
- Opción 2: Configura Gmail SMTP (menos seguro, requiere contraseña de app)
- Opción 3: Usa otro servicio de email (SendGrid, Mailgun, etc.)

### **Alternativa Rápida (SMTP):**
Si OAuth2 es complicado, puedes usar Gmail SMTP:

1. En el nodo de Gmail, cambia de "OAuth2" a **"User/Password"**
2. Usa tu email y una **"App Password"** de Gmail:
   - Ve a tu cuenta de Google → Seguridad → Contraseñas de aplicaciones
   - Genera una contraseña de app para "Correo"
   - Úsala en lugar de tu contraseña normal

---

## ✅ Checklist

- [ ] Nodo de Gmail configurado con credenciales
- [ ] Icono rojo desaparecido
- [ ] Workflow guardado
- [ ] Prueba realizada exitosamente

---

**Si sigues teniendo problemas, verifica:**
1. Que N8N esté corriendo (`npm run n8n` o tu método)
2. Que el puerto 5678 esté disponible
3. Que las credenciales estén correctamente guardadas
4. Revisa los logs de N8N para más detalles del error
