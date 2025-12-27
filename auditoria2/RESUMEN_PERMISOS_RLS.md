# 🔐 Resumen de Políticas RLS y Permisos

## 📋 Descripción General

Este documento explica el sistema de permisos y políticas RLS (Row Level Security) implementado para el sistema de auditorías.

---

## 👥 Roles del Sistema

### 1. **auditor_interno** (Auditor Interno)
- **Acceso**: Total a todas las tablas y operaciones
- **Puede**:
  - Crear, leer, actualizar y eliminar planes de auditoría
  - Crear, leer, actualizar y eliminar actividades
  - Crear, leer, actualizar y eliminar auditorías
  - Gestionar usuarios
  - Acceder a todo el sistema sin restricciones

### 2. **auditor** (Auditor)
- **Acceso**: Gestiona auditorías asignadas
- **Puede**:
  - Ver todas las auditorías (solo lectura)
  - Crear y gestionar auditorías donde es responsable (`auditor_responsable_id`)
  - Crear y gestionar preparación de auditorías asignadas
  - Crear y gestionar participantes en sus auditorías
  - Crear y gestionar observaciones en sus auditorías
  - Crear y gestionar informes de sus auditorías
  - Validar actividades asignadas (`auditor_id`)
  - Revisar evidencias de observaciones

### 3. **auditado** (Auditado)
- **Acceso**: Gestiona su participación en auditorías
- **Puede**:
  - Ver auditorías donde es participante
  - Actualizar su propia participación
  - Actualizar observaciones donde es responsable de implementación
  - Crear avances en observaciones donde es responsable
  - Crear evidencias en observaciones donde es responsable
  - Actualizar campos de implementación en informes (estrategia, fechas, entregable)
  - Firmar informes donde es firmante
  - Confirmar lectura de comunicaciones

---

## 📊 Permisos por Tabla

### 1. **users**
| Acción | auditor_interno | auditor | auditado |
|--------|----------------|---------|----------|
| Ver todos | ✅ | ❌ | ❌ |
| Ver propio | ✅ | ✅ | ✅ |
| Actualizar todos | ✅ | ❌ | ❌ |
| Actualizar propio | ✅ | ✅ | ✅ |

### 2. **audit_plans**
| Acción | auditor_interno | auditor | auditado |
|--------|----------------|---------|----------|
| Ver | ✅ | ✅ | ✅ |
| Crear | ✅ | ❌ | ❌ |
| Actualizar | ✅ | ❌ | ❌ |
| Eliminar | ✅ | ❌ | ❌ |

### 3. **audit_activities**
| Acción | auditor_interno | auditor | auditado |
|--------|----------------|---------|----------|
| Ver | ✅ | ✅ | ✅ |
| Crear | ✅ | ❌ | ❌ |
| Actualizar | ✅ | ❌ | ❌ |
| Validar (si asignado) | ✅ | ✅ | ❌ |
| Eliminar | ✅ | ❌ | ❌ |

### 4. **auditorias**
| Acción | auditor_interno | auditor | auditado |
|--------|----------------|---------|----------|
| Ver todas | ✅ | ✅ | ✅ |
| Ver donde participa | ✅ | ✅ | ✅ |
| Crear | ✅ | ❌ | ❌ |
| Actualizar todas | ✅ | ❌ | ❌ |
| Actualizar donde es responsable | ✅ | ✅ | ❌ |
| Eliminar | ✅ | ❌ | ❌ |

### 5. **auditoria_preparacion**
| Acción | auditor_interno | auditor | auditado |
|--------|----------------|---------|----------|
| Ver | ✅ | ✅ | ✅ |
| Crear/Actualizar todas | ✅ | ❌ | ❌ |
| Crear/Actualizar donde es responsable | ✅ | ✅ | ❌ |

### 6. **auditoria_participantes**
| Acción | auditor_interno | auditor | auditado |
|--------|----------------|---------|----------|
| Ver | ✅ | ✅ | ✅ |
| Crear/Actualizar todas | ✅ | ❌ | ❌ |
| Crear/Actualizar donde es responsable | ✅ | ✅ | ❌ |
| Actualizar propia participación | ✅ | ✅ | ✅ |

### 7. **auditoria_observaciones**
| Acción | auditor_interno | auditor | auditado |
|--------|----------------|---------|----------|
| Ver | ✅ | ✅ | ✅ |
| Crear todas | ✅ | ❌ | ❌ |
| Crear donde es responsable | ✅ | ✅ | ❌ |
| Actualizar todas | ✅ | ❌ | ❌ |
| Actualizar donde es responsable | ✅ | ✅ | ❌ |
| Actualizar donde es responsable implementación | ✅ | ✅ | ✅ |

### 8. **observacion_avances**
| Acción | auditor_interno | auditor | auditado |
|--------|----------------|---------|----------|
| Ver | ✅ | ✅ | ✅ |
| Crear todas | ✅ | ❌ | ❌ |
| Crear donde es responsable | ✅ | ❌ | ✅ |
| Actualizar todas | ✅ | ❌ | ❌ |
| Actualizar propias | ✅ | ❌ | ✅ |

### 9. **observacion_evidencias**
| Acción | auditor_interno | auditor | auditado |
|--------|----------------|---------|----------|
| Ver | ✅ | ✅ | ✅ |
| Crear todas | ✅ | ❌ | ❌ |
| Crear donde es responsable | ✅ | ❌ | ✅ |
| Actualizar todas | ✅ | ❌ | ❌ |
| Actualizar propias | ✅ | ❌ | ✅ |
| Revisar (si es auditor responsable) | ✅ | ✅ | ❌ |

