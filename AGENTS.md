# AGENTS.md

## Proyecto

Sistema de auditoría. Next.js 15 (App Router) + TypeScript + Supabase + Tailwind.
Proyecto en `auditoria/auditoria2/`.

## Comandos

```bash
npm run dev    # desarrollo
npm run build  # build producción
npm run lint   # eslint
npm run start  # iniciar producción
```

## Arquitectura

- `app/` - Next.js App Router (pages, API routes)
- `components/` - React components (incluye `ui/` con Radix primitives)
- `app/api/` - API routes (notificaciones, exports, webhooks)
- `@/*` - path alias apunta a raíz del proyecto

## Modelo de datos

Tablas Supabase: `auditorias`, `observaciones`, `informes`, `comunicaciones_auditado`, `auditoria_participantes`.

## Estados de informe

```
borrador → revision → socializacion → estrategia → firmas → completado
```

## Roles de usuario

- **auditor** - crea auditorías, observaciones, informes
- **auditado** - recibe notificaciones, completa estrategia, firma
- **auditor_interno** - revisa y aprueba informes

## n8n Integration

- Workflows JSON en raíz del proyecto (`n8n_workflow_*.json`)
- Webhook URL en `.env` como `NEXT_PUBLIC_N8N_WEBHOOK_URL`
- Notificaciones non-blocking (fallback a DB si webhook falla)
- Scripts de prueba: `probar_webhook.sh`, `probar_generar_word.sh`

## Supabase Auth

Usa `@supabase/auth-helpers-nextjs`. Callbacks en `app/auth/callback/route.ts`.

## Idioma

Español en código, comentarios y documentación.