# Estructura de Campos del Informe de Auditoría

## 📋 Descripción General

La tabla `auditoria_informe` tiene campos separados para que el **Auditor** y el **Auditado** puedan llenar información de forma independiente. Una vez completado, N8N puede automatizar la generación del documento Word.

---

## 🔵 Campos del AUDITOR

El Auditor redacta y completa estos campos:

### Campos Básicos del Informe
- **`encabezado`** (TEXT): Encabezado del informe
- **`de`** (TEXT): Remitente del informe
- **`para`** (TEXT): Destinatario del informe
- **`asunto`** (TEXT): Asunto del informe
- **`fecha_inicio_informe`** (DATE): Fecha de inicio del informe

### Contenido del Informe
- **`antecedentes`** (TEXT): Antecedentes de la auditoría
- **`objetivos`** (TEXT): Objetivos de la auditoría
- **`alcance`** (TEXT): Alcance de la auditoría
- **`resultados_revision`** (TEXT): Resultados de la revisión
- **`metodologia_aplicada`** (TEXT): Metodología aplicada

### Observaciones
- **`titulo_observaciones`** (TEXT): Título general de la sección de observaciones
- **`observaciones_enumeradas`** (JSONB): Array de observaciones con la siguiente estructura:

```json
[
  {
    "numero": 1,
    "titulo": "Título de la observación 1",
    "descripcion": "Descripción detallada de la observación",
    "recomendacion": "Recomendación para corregir",
    "responsable_id": "uuid-del-usuario-responsable"
  },
  {
    "numero": 2,
    "titulo": "Título de la observación 2",
    "descripcion": "Descripción detallada de la observación 2",
    "recomendacion": "Recomendación para corregir 2",
    "responsable_id": "uuid-del-usuario-responsable-2"
  }
]
```

### Conclusiones
- **`conclusiones`** (TEXT): Conclusiones generales
- **`recomendaciones_generales`** (TEXT): Recomendaciones generales

---

## 🟢 Campos del AUDITADO

El Auditado completa estos campos después de recibir el informe:

### Plan de Implementación
- **`estrategia`** (TEXT): Estrategia para implementar las correcciones
- **`fecha_inicio_implementacion`** (DATE): Fecha de inicio de la implementación
- **`fecha_fin_implementacion`** (DATE): Fecha de fin de la implementación
- **`entregable`** (TEXT): Entregable de la implementación

### Firmas
Las firmas se manejan en la tabla `informe_firmas`:
- Firma del Auditor que elaboró el informe
- Firma de cada Auditado responsable de los hallazgos

---

## 🔄 Flujo de Trabajo

### 1. Fase del Auditor
```
1. Auditor crea el informe borrador
2. Auditor llena: encabezado, de, para, asunto, fecha_inicio_informe
3. Auditor llena: antecedentes, objetivos, alcance, resultados_revision
4. Auditor llena: titulo_observaciones
5. Auditor agrega observaciones_enumeradas (JSONB)
6. Auditor llena: conclusiones, recomendaciones_generales
7. Estado: 'BORRADOR'
```

### 2. Fase del Auditado
```
1. Auditado recibe el informe
2. Auditado llena: estrategia
3. Auditado llena: fecha_inicio_implementacion, fecha_fin_implementacion
4. Auditado llena: entregable
5. Auditado firma el informe (tabla informe_firmas)
6. Estado: 'EN_REVISION' o 'APROBADO'
```

### 3. Automatización con N8N
```
1. N8N detecta que el informe está completo (todos los campos llenos)
2. N8N lee los campos del informe
3. N8N genera documento Word con formato estándar
4. N8N actualiza documento_word_url
5. Una vez generado, se pasa a la matriz de observaciones (auditoria_observaciones)
```

---

## 📝 Ejemplo de Uso en SQL

### Insertar un informe con observaciones

```sql
INSERT INTO auditoria_informe (
  auditoria_id,
  tipo_informe,
  encabezado,
  de,
  para,
  asunto,
  fecha_inicio_informe,
  antecedentes,
  objetivos,
  alcance,
  resultados_revision,
  titulo_observaciones,
  observaciones_enumeradas,
  conclusiones,
  recomendaciones_generales,
  elaborado_por,
  estado
) VALUES (
  'uuid-de-la-auditoria',
  'BORRADOR',
  'INFORME DE AUDITORÍA',
  'Departamento de Auditoría Interna',
  'Gerencia General',
  'Informe de Auditoría - Proceso X',
  '2024-01-15',
  'Los antecedentes...',
  'Los objetivos...',
  'El alcance...',
  'Los resultados...',
  'OBSERVACIONES ENCONTRADAS',
  '[
    {
      "numero": 1,
      "titulo": "Falta de documentación",
      "descripcion": "No se encontró documentación del proceso X",
      "recomendacion": "Documentar el proceso según estándar Y",
      "responsable_id": "uuid-del-responsable"
    }
  ]'::jsonb,
  'Las conclusiones...',
  'Las recomendaciones generales...',
  'uuid-del-auditor',
  'BORRADOR'
);
```

### Actualizar campos del Auditado

```sql
UPDATE auditoria_informe
SET 
  estrategia = 'Estrategia de implementación...',
  fecha_inicio_implementacion = '2024-02-01',
  fecha_fin_implementacion = '2024-03-31',
  entregable = 'Documentación actualizada del proceso',
  estado = 'EN_REVISION'
WHERE id = 'uuid-del-informe';
```

---

## 🔍 Consultas Útiles

### Obtener todas las observaciones de un informe

```sql
SELECT 
  id,
  titulo_observaciones,
  observaciones_enumeradas,
  jsonb_array_length(observaciones_enumeradas) as total_observaciones
FROM auditoria_informe
WHERE id = 'uuid-del-informe';
```

### Obtener una observación específica

```sql
SELECT 
  observacion->>'numero' as numero,
  observacion->>'titulo' as titulo,
  observacion->>'descripcion' as descripcion,
  observacion->>'recomendacion' as recomendacion,
  observacion->>'responsable_id' as responsable_id
FROM auditoria_informe,
  jsonb_array_elements(observaciones_enumeradas) as observacion
WHERE id = 'uuid-del-informe'
  AND observacion->>'numero' = '1';
```

---

## ⚠️ Notas Importantes

1. **Campo `observaciones_enumeradas`**: Es un JSONB que permite almacenar múltiples observaciones de forma estructurada. Esto facilita la automatización con N8N.

2. **Paso a la Matriz**: Una vez que el informe está completo y el documento Word generado, los datos de `observaciones_enumeradas` deben pasarse a la tabla `auditoria_observaciones` para el seguimiento.

3. **Firmas**: Las firmas se manejan en la tabla `informe_firmas`, que permite múltiples firmantes con diferentes roles.

4. **Versionado**: La tabla soporta versiones del informe mediante los campos `version` y `es_version_actual`.

---

## 🚀 Integración con N8N

N8N puede:
1. Leer los campos del informe desde Supabase
2. Procesar el JSONB de `observaciones_enumeradas`
3. Generar un documento Word con formato estándar
4. Subir el documento a storage y actualizar `documento_word_url`
5. Una vez generado, crear registros en `auditoria_observaciones` basados en `observaciones_enumeradas`

