# ✅ Verificar que el Webhook Esté Activo

## 🔍 Cómo Verificar en N8N

### **1. Verificar que el Workflow Esté Activo**

1. Abre N8N: `http://localhost:5678`
2. Ve a **Workflows**
3. Busca: **"Notificar Auditados - Envío de Correos y Solicitudes"**
4. **Verifica el estado:**
   - ✅ **Verde/Active** = Está activo
   - ❌ **Gris/Inactive** = No está activo (haz clic para activar)

### **2. Verificar el Nodo Webhook**

1. **Abre el workflow** haciendo clic en él
2. Busca el nodo **"Webhook - Recibir Notificación"**
3. **Haz clic en el nodo**
4. En la parte superior del nodo, verás:
   - **URL del webhook:** `http://localhost:5678/webhook/notificar-auditados`
   - **Estado:** Debe estar configurado correctamente

### **3. Probar el Webhook**

```bash
curl -X POST http://localhost:5678/webhook/notificar-auditados \
  -H "Content-Type: application/json" \
  -d '{"auditoria_id": "bb000000-0000-0000-0000-000000000001"}'
```

**Si está activo, debe retornar:**
```json
{
  "success": true,
  "message": "Notificación recibida",
  "auditoria_id": "bb000000-0000-0000-0000-000000000001"
}
```

**Si NO está activo, retornará:**
```json
{
  "code": 404,
  "message": "The requested webhook \"POST notificar-auditados\" is not registered."
}
```

---

## 🎯 Solución Rápida

**Si el webhook no está activo:**

1. En N8N, ve al workflow
2. **Activa el toggle** en la parte superior derecha
3. Prueba el curl de nuevo

---

## 📝 Nota Importante

- **El workflow DEBE estar activo** para que el webhook funcione
- **Los webhooks solo funcionan en workflows activos**
- **Puedes activar/desactivar el workflow cuando quieras**

