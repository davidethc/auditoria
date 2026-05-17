'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase';
import { Badge } from '@/components/ui/badge';
import { Loader } from '@/components/ui/loader';
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
import type { LucideIcon } from 'lucide-react';

interface Auditoria {
  id: string;
  estado: string;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  creada_at: string;
  rol_en_auditoria: string;
  estado_participacion: string;
  activity?: {
    id: string;
    activity_number: number;
    activity_description: string;
    start_date: string | null;
    end_date: string | null;
    priority: string | null;
  };
}

interface ParticipanteData {
  id: string;
  auditoria_id: string;
  rol_en_auditoria: string;
  estado_participacion: string;
}

interface ActivityData {
  id: string;
  activity_number: number;
  activity_description: string;
  start_date: string | null;
  end_date: string | null;
  priority: string | null;
}

interface AuditoriaData {
  id: string;
  estado: string;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  creada_at: string;
  activity: ActivityData | ActivityData[] | null;
}

interface ListaAuditoriasParticipanteProps {
  userId: string;
  grouped?: boolean;
  stageFilter?: AuditoriaEstado | null;
}

const estadoOrder = ['PLANIFICADA', 'EN_PREPARACION', 'EN_EJECUCION', 'EN_REPORTE', 'CERRADA'] as const;

type AuditoriaEstado = (typeof estadoOrder)[number];

const estadoConfig: Record<AuditoriaEstado, { label: string; variant: 'default' | 'destructive' | 'secondary' | 'outline'; icon: LucideIcon }> = {
  PLANIFICADA: { label: 'Planificada', variant: 'outline', icon: Clock },
  EN_PREPARACION: { label: 'En Preparación', variant: 'secondary', icon: FileText },
  EN_EJECUCION: { label: 'En Ejecución', variant: 'default', icon: Play },
  EN_REPORTE: { label: 'En Reporte', variant: 'default', icon: FileCheck },
  CERRADA: { label: 'Cerrada', variant: 'secondary', icon: CheckCircle2 },
};

const estadoParticipacionConfig: Record<string, { label: string; variant: 'default' | 'destructive' | 'secondary' | 'outline' }> = {
  PENDIENTE: { label: 'Pendiente', variant: 'outline' },
  NOTIFICADO: { label: 'Notificado', variant: 'secondary' },
  ACEPTADO: { label: 'Aceptado', variant: 'default' },
  RECHAZADO: { label: 'Rechazado', variant: 'destructive' },
};

