'use client';

import { SelectResponsable } from '@/components/SelectResponsable';
import { SelectValidacion } from '@/components/SelectValidacion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

type UserRole = 'auditado' | 'auditor' | 'auditor_interno';

export interface AuditActivity {
  id: string;
  activity_number: number;
  activity_description: string;
  activity_type: string | null;
  regulation_code: string | null;
  regulation_name: string | null;
  regulation_date: string | null;
  priority: string | null;
  validation_status: string | null;
  start_date: string | null;
  end_date: string | null;
  component: string | null;
  subcomponent: string | null;
  year: number | null;
  auditor_id: string | null;
  auditor_name?: string | null; // Nombre del responsable asignado
  auditor_email?: string | null; // Email del responsable asignado
}

interface TablaActividadesProps {
  activities: AuditActivity[];
  userRole: UserRole | null;
  onActivityUpdate: (activityId: string, newResponsableId: string, newResponsableName: string) => void;
  onValidacionUpdate?: (activityId: string, newStatus: string) => void;
  isLoading?: boolean;
}

export function TablaActividades({
  activities,
  userRole,
  onActivityUpdate,
  onValidacionUpdate,
  isLoading,
}: TablaActividadesProps) {
  // Determinar permisos
  // auditor_interno: puede asignar responsable Y cambiar validación
  // auditor: NO puede cambiar responsable, SÍ puede cambiar validación
  // auditado: NO puede cambiar nada
  const canEditResponsable = userRole === 'auditor_interno';
  const canEditValidacion = userRole === 'auditor_interno' || userRole === 'auditor';

  const pageSize = 5;
  const [page, setPage] = useState(1);
  const pageCount = Math.max(1, Math.ceil(activities.length / pageSize));
  const safePage = Math.min(Math.max(page, 1), pageCount);

  const pagedActivities = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return activities.slice(start, start + pageSize);
  }, [activities, safePage]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    try {
      return format(new Date(dateString), 'dd/MM/yyyy', { locale: es });
    } catch {
      return '-';
    }
  };

  const getPriorityBadge = (priority: string | null) => {
    if (!priority) return null;

    const priorityLower = priority.toLowerCase();
    
    // Mapeo de variantes según el tipo de prioridad
    const variants: Record<string, 'default' | 'destructive' | 'secondary'> = {
      alta: 'destructive',
      media: 'default',
      baja: 'secondary',
      'riesgo operativo': 'default',
      'riesgo': 'default',
    };

    // Si contiene "riesgo", usar estilo especial
    const isRiesgo = priorityLower.includes('riesgo');
    const variant = isRiesgo 
      ? 'default' 
      : (variants[priorityLower] || 'default');

    return (
      <Badge 
        variant={variant} 
        className={cn(
          'capitalize',
          isRiesgo && 'bg-black text-white hover:bg-black/90'
        )}
      >
        {priority}
      </Badge>
    );
  };


  if (isLoading) {
    return (
      <div className="rounded-lg border bg-card p-8 text-center">
        <p className="text-sm text-muted-foreground">Cargando actividades...</p>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-8 text-center">
        <p className="text-sm text-muted-foreground">
          No hay actividades para este plan.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b bg-card/60 px-4 py-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground">Actividades</p>
          <p className="text-xs text-muted-foreground">
            Mostrando {(safePage - 1) * pageSize + 1}–{Math.min(safePage * pageSize, activities.length)} de {activities.length}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={safePage <= 1}
            aria-label="Página anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="text-xs text-muted-foreground tabular-nums px-2">
            Página <span className="text-foreground font-medium">{safePage}</span> / {pageCount}
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
            disabled={safePage >= pageCount}
            aria-label="Página siguiente"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="max-h-[65vh] overflow-y-auto">
          <table className="w-full caption-bottom text-sm">
            <thead className="sticky top-0 z-10 bg-secondary/70 backdrop-blur border-b shadow-sm">
            <tr>
              <th className="h-11 px-4 text-left align-middle text-[11px] font-semibold uppercase tracking-wide text-foreground/90 w-16">
                N°
              </th>
              <th className="h-11 px-4 text-left align-middle text-[11px] font-semibold uppercase tracking-wide text-foreground/90 min-w-[300px]">
                Actividad
              </th>
              <th className="h-11 px-4 text-left align-middle text-[11px] font-semibold uppercase tracking-wide text-foreground/90 min-w-[200px]">
                Tipo de Actividad
              </th>
              <th className="h-11 px-4 text-left align-middle text-[11px] font-semibold uppercase tracking-wide text-foreground/90 min-w-[150px]">
                Normativa
              </th>
              <th className="h-11 px-4 text-left align-middle text-[11px] font-semibold uppercase tracking-wide text-foreground/90">
                Componente
              </th>
              <th className="h-11 px-4 text-left align-middle text-[11px] font-semibold uppercase tracking-wide text-foreground/90">
                Subcomponente
              </th>
              <th className="h-11 px-4 text-left align-middle text-[11px] font-semibold uppercase tracking-wide text-foreground/90">
                Prioridad
              </th>
              <th className="h-11 px-4 text-left align-middle text-[11px] font-semibold uppercase tracking-wide text-foreground/90">
                Fecha Inicio
              </th>
              <th className="h-11 px-4 text-left align-middle text-[11px] font-semibold uppercase tracking-wide text-foreground/90">
                Fecha Fin
              </th>
              <th className="h-11 px-4 text-left align-middle text-[11px] font-semibold uppercase tracking-wide text-foreground/90 min-w-[200px]">
                Responsable
              </th>
              <th className="h-11 px-4 text-left align-middle text-[11px] font-semibold uppercase tracking-wide text-foreground/90 min-w-[180px]">
                Validación
              </th>
            </tr>
          </thead>
          <tbody>
            {pagedActivities.map((activity) => (
              <tr key={activity.id} className="border-b transition-colors hover:bg-muted/50">
                <td className="p-4 align-middle">
                  <span className="font-medium">{activity.activity_number}</span>
                </td>
                <td className="p-4 align-middle">
                  <span className="text-sm">{activity.activity_description}</span>
                </td>
                <td className="p-4 align-middle">
                  {activity.activity_type ? (
                    <Badge variant="outline" className="text-xs">
                      {activity.activity_type}
                    </Badge>
                  ) : (
                    <span className="text-sm text-muted-foreground italic">-</span>
                  )}
                </td>
                <td className="p-4 align-middle">
                  <div className="flex flex-col gap-1">
                    {activity.regulation_code && (
                      <span className="text-xs font-medium text-foreground">
                        {activity.regulation_code}
                      </span>
                    )}
                    {activity.regulation_name && (
                      <span className="text-xs text-muted-foreground">
                        {activity.regulation_name}
                      </span>
                    )}
                    {activity.regulation_date && (
                      <span className="text-xs text-muted-foreground">
                        {formatDate(activity.regulation_date)}
                      </span>
                    )}
                    {!activity.regulation_code && !activity.regulation_name && (
                      <span className="text-xs text-muted-foreground italic">-</span>
                    )}
                  </div>
                </td>
                <td className="p-4 align-middle">
                  {activity.component ? (
                    <span className="text-sm">{activity.component}</span>
                  ) : (
                    <span className="text-sm text-muted-foreground italic">-</span>
                  )}
                </td>
                <td className="p-4 align-middle">
                  {activity.subcomponent ? (
                    <span className="text-sm">{activity.subcomponent}</span>
                  ) : (
                    <span className="text-sm text-muted-foreground italic">-</span>
                  )}
                </td>
                <td className="p-4 align-middle">
                  {getPriorityBadge(activity.priority)}
                </td>
                <td className="p-4 align-middle">
                  <span className="text-sm text-muted-foreground">
                    {formatDate(activity.start_date)}
                  </span>
                </td>
                <td className="p-4 align-middle">
                  <span className="text-sm text-muted-foreground">
                    {formatDate(activity.end_date)}
                  </span>
                </td>
                <td className="p-4 align-middle">
                  <SelectResponsable
                    activityId={activity.id}
                    currentResponsableId={activity.auditor_id}
                    currentResponsableName={activity.auditor_name}
                    onResponsableChange={(newId, newName) =>
                      onActivityUpdate(activity.id, newId, newName)
                    }
                    canEdit={canEditResponsable}
                    className="min-w-[180px]"
                  />
                </td>
                <td className="p-4 align-middle">
                  <SelectValidacion
                    activityId={activity.id}
                    currentStatus={activity.validation_status}
                    onStatusChange={(newStatus) => {
                      onValidacionUpdate?.(activity.id, newStatus);
                    }}
                    canEdit={canEditValidacion}
                    canNotify={userRole === 'auditor_interno'}
                    activityData={{
                      activity_number: activity.activity_number,
                      activity_description: activity.activity_description,
                      auditor_id: activity.auditor_id,
                      auditor_name: activity.auditor_name,
                      auditor_email: activity.auditor_email,
                    }}
                    className="min-w-[160px]"
                  />
                </td>
              </tr>
            ))}
          </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

