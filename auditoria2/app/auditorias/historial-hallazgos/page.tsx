'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/utils/supabase';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader } from '@/components/ui/loader';
import { AlertCircle, FileText, Calendar, User, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { formatearFecha } from '@/utils/auditoriaHelpers';
import type { AuditoriaObservacion } from '@/types/auditorias';

const estadoConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  NO_INICIADA: { label: 'No Iniciada', variant: 'outline' },
  EN_PROCESO: { label: 'En Proceso', variant: 'secondary' },
  EN_VALIDACION: { label: 'En Validación', variant: 'secondary' },
  COMPLETADA: { label: 'Completada', variant: 'default' },
  REABIERTA: { label: 'Reabierta', variant: 'destructive' },
  REPROGRAMADA: { label: 'Reprogramada (1ra)', variant: 'outline' },
  REPROGRAMADA_2DA: { label: 'Reprogramada (2da)', variant: 'outline' },
  CUMPLIDA_CON_REPROGRAMACION: { label: 'Cumplida con Reprogramación', variant: 'default' },
  REPROGRAMADA_VENCIDA: { label: 'Reprogramada - Vencida', variant: 'destructive' },
  VENCIDA: { label: 'Vencida', variant: 'destructive' },
  CANCELADA: { label: 'Cancelada', variant: 'outline' },
};

export default function HistorialHallazgosPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [observaciones, setObservaciones] = useState<AuditoriaObservacion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtroEstado, setFiltroEstado] = useState<string>('TODAS');

  const getErrorMessage = (err: unknown) => {
    if (err instanceof Error) return err.message;
    if (typeof err === 'object' && err !== null && 'message' in err) {
      const message = (err as { message?: unknown }).message;
      if (typeof message === 'string') return message;
    }
    return 'Error desconocido';
  };

  useEffect(() => {
    if (user) {
      loadObservaciones();
    }
  }, [user, filtroEstado]);

  const loadObservaciones = async () => {
    if (!user) return;

    setIsLoading(true);
    setError(null);

    try {
      // Cargar todas las observaciones donde el usuario es responsable de implementación
      let query = supabase
        .from('auditoria_observaciones')
        .select(`
          *,
          auditoria:auditorias!auditoria_observaciones_auditoria_id_fkey (
            id,
            estado,
            fecha_inicio,
            fecha_fin
          )
        `)
        .eq('responsable_implementacion', user.id)
        .order('created_at', { ascending: false });

      // Aplicar filtro de estado si no es "TODAS"
      if (filtroEstado !== 'TODAS') {
        query = query.eq('estado_observacion', filtroEstado);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      // Cargar datos adicionales de usuarios
      if (data && data.length > 0) {
        const userIds = [
          ...new Set([
            ...data.map(o => o.auditor_id),
            ...data.map(o => o.responsable_estrategia).filter(Boolean),
          ])
        ];

        const { data: usersData } = await supabase
          .from('users')
          .select('id, full_name, email')
          .in('id', userIds);

        const usersMap = new Map(usersData?.map(u => [u.id, u]) || []);

        const observacionesCompletas = data.map(obs => ({
          ...obs,
          auditor: usersMap.get(obs.auditor_id),
          responsable_estrategia_user: obs.responsable_estrategia ? usersMap.get(obs.responsable_estrategia) : undefined,
        }));

        setObservaciones(observacionesCompletas);
      } else {
        setObservaciones([]);
      }
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      console.error('Error cargando observaciones:', { errorMessage, err });
      setError(`Error al cargar el historial de hallazgos: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <AlertCircle className="h-12 w-12 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Debes iniciar sesión para acceder a tu historial de hallazgos.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Historial de Hallazgos</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Todas las observaciones donde eres responsable de implementación
            </p>
          </div>
        </div>
      </div>

      {/* Filtro de estado */}
      <div className="flex items-center gap-4">
        <label className="text-sm font-medium">Filtrar por estado:</label>
        <select
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="TODAS">Todas</option>
          {Object.keys(estadoConfig).map(estado => (
            <option key={estado} value={estado}>{estadoConfig[estado].label}</option>
          ))}
        </select>
        <Badge variant="outline">
          {observaciones.length} observación{observaciones.length !== 1 ? 'es' : ''}
        </Badge>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader variant="cube" size={32}>
            <span className="text-sm text-muted-foreground mt-2">Cargando historial...</span>
          </Loader>
        </div>
      ) : error ? (
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        </div>
      ) : observaciones.length === 0 ? (
        <div className="rounded-lg border bg-card p-8 text-center">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">
            {filtroEstado === 'TODAS' 
              ? 'No tienes observaciones asignadas como responsable de implementación'
              : `No tienes observaciones con estado "${estadoConfig[filtroEstado]?.label || filtroEstado}"`
            }
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {observaciones.map((observacion) => {
            const estado = estadoConfig[observacion.estado_observacion] || estadoConfig.NO_INICIADA;
            const auditoria = observacion.auditoria as any;

            return (
              <div key={observacion.id} className="rounded-lg border bg-card p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge variant="outline">
                        #{observacion.numero_observacion}
                      </Badge>
                      <Badge variant={estado.variant}>
                        {estado.label}
                      </Badge>
                      {observacion.numero_informe && (
                        <Badge variant="secondary">
                          Informe: {observacion.numero_informe}
                        </Badge>
                      )}
                    </div>
                    <h3 className="text-lg font-semibold mb-2">
                      {observacion.titulo_observacion}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {observacion.descripcion_observacion}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/auditorias/${observacion.auditoria_id}`)}
                  >
                    Ver Auditoría
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                  <div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <User className="h-4 w-4" />
                      <span>Auditor:</span>
                    </div>
                    <p className="text-sm font-medium">
                      {observacion.auditor?.full_name || observacion.auditor?.email || 'No asignado'}
                    </p>
                  </div>

                  {observacion.fecha_inicio && observacion.fecha_fin && (
                    <div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                        <Calendar className="h-4 w-4" />
                        <span>Fechas de Implementación:</span>
                      </div>
                      <p className="text-sm">
                        <span className="font-medium">Inicio:</span> {formatearFecha(observacion.fecha_inicio)}
                        <br />
                        <span className="font-medium">Fin:</span> {formatearFecha(observacion.fecha_fin)}
                      </p>
                    </div>
                  )}

                  {observacion.recomendacion && (
                    <div className="md:col-span-2">
                      <div className="text-sm text-muted-foreground mb-1">Recomendación:</div>
                      <p className="text-sm">{observacion.recomendacion}</p>
                    </div>
                  )}

                  {observacion.estrategia && (
                    <div className="md:col-span-2">
                      <div className="text-sm text-muted-foreground mb-1">Estrategia:</div>
                      <p className="text-sm">{observacion.estrategia}</p>
                    </div>
                  )}

                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Avance:</div>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-muted rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all"
                          style={{ width: `${observacion.porcentaje_avance}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium">{observacion.porcentaje_avance}%</span>
                    </div>
                  </div>

                  {observacion.fecha_emision_informe && (
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Fecha de Emisión del Informe:</div>
                      <p className="text-sm">{formatearFecha(observacion.fecha_emision_informe)}</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
