'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader } from '@/components/ui/loader';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  FileText, 
  Plus, 
  Calendar, 
  AlertCircle,
  CheckCircle2,
  Clock
} from 'lucide-react';
import type { AuditActivity } from './TablaActividades';

interface ListaActividadesAuditorProps {
  onCrearAuditoria: (activity: AuditActivity) => void;
  userId: string;
}

export function ListaActividadesAuditor({ 
  onCrearAuditoria, 
  userId 
}: ListaActividadesAuditorProps) {
  const [activities, setActivities] = useState<AuditActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [auditoriasExistentes, setAuditoriasExistentes] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadActivities();
    loadAuditoriasExistentes();
  }, [userId]);

  const loadActivities = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Cargar actividades asignadas al auditor
      const { data, error: activitiesError } = await supabase
        .from('audit_activities')
        .select(`
          id,
          activity_number,
          activity_description,
          activity_type,
          regulation_code,
          regulation_name,
          regulation_date,
          priority,
          validation_status,
          start_date,
          end_date,
          component,
          subcomponent,
          year,
          auditor_id,
          plan_id,
          audit_plans!inner(year, plan_type)
        `)
        .eq('auditor_id', userId)
        .order('activity_number', { ascending: true });

      if (activitiesError) throw activitiesError;

      // Formatear datos
      const formattedActivities: AuditActivity[] = (data || []).map((act) => ({
        id: act.id,
        activity_number: act.activity_number,
        activity_description: act.activity_description,
        activity_type: act.activity_type,
        regulation_code: act.regulation_code,
        regulation_name: act.regulation_name,
        regulation_date: act.regulation_date,
        priority: act.priority,
        validation_status: act.validation_status,
        start_date: act.start_date,
        end_date: act.end_date,
        component: act.component,
        subcomponent: act.subcomponent,
        year: act.year,
        auditor_id: act.auditor_id,
        auditor_name: null,
      }));

      setActivities(formattedActivities);
    } catch (err) {
      console.error('Error cargando actividades:', err);
      setError('Error al cargar actividades');
    } finally {
      setIsLoading(false);
    }
  };

  const loadAuditoriasExistentes = async () => {
    try {
      const { data, error } = await supabase
        .from('auditorias')
        .select('activity_id')
        .eq('auditor_responsable_id', userId);

      if (error) throw error;

      const activityIds = new Set((data || []).map(a => a.activity_id));
      setAuditoriasExistentes(activityIds);
    } catch (err) {
      console.error('Error cargando auditorías existentes:', err);
    }
  };

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
    const variants: Record<string, 'default' | 'destructive' | 'secondary'> = {
      alta: 'destructive',
      media: 'default',
      baja: 'secondary',
    };

    const variant = variants[priorityLower] || 'default';

    return (
      <Badge variant={variant} className="capitalize">
        {priority}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader variant="cube" size={32}>
          <span className="text-sm text-muted-foreground mt-4">Cargando actividades...</span>
        </Loader>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
        <div className="flex items-center gap-2 text-destructive">
          <AlertCircle className="h-5 w-5" />
          <p className="font-medium">Error</p>
        </div>
        <p className="text-sm text-destructive/80 mt-2">{error}</p>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-8 text-center">
        <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-sm text-muted-foreground">
          No tienes actividades asignadas aún.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Mis Actividades Asignadas</h3>
        <Badge variant="secondary">{activities.length} actividad{activities.length !== 1 ? 'es' : ''}</Badge>
      </div>

      <div className="grid gap-4">
        {activities.map((activity) => {
          const tieneAuditoria = auditoriasExistentes.has(activity.id);
          
          return (
            <div
              key={activity.id}
              className={cn(
                "rounded-lg border bg-card p-6 transition-all hover:shadow-md",
                tieneAuditoria && "border-primary/50 bg-primary/5"
              )}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-lg">#{activity.activity_number}</span>
                      {tieneAuditoria && (
                        <Badge variant="outline" className="text-xs">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Auditoría creada
                        </Badge>
                      )}
                    </div>
                    {getPriorityBadge(activity.priority)}
                  </div>

                  <p className="text-sm text-foreground font-medium">
                    {activity.activity_description}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                    {activity.component && (
                      <div className="flex items-center gap-1">
                        <span className="font-medium">Componente:</span>
                        <span>{activity.component}</span>
                      </div>
                    )}
                    {activity.start_date && (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>Inicio: {formatDate(activity.start_date)}</span>
                      </div>
                    )}
                    {activity.end_date && (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>Fin: {formatDate(activity.end_date)}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  {!tieneAuditoria ? (
                    <Button
                      onClick={() => onCrearAuditoria(activity)}
                      size="sm"
                      className="gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Crear Auditoría
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={() => {
                        // TODO: Navegar a la auditoría existente
                        console.log('Ver auditoría:', activity.id);
                      }}
                    >
                      <FileText className="h-4 w-4" />
                      Ver Auditoría
                    </Button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

