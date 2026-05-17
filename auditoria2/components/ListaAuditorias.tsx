'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase';
import { Badge } from '@/components/ui/badge';
import { Loader } from '@/components/ui/loader';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  FileText, 
  Calendar, 
  AlertCircle,
  ChevronRight,
  CheckCircle2,
  Clock,
  Play,
  FileCheck
} from 'lucide-react';
import type { Auditoria, AuditoriaEstado } from '@/types/auditorias';
import type { LucideIcon } from 'lucide-react';

interface ListaAuditoriasProps {
  userId: string;
  mode?: 'todas' | 'creadas' | 'asignadas';
  selectedAuditoriaId?: string | null;
  onSelectAuditoria?: (auditoria: Auditoria) => void;
  grouped?: boolean;
  stageFilter?: AuditoriaEstado | null;
}

const estadoConfig: Record<string, { label: string; variant: 'default' | 'destructive' | 'secondary' | 'outline'; icon: LucideIcon }> = {
  PLANIFICADA: { label: 'Planificada', variant: 'outline', icon: Clock },
  EN_PREPARACION: { label: 'En Preparación', variant: 'secondary', icon: FileText },
  EN_EJECUCION: { label: 'En Ejecución', variant: 'default', icon: Play },
  EN_REPORTE: { label: 'En Reporte', variant: 'default', icon: FileCheck },
  CERRADA: { label: 'Cerrada', variant: 'secondary', icon: CheckCircle2 },
};

const estadoOrder: AuditoriaEstado[] = ['PLANIFICADA', 'EN_PREPARACION', 'EN_EJECUCION', 'EN_REPORTE', 'CERRADA'];


