# AGENTS.md

## Proyecto: Sistema de Auditoría

Next.js 15 (App Router) + TypeScript + Supabase + Tailwind. Proyecto principal en `auditoria/auditoria2/`.

## Comandos

```bash
npm run dev    # desarrollo
npm run build  # build producción
npm run lint   # eslint
npm run start  # iniciar producción
```

## Arquitectura

- **`app/`** - Next.js App Router (pages, API routes)
- **`components/`** - React components (includes `ui/` con Radix primitives)
- **`@/*`** - path alias apunta a raíz del proyecto
- **API routes en `app/api/`** - notificaciones, exports, webhooks

## Modelo de datos

Tablas principales en Supabase:
- `auditorias` - auditorías
- `observaciones` - hallazgos/observaciones
- `informes` - informes de auditoría
- `comunicaciones_auditado` - notificaciones internas
- `auditoria_participantes` - participantes por rol

## Roles de usuario

- **auditor** - crea auditorías, observaciones, informes
- **auditado** - recibe notificaciones, completa estrategia, firma
- **auditor_interno** - revisa y aprueba informes

## Flujo de informes

```
Borrador → Revisión → Socialización → Estrategia → Firmas → Completado
```

## n8n Integration

Workflows en raíz (`*.json`). Webhook URL configurada en `.env` como `NEXT_PUBLIC_N8N_WEBHOOK_URL`. Notificaciones son non-blocking (fallback a DB si webhook falla).

## Supabase Auth

Usa `@supabase/auth-helpers-nextjs`. Auth callbacks en `app/auth/callback/route.ts`.

## Notas de código

- `lib/utils.ts` - utilidades compartidas (clsx, date-fns)
- `components/EstrategiaForm.tsx` - notifica por cada observación
- `components/FormularioInformeBorrador.tsx` - notifica al auditor interno al enviar a revisión
- `components/MatrizObservaciones.tsx` - matriz 30 campos + export Excel

## Idioma

Este es un proyecto en español. Mantener español en código, comentarios y documentación.