### 10. **auditoria_informe**
| Acción | auditor_interno | auditor | auditado |
|--------|----------------|---------|----------|
| Ver | ✅ | ✅ | ✅ |
| Crear todas | ✅ | ❌ | ❌ |
| Crear donde es responsable | ✅ | ✅ | ❌ |
| Actualizar todas | ✅ | ❌ | ❌ |
| Actualizar donde es responsable | ✅ | ✅ | ❌ |
| Actualizar campos de implementación | ✅ | ❌ | ✅ |

### 11. **informe_firmas**
| Acción | auditor_interno | auditor | auditado |
|--------|----------------|---------|----------|
| Ver | ✅ | ✅ | ✅ |
| Crear todas | ✅ | ❌ | ❌ |
| Crear donde es responsable | ✅ | ✅ | ❌ |
| Actualizar propia firma | ✅ | ✅ | ✅ |

### 12. **comunicaciones_auditado**
| Acción | auditor_interno | auditor | auditado |
|--------|----------------|---------|----------|
| Ver | ✅ | ✅ | ✅ |
| Crear todas | ✅ | ❌ | ❌ |
| Crear donde es responsable | ✅ | ✅ | ❌ |
| Actualizar propia comunicación | ✅ | ✅ | ✅ |

---

## 🔧 Funciones Auxiliares

### `get_current_user_role()`
- Retorna el rol del usuario actual
- Usado en todas las políticas RLS

### `is_auditor_interno()`
- Verifica si el usuario es auditor interno
- Retorna `true` o `false`

### `is_auditor()`
- Verifica si el usuario es auditor o auditor interno
- Retorna `true` o `false`

### `is_user_participant_in_auditoria(p_auditoria_id, p_user_id)`
- Verifica si un usuario es participante en una auditoría
- Usado para permitir acceso a auditados

### `is_user_responsable_auditoria(p_auditoria_id, p_user_id)`
- Verifica si un usuario es responsable de una auditoría
- Usado para permitir gestión a auditores

### `is_user_responsable_activity(p_activity_id, p_user_id)`
- Verifica si un usuario es responsable de una actividad
- Usado para validación de actividades

---

## ⚡ Triggers Implementados

### 1. **on_auth_user_created**
- **Tabla**: `auth.users`
- **Acción**: Crea automáticamente un registro en `users` cuando se crea un usuario en auth

### 2. **update_notification_date_trigger**
- **Tabla**: `audit_activities`
- **Acción**: Calcula automáticamente `notification_date` basado en `cutoff_date`

### 3. **update_auditor_assigned_at_trigger**
- **Tabla**: `audit_activities`
- **Acción**: Establece `auditor_assigned_at` cuando se asigna un auditor

### 4. **validate_auditor_role_trigger**
- **Tabla**: `auditorias`
- **Acción**: Valida que `auditor_responsable_id` sea un auditor o auditor interno

### 5. **update_fecha_cierre_trigger**
- **Tabla**: `auditorias`
- **Acción**: Establece `fecha_cierre` cuando el estado cambia a 'CERRADA'

### 6. **update_auditorias_updated_at**
- **Tabla**: `auditorias`
- **Acción**: Actualiza `actualizada_at` automáticamente

### 7. **set_fecha_notificacion_trigger**
- **Tabla**: `auditoria_participantes`
- **Acción**: Establece `fecha_notificacion` cuando se notifica a un participante

### 8. **update_auditoria_observaciones_updated_at**
- **Tabla**: `auditoria_observaciones`
- **Acción**: Actualiza `updated_at` automáticamente

### 9. **update_auditoria_informe_updated_at**
- **Tabla**: `auditoria_informe`
- **Acción**: Actualiza `updated_at` automáticamente

---

## 🚀 Cómo Ejecutar

1. **Ejecuta primero** el script de migración completa:
   ```sql
   -- MIGRACION_COMPLETA_TODO_EN_UNO.sql
   ```

2. **Luego ejecuta** el script de políticas RLS:
   ```sql
   -- POLITICAS_RLS_Y_TRIGGERS.sql
   ```

3. **Verifica** que todas las políticas se crearon correctamente en Supabase:
   - Ve a Authentication > Policies
   - Verifica que cada tabla tenga las políticas correspondientes

---

## ⚠️ Notas Importantes

1. **Seguridad**: Todas las funciones auxiliares usan `SECURITY DEFINER` para evitar problemas de recursión en RLS

2. **Performance**: Las políticas están optimizadas para evitar consultas innecesarias

3. **Mantenimiento**: Si necesitas agregar nuevos roles, actualiza las funciones auxiliares primero

4. **Testing**: Prueba cada rol para asegurar que los permisos funcionan correctamente

---

## 🔍 Troubleshooting

### Error: "Recursión infinita en RLS"
- **Solución**: Verifica que las funciones auxiliares usen `SECURITY DEFINER`

### Error: "Usuario no puede ver sus propios datos"
- **Solución**: Verifica que el usuario tenga un registro en la tabla `users`

### Error: "Política no permite la operación"
- **Solución**: Verifica que el usuario tenga el rol correcto y que la política esté bien configurada

---

## 📝 Ejemplo de Uso

```sql
-- Verificar rol del usuario actual
SELECT get_current_user_role();

-- Verificar si es auditor interno
SELECT is_auditor_interno();

-- Verificar si es participante en una auditoría
SELECT is_user_participant_in_auditoria(
  'uuid-de-auditoria',
  auth.uid()
);
```

