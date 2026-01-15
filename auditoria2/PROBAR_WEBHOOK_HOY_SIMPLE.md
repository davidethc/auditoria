# 🚀 Probar Webhook HOY - Guía Simple

## ⚡ Opción Más Rápida: Usar una Auditoría Existente

### **Paso 1: Encontrar una Auditoría para Probar**

1. **Abre Supabase SQL Editor:**
   - Ve a: https://supabase.com/dashboard/project/ksnehijfwxtfbspqvdwq
   - Ve a **SQL Editor**

2. **Ejecuta este query para ver auditorías disponibles:**
   ```sql
   SELECT 
     a.id,
     a.estado,
     a.fecha_inicio,
     COUNT(ap.user_id) FILTER (WHERE ap.rol_en_auditoria = 'AUDITADO') as auditados_count,
     CASE WHEN p.objetivo IS NOT NULL THEN '✅' ELSE '❌' END as tiene_preparacion
   FROM auditorias a
   LEFT JOIN auditoria_participantes ap ON a.id = ap.auditoria_id
   LEFT JOIN auditoria_preparacion p ON a.id = p.auditoria_id AND p.es_version_actual = true
   WHERE a.estado = 'PLANIFICADA'
   GROUP BY a.id, a.estado, a.fecha_inicio, p.objetivo
   ORDER BY a.fecha_inicio DESC
   LIMIT 5;
   ```

3. **Copia el ID de una auditoría** que tenga:
   - ✅ Estado: `PLANIFICADA`
   - ✅ Tiene preparación (objetivo, alcance, criterios)
   - ✅ Tiene al menos 1 auditado

---

### **Paso 2: Verificar/Completar la Preparación**

Si la auditoría no tiene preparación completa, ejecuta:

```sql
-- Reemplaza 'TU-AUDITORIA-ID-AQUI' con el ID real
INSERT INTO auditoria_preparacion (
  auditoria_id,
  objetivo,
  alcance,
  criterios,
  es_version_actual
)
VALUES (
  'TU-AUDITORIA-ID-AQUI'::uuid,
  'Prueba de Webhook - Objetivo de prueba',
  'Alcance de prueba para webhook',
  'Criterios de prueba',
  true
)
ON CONFLICT (auditoria_id) WHERE es_version_actual = true 
DO UPDATE SET
  objetivo = 'Prueba de Webhook - Objetivo de prueba',
  alcance = 'Alcance de prueba para webhook',
  criterios = 'Criterios de prueba';
```

---

### **Paso 3: Verificar/Agregar Auditados**

Si la auditoría no tiene auditados, ejecuta:

```sql
-- Reemplaza 'TU-AUDITORIA-ID-AQUI' con el ID real
INSERT INTO auditoria_participantes (
  auditoria_id,
  user_id,
  rol_en_auditoria,
  estado_participacion
)
SELECT
  'TU-AUDITORIA-ID-AQUI'::uuid,
  u.id,
  'AUDITADO',
  'PENDIENTE'
FROM users u
WHERE u.id IN (
  SELECT id FROM users LIMIT 2  -- Usa los primeros 2 usuarios disponibles
)
AND NOT EXISTS (
  SELECT 1 FROM auditoria_participantes 
  WHERE auditoria_id = 'TU-AUDITORIA-ID-AQUI'::uuid 
    AND user_id = u.id
)
LIMIT 2;
```

---

### **Paso 4: Configurar N8N**

1. **Abre N8N:**
   - Local: `http://localhost:5678`
   - O tu URL de producción

2. **Importa el workflow:**
   - Ve a **Workflows** → **Import from File**
   - Selecciona: `n8n_workflow_notificar_auditados.json`

3. **Configura Gmail:**
   - Haz clic en el nodo **"Gmail - Enviar Correo"**
   - En **"Credential to connect with"**, haz clic en **"Create New"**
   - Selecciona **"Gmail OAuth2"** y autentica

4. **Activa el workflow:**
   - Toggle **"Active"** en la parte superior

5. **Copia la URL del webhook:**
   - Haz clic en el nodo **"Webhook - Recibir Notificación"**
   - Copia la URL (ej: `http://localhost:5678/webhook/notificar-auditados`)

---

### **Paso 5: Probar el Webhook**

#### **Opción A: Desde la Terminal**

```bash
curl -X POST http://localhost:5678/webhook/notificar-auditados \
  -H "Content-Type: application/json" \
  -d '{"auditoria_id": "TU-AUDITORIA-ID-AQUI"}'
```

**Reemplaza `TU-AUDITORIA-ID-AQUI` con el ID real que copiaste en el Paso 1.**

#### **Opción B: Desde Postman**

1. **Método:** `POST`
2. **URL:** `http://localhost:5678/webhook/notificar-auditados`
3. **Headers:**
   - `Content-Type: application/json`
4. **Body (raw JSON):**
   ```json
   {
     "auditoria_id": "TU-AUDITORIA-ID-AQUI"
   }
   ```

#### **Opción C: Desde el Sistema**

1. Ve a la auditoría en el sistema:
   ```
   http://localhost:3000/auditorias/TU-AUDITORIA-ID-AQUI
   ```
2. Verifica que tenga preparación y auditados
3. Haz clic en **"Notificar Auditados"**

---

### **Paso 6: Verificar Resultados**

#### **1. En N8N:**
- Ve a **Executions**
- Debe aparecer una ejecución nueva
- Todos los nodos deben tener ✅ verde

#### **2. Correos:**
- Revisa los emails de los auditados
- Deben recibir correos HTML con objetivo, alcance, fecha

#### **3. Base de Datos:**
```sql
-- Verificar comunicaciones
SELECT * FROM comunicaciones_auditado 
WHERE auditoria_id = 'TU-AUDITORIA-ID-AQUI'::uuid
  AND confirmado = true;

-- Verificar solicitudes
SELECT * FROM solicitudes_documentacion 
WHERE auditoria_id = 'TU-AUDITORIA-ID-AQUI'::uuid;
```

---

## 📋 Checklist Rápido

- [ ] Encontré una auditoría con estado `PLANIFICADA`
- [ ] La auditoría tiene preparación (objetivo, alcance, criterios)
- [ ] La auditoría tiene al menos 1 auditado
- [ ] Workflow importado en N8N
- [ ] Workflow activado
- [ ] Credenciales de Gmail configuradas
- [ ] URL del webhook copiada
- [ ] Webhook probado
- [ ] Ejecución aparece en N8N
- [ ] Correos enviados
- [ ] Solicitudes creadas en DB

---

## 🎯 Datos Necesarios

**Solo necesitas:**
1. **ID de una auditoría existente** (con estado `PLANIFICADA`)
2. **URL del webhook** (de N8N)

**Payload mínimo:**
```json
{
  "auditoria_id": "TU-AUDITORIA-ID-AQUI"
}
```

---

## ✅ Resultado Esperado

1. ✅ Respuesta: `{"success": true, "message": "Notificación recibida"}`
2. ✅ Ejecución en N8N con todos los nodos ✅
3. ✅ Correos enviados a auditados
4. ✅ Solicitudes de documentación creadas
5. ✅ Comunicaciones actualizadas

---

## 🚀 ¡Listo para Probar!

1. Encuentra una auditoría existente
2. Configura N8N
3. Prueba el webhook
4. Verifica resultados

**Tiempo estimado: 3-5 minutos**