export function ListaAuditorias({
  userId,
  mode = 'todas',
  selectedAuditoriaId,
  onSelectAuditoria,
  grouped = true,
  stageFilter = null,
}: ListaAuditoriasProps) {
  const router = useRouter();
  const [auditorias, setAuditorias] = useState<Auditoria[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAuditorias = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Cargar auditorías sin JOIN para evitar problemas con RLS
      const { data: auditoriasData, error: auditoriasError } = await supabase
        .from('auditorias')
        .select('*')
        .eq('auditor_responsable_id', userId)
        .order('creada_at', { ascending: false });

      if (auditoriasError) throw auditoriasError;

      if (!auditoriasData || auditoriasData.length === 0) {
        setAuditorias([]);
        return;
      }

      const filteredAuditoriasData = auditoriasData.filter((a) => {
        if (mode === 'todas') return true;
        if (mode === 'creadas') return a.creada_por === userId;
        // asignadas: creadas por otra persona o null (legacy)
        return a.creada_por !== userId;
      });

      // Obtener IDs únicos de actividades
      const activityIds = [...new Set(filteredAuditoriasData.map(a => a.activity_id).filter(Boolean))];

      // Cargar actividades por separado
      let activitiesMap: Record<string, any> = {};
      if (activityIds.length > 0) {
        const { data: activitiesData } = await supabase
          .from('audit_activities')
          .select('id, activity_number, activity_description, start_date, end_date, priority')
          .in('id', activityIds);

        if (activitiesData) {
          activitiesMap = activitiesData.reduce((acc, act) => {
            acc[act.id] = act;
            return acc;
          }, {} as Record<string, any>);
        }
      }

      // Combinar datos
      const auditoriasWithActivity = filteredAuditoriasData.map(auditoria => ({
        ...auditoria,
        activity: activitiesMap[auditoria.activity_id] || null,
      }));

      setAuditorias(auditoriasWithActivity);
    } catch (err) {
      console.error('Error cargando auditorías:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar auditorías');
    } finally {
      setIsLoading(false);
    }
  }, [userId, mode]);

  useEffect(() => {
    loadAuditorias();
  }, [loadAuditorias]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    try {
      return format(new Date(dateString), 'dd/MM/yyyy', { locale: es });
    } catch {
      return '-';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader variant="cube" size={32}>
          <span className="text-sm text-muted-foreground mt-4">Cargando auditorías...</span>
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

  if (auditorias.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-8 text-center">
        <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-sm text-muted-foreground">
          {mode === 'creadas'
            ? 'No has creado ninguna auditoría aún.'
            : mode === 'asignadas'
              ? 'No tienes auditorías asignadas aún.'
              : 'No hay auditorías para mostrar.'}
        </p>
        {mode === 'creadas' && (
          <p className="text-xs text-muted-foreground mt-2">
            Crea una auditoría desde una actividad asignada
          </p>
        )}
      </div>
    );
  }

  const handleOpen = (auditoria: Auditoria) => {
    if (onSelectAuditoria) return onSelectAuditoria(auditoria);
    router.push(`/auditorias/${auditoria.id}`);
  };

  const handleNavigate = (e: React.MouseEvent, auditoria: Auditoria) => {
    e.stopPropagation();
    router.push(`/auditorias/${auditoria.id}`);
  };

  const renderAuditoriaCard = (auditoria: Auditoria, selectedAuditoriaId: string | null | undefined, onSelectAuditoria: ((auditoria: Auditoria) => void) | undefined, handleOpen: (auditoria: Auditoria) => void, handleNavigate: (e: React.MouseEvent, auditoria: Auditoria) => void) => {
    const config = estadoConfig[auditoria.estado] || estadoConfig.PLANIFICADA;
    const EstadoIcon = config.icon;
    const activity = auditoria.activity as {
      id: string;
      activity_number: number;
      activity_description: string;
      start_date: string | null;
      end_date: string | null;
      priority: string | null;
    } | undefined;

    return (
      <div
        key={auditoria.id}
        className={cn(
          "rounded-lg border bg-card p-6 transition-all hover:shadow-md cursor-pointer",
          selectedAuditoriaId === auditoria.id && "border-primary/50 ring-1 ring-primary/15 bg-primary/5"
        )}
        onClick={() => handleOpen(auditoria)}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-3 flex-wrap">
              <Badge variant={config.variant} className="gap-1.5">
                <EstadoIcon className="h-3 w-3" />
                {config.label}
              </Badge>
              {activity && (
                <span className="text-sm text-muted-foreground">
                  Actividad #{activity.activity_number}
                </span>
              )}
            </div>

            {activity && (
              <p className="text-sm text-foreground font-medium">
                {activity.activity_description}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
              {auditoria.fecha_inicio && (
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span>Inicio: {formatDate(auditoria.fecha_inicio)}</span>
                </div>
              )}
              {auditoria.fecha_fin && (
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span>Fin: {formatDate(auditoria.fecha_fin)}</span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <span>Creada: {format(new Date(auditoria.creada_at), 'dd/MM/yyyy', { locale: es })}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onSelectAuditoria ? (
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={(e) => handleNavigate(e, auditoria)}
              >
                Abrir
              </Button>
            ) : null}
            <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
          </div>
        </div>
      </div>
    );
  };

  const groupedAuditorias = estadoOrder.reduce((acc, estado) => {
    acc[estado] = auditorias.filter((auditoria) => auditoria.estado === estado);
    return acc;
  }, {} as Record<AuditoriaEstado, Auditoria[]>);

  // Filter by stage if specified
  const filteredAuditorias = stageFilter ? auditorias.filter(a => a.estado === stageFilter) : auditorias;

  const hasGroupedAuditorias = grouped && Object.values(groupedAuditorias).some((group) => group.length > 0);
  const hasFilteredAuditorias = filteredAuditorias.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          {mode === 'creadas' ? 'Mis Auditorías' : mode === 'asignadas' ? 'Auditorías Asignadas' : 'Auditorías'}
        </h3>
        <Badge variant="secondary">{auditorias.length} auditoría{auditorias.length !== 1 ? 's' : ''}</Badge>
      </div>

      {stageFilter ? (
        // Show filtered by stage
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h4 className="text-base font-semibold">{estadoConfig[stageFilter]?.label || stageFilter}</h4>
              <p className="text-sm text-muted-foreground">{filteredAuditorias.length} auditoría{filteredAuditorias.length !== 1 ? 's' : ''}</p>
            </div>
            <Badge variant="outline">{estadoConfig[stageFilter]?.label || stageFilter}</Badge>
          </div>
          <div className="grid gap-4">
            {filteredAuditorias.map((auditoria) => renderAuditoriaCard(auditoria, selectedAuditoriaId, onSelectAuditoria, handleOpen, handleNavigate))}
          </div>
        </div>
      ) : grouped && hasGroupedAuditorias ? (
        // Show grouped
        <div className="space-y-6">
          {estadoOrder.map((estado) => {
            const group = groupedAuditorias[estado];
            if (!group || group.length === 0) return null;
            const estadoLabel = estadoConfig[estado]?.label || estado;

            return (
              <section key={estado} className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h4 className="text-base font-semibold">{estadoLabel}</h4>
                    <p className="text-sm text-muted-foreground">{group.length} auditoría{group.length !== 1 ? 's' : ''}</p>
                  </div>
                  <Badge variant="outline">{estadoLabel}</Badge>
                </div>

                <div className="grid gap-4">
                  {group.map((auditoria) => renderAuditoriaCard(auditoria, selectedAuditoriaId, onSelectAuditoria, handleOpen, handleNavigate))}
                </div>
              </section>
            );
          })}
        </div>
      ) : (
        // Show flat list
        <div className="grid gap-4">
          {filteredAuditorias.map((auditoria) => renderAuditoriaCard(auditoria, selectedAuditoriaId, onSelectAuditoria, handleOpen, handleNavigate))}
        </div>
      )}
    </div>
  );
}

