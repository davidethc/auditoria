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
import type { Auditoria } from '@/types/auditorias';

interface ListaAuditoriasProps {
  userId: string;
  onSelectAuditoria: (auditoria: Auditoria) => void;
}

import type { LucideIcon } from 'lucide-react';

const estadoConfig: Record<string, { label: string; variant: 'default' | 'destructive' | 'secondary' | 'outline'; icon: LucideIcon }> = {
  PLANIFICADA: { label: 'Planificada', variant: 'outline', icon: Clock },
  EN_PREPARACION: { label: 'En Preparación', variant: 'secondary', icon: FileText },
  EN_EJECUCION: { label: 'En Ejecución', variant: 'default', icon: Play },
  EN_REPORTE: { label: 'En Reporte', variant: 'default', icon: FileCheck },
  CERRADA: { label: 'Cerrada', variant: 'secondary', icon: CheckCircle2 },
};

export function ListaAuditorias({ userId }: ListaAuditoriasProps) {
  const router = useRouter();
  const [auditorias, setAuditorias] = useState<Auditoria[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAuditorias = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: auditoriasError } = await supabase
        .from('auditorias')
        .select(`
          *,
          activity:audit_activities!inner(
            id,
            activity_number,
            activity_description,
            start_date,
            end_date,
            priority
          )
        `)
        .eq('auditor_responsable_id', userId)
        .order('creada_at', { ascending: false });

      if (auditoriasError) throw auditoriasError;

      setAuditorias(data || []);
    } catch (err) {
      console.error('Error cargando auditorías:', err);
      setError('Error al cargar auditorías');
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
          No has creado ninguna auditoría aún.
        </p>
        <p className="text-xs text-muted-foreground mt-2">
          Crea una auditoría desde una actividad asignada
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Mis Auditorías</h3>
        <Badge variant="secondary">{auditorias.length} auditoría{auditorias.length !== 1 ? 's' : ''}</Badge>
      </div>

      <div className="grid gap-4">
        {auditorias.map((auditoria) => {
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
              className="rounded-lg border bg-card p-6 transition-all hover:shadow-md cursor-pointer"
              onClick={() => router.push(`/auditorias/${auditoria.id}`)}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-3">
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

                <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

