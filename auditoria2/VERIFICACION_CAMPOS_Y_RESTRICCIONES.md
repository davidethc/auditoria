# 🔍 Verificación de Campos y Restricciones por Rol

## 📊 Campos de Tabla `auditorias` - Verificación

### Campos de Control de Flujo (BOOLEAN):
- [ ] `preparacion_completada` - ❌ **NO SE ACTUALIZA** cuando se guarda preparación
- [ ] `participantes_notificados` - ❌ **NO SE ACTUALIZA** cuando se notifica
- [x] `ejecucion_iniciada` - ✅ Se actualiza al iniciar ejecución
- [x] `informe_borrador_generado` - ✅ Se actualiza al enviar a revisión
- [x] `informe_aprobado` - ✅ Se actualiza al aprobar
- [x] `informe_socializado` - ✅ Se actualiza al socializar
- [ ] `informe_final_enviado` - ❌ **NO SE ACTUALIZA** al enviar a auditados

### Campos de Fechas (TIMESTAMPTZ):
- [ ] `fecha_preparacion_completada` - ❌ **NO SE ACTUALIZA**
- [ ] `fecha_notificacion` - ❌ **NO SE ACTUALIZA**
- [x] `fecha_inicio_ejecucion` - ✅ Se actualiza al iniciar ejecución
- [x] `fecha_informe_borrador` - ✅ Se actualiza al enviar a revisión
- [x] `fecha_aprobacion_informe` - ✅ Se actualiza al aprobar
- [x] `fecha_socializacion` - ✅ Se actualiza al socializar
- [ ] `fecha_informe_final` - ❌ **NO SE ACTUALIZA** al enviar a auditados
- [x] `fecha_cierre` - ✅ Se actualiza por trigger cuando estado = CERRADA

---

## 🔐 Verificación de Restricciones por Rol

### AUDITOR INTERNO
#### ✅ Puede hacer:
- [x] Ver todas las auditorías
- [x] Editar cualquier auditoría
- [x] Crear planes y actividades
- [x] Revisar y aprobar informes
- [x] Solicitar correcciones
- [x] Gestionar usuarios

#### ❌ NO puede hacer (debe estar bloqueado):
- [x] ✅ No hay restricciones - es el rol con más permisos

### AUDITOR
#### ✅ Puede hacer:
- [x] Crear auditorías desde actividades asignadas
- [x] Completar preparación (solo en sus auditorías)
- [x] Agregar participantes (solo en sus auditorías)
- [x] Notificar auditados (solo en sus auditorías)
- [x] Iniciar ejecución (solo en sus auditorías)
- [x] Crear observaciones (solo en sus auditorías)
- [x] Crear informe borrador (solo en sus auditorías)
- [x] Enviar a revisión (solo en sus auditorías)
- [x] Socializar informe (solo en sus auditorías)
- [x] Enviar a auditados (solo en sus auditorías)

#### ❌ NO puede hacer (debe estar bloqueado):
- [x] ✅ No puede crear planes/actividades (solo auditor_interno)
- [x] ✅ No puede aprobar informes (solo auditor_interno)
- [x] ✅ No puede definir fechas de implementación (solo auditado)
- [x] ✅ No puede completar estrategia (solo auditado)
- [x] ✅ No puede presentar descargos (solo auditado)
- [x] ✅ No puede editar auditorías de otros auditores

### AUDITADO
#### ✅ Puede hacer:
- [x] Ver preparación (solo en auditorías donde participa)
- [x] Confirmar participación
- [x] Responder solicitudes de documentación
- [x] Ver observaciones donde es responsable
- [x] Presentar descargos (estado SOCIALIZADO)
- [x] Completar estrategia y fechas (estado ENVIADO_A_AUDITADOS)
- [x] Firmar informe
- [x] Subir evidencias

#### ❌ NO puede hacer (debe estar bloqueado):
- [x] ✅ No puede crear auditorías
- [x] ✅ No puede editar preparación
- [x] ✅ No puede agregar participantes
- [x] ✅ No puede crear observaciones
- [x] ✅ No puede crear informes
- [x] ✅ No puede aprobar informes
- [x] ✅ No puede ver auditorías donde no participa

---

## 🔧 Correcciones Necesarias

### 1. Actualizar campos cuando se completa preparación
**Archivo**: `components/PreparacionForm.tsx`
**Problema**: No actualiza `preparacion_completada` ni `fecha_preparacion_completada` en tabla `auditorias`

### 2. Actualizar campos cuando se notifica
**Archivo**: `components/BotonNotificar.tsx`
**Problema**: No actualiza `participantes_notificados` ni `fecha_notificacion` en tabla `auditorias`

### 3. Actualizar campos cuando se inicia ejecución
**Archivo**: `app/auditorias/[id]/page.tsx`
**Problema**: Actualiza `ejecucion_iniciada` pero falta verificar `fecha_inicio_ejecucion`

### 4. Actualizar campos cuando se envía a auditados
**Archivo**: Necesita verificación - buscar dónde se cambia estado a `ENVIADO_A_AUDITADOS`

### 5. Verificar que observaciones actualicen campos del informe
**Problema**: Cuando se incluyen observaciones en informe, deben actualizarse `numero_informe`, `fecha_emision_informe`, `fecha_envio_informe` en `auditoria_observaciones`

---

## 📋 Campos para N8N (Automatización)

### Campos necesarios para recordatorios:
- ✅ `fecha_fin` en `auditoria_observaciones` - Para calcular 3 meses antes
- ✅ `fecha_limite_respuesta` en `auditoria_participantes` - Para recordatorios
- ✅ `fecha_limite` en `solicitudes_documentacion` - Para alertas de vencimiento
- ✅ `fecha_fin_implementacion` en `auditoria_informe` - Para seguimiento

### Campos necesarios para seguimiento mensual:
- ✅ `fecha_fin` en `auditoria_observaciones` - Para revisión mensual
- ✅ `estado_observacion` - Para filtrar por estado
- ✅ `porcentaje_avance` - Para reportes
- ✅ `fecha_real_implementacion` - Para verificar cumplimiento

### Campos necesarios para notificaciones:
- ✅ `fecha_notificacion` en `auditoria_participantes`
- ✅ `fecha_socializacion` en `auditoria_informe`
- ✅ `fecha_aprobacion_informe` en `auditorias`
- ✅ `fecha_informe_final` en `auditorias` (FALTA ACTUALIZAR)

---

## ✅ Checklist de Verificación Final

### Campos de Auditoría:
- [ ] `preparacion_completada` se actualiza al guardar preparación
- [ ] `fecha_preparacion_completada` se actualiza al guardar preparación
- [ ] `participantes_notificados` se actualiza al notificar
- [ ] `fecha_notificacion` se actualiza al notificar
- [ ] `fecha_inicio_ejecucion` se actualiza al iniciar ejecución
- [ ] `informe_final_enviado` se actualiza al enviar a auditados
- [ ] `fecha_informe_final` se actualiza al enviar a auditados

### Campos de Observaciones:
- [ ] `numero_informe` se actualiza al incluir en informe
- [ ] `fecha_emision_informe` se actualiza al crear informe
- [ ] `fecha_envio_informe` se actualiza al enviar a auditados

### Restricciones:
- [x] Auditor no puede aprobar informes
- [x] Auditor no puede definir fechas de implementación
- [x] Auditado no puede crear auditorías
- [x] Auditado no puede editar preparación
- [x] Auditado solo ve auditorías donde participa