export function ListaAuditoriasParticipante({ userId, grouped = true, stageFilter = null }: ListaAuditoriasParticipanteProps) {
  const router = useRouter();
  const [auditorias, setAuditorias] = useState<Auditoria[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAuditorias = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    console.log('🔍 Cargando auditorías para usuario:', userId);

    try {
      // Primero, verificar si hay participantes
      const { data: participantesData, error: participantesError } = await supabase
        .from('auditoria_participantes')
        .select('id, auditoria_id, rol_en_auditoria, estado_participacion')
        .eq('user_id', userId);

      if (participantesError) {
        console.error('❌ Error obteniendo participantes:', participantesError);
        throw participantesError;
      }

      console.log('✅ Participantes encontrados:', participantesData?.length || 0);

      if (!participantesData || participantesData.length === 0) {
        console.log('ℹ️ No hay participantes asignados');
        setAuditorias([]);
        return;
      }

      // Obtener IDs de auditorías
      const auditoriaIds = participantesData.map(p => p.auditoria_id);

      // Buscar auditorías sin JOIN para evitar problemas con RLS
      const { data: auditoriasData, error: auditoriasError } = await supabase
        .from('auditorias')
        .select('id, estado, fecha_inicio, fecha_fin, creada_at, activity_id')
        .in('id', auditoriaIds)
        .order('creada_at', { ascending: false });

      if (auditoriasError) {
        console.error('❌ Error obteniendo auditorías:', auditoriasError);
        throw auditoriasError;
      }

      console.log('✅ Auditorías encontradas:', auditoriasData?.length || 0);

      // Obtener IDs únicos de actividades
      const activityIds = [...new Set((auditoriasData || []).map(a => a.activity_id).filter(Boolean))];

      // Cargar actividades por separado
      let activitiesMap: Record<string, ActivityData> = {};
      if (activityIds.length > 0) {
        const { data: activitiesData, error: activitiesError } = await supabase
          .from('audit_activities')
          .select('id, activity_number, activity_description, start_date, end_date, priority')
          .in('id', activityIds);

        if (activitiesError) {
          console.warn('⚠️ Error cargando actividades:', activitiesError);
        } else if (activitiesData) {
          activitiesMap = activitiesData.reduce((acc, act) => {
            acc[act.id] = act;
            return acc;
          }, {} as Record<string, ActivityData>);
        }
      }

      // Combinar datos de participantes con auditorías
      const formattedAuditorias: Auditoria[] = (auditoriasData || [])
        .map((auditoria: any) => {
          const participante = participantesData.find(
            (p: ParticipanteData) => p.auditoria_id === auditoria.id
          );
          
          // Obtener actividad del mapa
          const activity = auditoria.activity_id ? activitiesMap[auditoria.activity_id] : undefined;
          
          return {
            id: auditoria.id,
            estado: auditoria.estado,
            fecha_inicio: auditoria.fecha_inicio,
            fecha_fin: auditoria.fecha_fin,
            creada_at: auditoria.creada_at,
            rol_en_auditoria: participante?.rol_en_auditoria || 'AUDITADO',
            estado_participacion: participante?.estado_participacion || 'PENDIENTE',
            activity: activity,
          };
        })
        .filter((auditoria: Auditoria) => auditoria !== null && auditoria !== undefined);

      console.log('✅ Auditorías formateadas:', formattedAuditorias.length);
      console.log('📋 Datos:', formattedAuditorias);
      
      setAuditorias(formattedAuditorias);
    } catch (err) {
      console.error('❌ Error cargando auditorías:', err);
      const errorMessage = err instanceof Error 
        ? err.message 
        : 'Error al cargar auditorías. Verifica las políticas RLS.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

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

  const renderAuditoriaCard = (auditoria: Auditoria) => {
    const config = estadoConfig[auditoria.estado as AuditoriaEstado] || estadoConfig.PLANIFICADA;
    const EstadoIcon = config.icon;
    const activity = auditoria.activity;
    const estadoParticipacion = estadoParticipacionConfig[auditoria.estado_participacion] || estadoParticipacionConfig.PENDIENTE;

    return (
      <div
        key={auditoria.id}
        className="rounded-lg border bg-card p-6 transition-all hover:shadow-md cursor-pointer"
        onClick={() => router.push(`/auditorias/${auditoria.id}`)}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-3 flex-wrap">
              <Badge variant={config.variant} className="gap-1.5">
                <EstadoIcon className="h-3 w-3" />
                {config.label}
              </Badge>
              <Badge variant="outline">{auditoria.rol_en_auditoria}</Badge>
              <Badge variant={estadoParticipacion.variant}>{estadoParticipacion.label}</Badge>
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
            </div>
          </div>

          <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
        </div>
      </div>
    );
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
          No estás participando en ninguna auditoría aún.
        </p>
        <p className="text-xs text-muted-foreground mt-2">
          Aparecerán aquí cuando un auditor te asigne como participante
        </p>
      </div>
    );
  }

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
            {filteredAuditorias.map(renderAuditoriaCard)}
          </div>
        </div>
      ) : grouped ? (
        // Show grouped
        <div className="space-y-6">
          {estadoOrder.map((estado) => {
            const group = groupedAuditorias[estado];
            if (!group || group.length === 0) return null;
            const stateLabel = estadoConfig[estado].label;

            return (
              <section key={estado} className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h4 className="text-base font-semibold">{stateLabel}</h4>
                    <p className="text-sm text-muted-foreground">{group.length} auditoría{group.length !== 1 ? 's' : ''}</p>
                  </div>
                  <Badge variant="outline">{stateLabel}</Badge>
                </div>
                <div className="grid gap-4">
                  {group.map(renderAuditoriaCard)}
                </div>
              </section>
            );
          })}
        </div>
      ) : (
        // Show flat list
        <div className="grid gap-4">
          {filteredAuditorias.map(renderAuditoriaCard)}
        </div>
      )}
    </div>
  );
}


