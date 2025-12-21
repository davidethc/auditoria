create table public.auditorias (
  id uuid primary key default gen_random_uuid(),

  -- Relación con la planificación
  activity_id uuid not null
    references public.audit_activities(id)
    on delete cascade,

  -- Auditor responsable
  auditor_responsable_id uuid not null
    references public.users(id),

  -- Estados formales de la auditoría
  estado text not null
    check (estado in (
      'PLANIFICADA',
      'EN_PREPARACION',
      'EN_EJECUCION',
      'EN_REPORTE',
      'CERRADA'
    )),

  -- Fechas clave
  fecha_inicio date,
  fecha_fin date,

  -- Control
  creada_por uuid references public.users(id),
  creada_at timestamptz default now()
);



create table public.auditoria_preparacion (
  id uuid primary key default gen_random_uuid(),

  auditoria_id uuid not null
    references public.auditorias(id)
    on delete cascade,

  -- Preparación técnica
  objetivo text not null,
  alcance text not null,
  criterios text not null,
  riesgos text,

  -- Control
  preparada_por uuid
    references public.users(id),

  preparada_at timestamptz default now(),

  -- Flujo
  enviada_a_auditados boolean default false,
  enviada_at timestamptz
);



create table public.auditoria_participantes (
  id uuid primary key default gen_random_uuid(),

  auditoria_id uuid not null
    references public.auditorias(id)
    on delete cascade,

  user_id uuid not null
    references public.users(id),

  rol_en_auditoria text not null
    check (rol_en_auditoria in (
      'AUDITADO',
      'OBSERVADOR',
      'APOYO'
    )),

  estado_participacion text not null
    check (estado_participacion in (
      'NOTIFICADO',
      'ACEPTADO',
      'RECHAZADO'
    )),

  fecha_notificacion timestamptz,
  fecha_respuesta timestamptz
);


create table public.comunicaciones_auditado (
  id uuid primary key default gen_random_uuid(),

  auditoria_id uuid not null
    references public.auditorias(id)
    on delete cascade,

  destinatario_id uuid not null
    references public.users(id),

  -- Resumen visible para el auditado
  resumen_objetivo text not null,
  resumen_alcance text not null,

  -- Control legal
  fecha_envio timestamptz default now(),
  confirmado boolean default false,
  fecha_confirmacion timestamptz
);
