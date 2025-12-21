'use client';

import { SelectResponsable } from '@/components/SelectResponsable';
import { SelectValidacion } from '@/components/SelectValidacion';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

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
      <div className="overflow-x-auto">
        <table className="w-full caption-bottom text-sm">
          <thead className="bg-muted/50 border-b">
            <tr>
              <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground w-16">
                N°
              </th>
              <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground min-w-[300px]">
                Actividad
              </th>
              <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground min-w-[200px]">
                Tipo de Actividad
              </th>
              <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground min-w-[150px]">
                Normativa
              </th>
              <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                Componente
              </th>
              <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                Subcomponente
              </th>
              <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                Prioridad
              </th>
              <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                Fecha Inicio
              </th>
              <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                Fecha Fin
              </th>
              <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground min-w-[200px]">
                Responsable
              </th>
              <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground min-w-[180px]">
                Validación
              </th>
            </tr>
          </thead>
          <tbody>
            {activities.map((activity) => (
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
                    className="min-w-[160px]"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

