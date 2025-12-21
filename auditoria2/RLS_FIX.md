# 🔧 Solución: Error de Recursión Infinita en RLS (42P17)

## ❌ Problema

Error: `infinite recursion detected in policy for relation "users"`

Este error ocurre cuando las políticas RLS (Row Level Security) en Supabase intentan leer de la misma tabla `users` para verificar permisos, creando un bucle infinito.

## ✅ Solución

Necesitas arreglar las políticas RLS en Supabase. Ve al Dashboard de Supabase → Authentication → Policies.

### Opción 1: Política Simple (Recomendada)

Para permitir que los usuarios lean su propio registro:

```sql
-- Política para SELECT (leer)
CREATE POLICY "Users can read their own data"
ON public.users
FOR SELECT
USING (auth.uid() = id);
```

### Opción 2: Política para Administradores

Si quieres que los `auditor_interno` puedan leer todos los usuarios:

```sql
-- Política para SELECT (leer todos los usuarios si eres admin)
CREATE POLICY "Auditors can read all users"
ON public.users
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND role = 'auditor_interno'
  )
);
```

**⚠️ PROBLEMA**: Esta política causa recursión infinita porque intenta leer de `users` dentro de la misma política.

### ✅ Solución Correcta para Administradores

Usa una función de seguridad que evite la recursión:

```sql
-- 1. Crear función de seguridad
CREATE OR REPLACE FUNCTION public.is_auditor_interno()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND role = 'auditor_interno'
  );
END;
$$;

-- 2. Política usando la función
CREATE POLICY "Auditors can read all users"
ON public.users
FOR SELECT
USING (
  auth.uid() = id  -- Puede leer su propio registro
  OR public.is_auditor_interno()  -- O es auditor_interno
);
```

### Opción 3: Política Completa Recomendada

```sql
-- Eliminar políticas existentes que causan recursión
DROP POLICY IF EXISTS "Users can read their own data" ON public.users;
DROP POLICY IF EXISTS "Auditors can read all users" ON public.users;

-- Función helper para verificar rol (evita recursión)
CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN (
    SELECT role FROM public.users
    WHERE id = user_id
    LIMIT 1
  );
END;
$$;

-- Política: Los usuarios pueden leer su propio registro
CREATE POLICY "Users can read own profile"
ON public.users
FOR SELECT
USING (auth.uid() = id);

-- Política: Los auditores internos pueden leer todos los usuarios
CREATE POLICY "Auditors can read all users"
ON public.users
FOR SELECT
USING (
  public.get_user_role(auth.uid()) = 'auditor_interno'
);
```

### Opción 4: Solución Más Simple (Sin funciones)

Si prefieres no usar funciones, puedes usar esta política simple:

```sql
-- Eliminar políticas problemáticas
DROP POLICY IF EXISTS "Users can read their own data" ON public.users;
DROP POLICY IF EXISTS "Auditors can read all users" ON public.users;

-- Política simple: Solo pueden leer su propio registro
CREATE POLICY "Users can read own data"
ON public.users
FOR SELECT
USING (auth.uid() = id);

-- Para permitir que los auditores lean todos, necesitarás usar Service Role
-- o crear una función de seguridad como en la Opción 3
```

## 🔍 Cómo Aplicar la Solución

1. Ve a tu proyecto en Supabase Dashboard
2. Navega a **SQL Editor**
3. Ejecuta una de las soluciones anteriores
4. Verifica que las políticas estén correctas en **Authentication → Policies**

## 📝 Notas Importantes

- **SECURITY DEFINER**: Las funciones con `SECURITY DEFINER` se ejecutan con permisos del creador, evitando la recursión
- **STABLE**: Marca la función como `STABLE` para optimización
- **Evita consultas directas**: No consultes `users` dentro de una política de `users` sin usar funciones de seguridad

## 🧪 Verificar la Solución

Después de aplicar la solución, recarga la aplicación. El error `42P17` debería desaparecer y deberías poder leer los roles de los usuarios correctamente.

