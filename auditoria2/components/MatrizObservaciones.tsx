'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader } from '@/components/ui/loader';
import { 
  Plus, 
  Edit, 
  Eye, 
  FileText,
  AlertCircle,
  CheckCircle2,
  Clock,
  X,
  MessageSquare,
  Download,
  TrendingUp
} from 'lucide-react';
import type { AuditoriaObservacion } from '@/types/auditorias';
import { formatearFecha } from '@/utils/auditoriaHelpers';
import { SolicitarCorreccionObservacion } from './SolicitarCorreccionObservacion';
import { ReporteAvanceMensual } from './ReporteAvanceMensual';

interface MatrizObservacionesProps {
  auditoriaId: string;
  onObservacionSelect?: (observacion: AuditoriaObservacion) => void;
  onObservacionEdit?: (observacion: AuditoriaObservacion) => void;
  readOnly?: boolean;
  currentUserId?: string;
  userRole?: string;
}

const estadoConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: any }> = {
  NO_INICIADA: { label: 'No Iniciada', variant: 'outline', icon: Clock },
  EN_PROCESO: { label: 'En Proceso', variant: 'secondary', icon: AlertCircle },
  EN_VALIDACION: { label: 'En Validación', variant: 'secondary', icon: AlertCircle },
  COMPLETADA: { label: 'Completada', variant: 'default', icon: CheckCircle2 },
  REABIERTA: { label: 'Reabierta', variant: 'destructive', icon: AlertCircle },
  REPROGRAMADA: { label: 'Reprogramada (1ra)', variant: 'outline', icon: Clock },
  REPROGRAMADA_2DA: { label: 'Reprogramada (2da)', variant: 'outline', icon: Clock },
  CUMPLIDA_CON_REPROGRAMACION: { label: 'Cumplida con Reprogramación', variant: 'default', icon: CheckCircle2 },
  REPROGRAMADA_VENCIDA: { label: 'Reprogramada - Vencida', variant: 'destructive', icon: X },
  VENCIDA: { label: 'Vencida', variant: 'destructive', icon: X },
  CANCELADA: { label: 'Cancelada', variant: 'outline', icon: X },
};

export function MatrizObservaciones({
  auditoriaId,
  onObservacionSelect,
  onObservacionEdit,
  readOnly = false,
  currentUserId,
  userRole,
}: MatrizObservacionesProps) {
  const [observaciones, setObservaciones] = useState<AuditoriaObservacion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [observacionSolicitarCorreccion, setObservacionSolicitarCorreccion] = useState<AuditoriaObservacion | null>(null);
  const [observacionReporteAvance, setObservacionReporteAvance] = useState<AuditoriaObservacion | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    loadObservaciones();
  }, [auditoriaId]);

  const loadObservaciones = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from('auditoria_observaciones')
        .select('*')
        .eq('auditoria_id', auditoriaId)
        .order('numero_observacion', { ascending: true });

      if (fetchError) throw fetchError;

      // Cargar datos de usuarios relacionados
      if (data && data.length > 0) {
        const userIds = [
          ...new Set([
            ...data.map(o => o.auditor_id),
            ...data.map(o => o.responsable_estrategia).filter(Boolean),
            ...data.map(o => o.responsable_implementacion).filter(Boolean),
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
          responsable_implementacion_user: obs.responsable_implementacion ? usersMap.get(obs.responsable_implementacion) : undefined,
        }));

        setObservaciones(observacionesCompletas);
      } else {
        setObservaciones([]);
      }
    } catch (err) {
      console.error('Error cargando observaciones:', err);
      setError('Error al cargar las observaciones');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportarExcel = async () => {
    setIsExporting(true);
    try {
      const response = await fetch(`/api/exportar-matriz-excel?auditoria_id=${auditoriaId}`);
      if (!response.ok) throw new Error('Error al exportar');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `matriz-observaciones-${auditoriaId}-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error exportando Excel:', error);
      alert('Error al exportar matriz a Excel');
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader variant="cube" size={32}>
          <span className="text-sm text-muted-foreground mt-2">Cargando observaciones...</span>
        </Loader>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
        <p className="text-sm text-destructive">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Matriz de Observaciones</h3>
          <p className="text-sm text-muted-foreground">
            {observaciones.length} observación{observaciones.length !== 1 ? 'es' : ''} registrada{observaciones.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {observaciones.length > 0 && (
            <Button
              onClick={handleExportarExcel}
              disabled={isExporting}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              {isExporting ? (
                <>
                  <Loader variant="cube" size={14} />
                  Exportando...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  Exportar Excel
                </>
              )}
            </Button>
          )}
          {!readOnly && (
            <Button
              onClick={() => onObservacionEdit?.(null as any)}
              className="gap-2"
              size="sm"
            >
              <Plus className="h-4 w-4" />
              Nueva Observación
            </Button>
          )}
        </div>
      </div>

      {observaciones.length === 0 ? (
        <div className="rounded-lg border bg-card p-8 text-center">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">
            No hay observaciones registradas aún
          </p>
          {!readOnly && (
            <Button
              onClick={() => onObservacionEdit?.(null as any)}
              className="mt-4 gap-2"
              variant="outline"
            >
              <Plus className="h-4 w-4" />
              Crear Primera Observación
            </Button>
          )}
        </div>
      ) : (
        <div className="rounded-lg border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">#</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Título</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Responsable</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Fechas</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Estado</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Avance</th>
                  {!readOnly && (
                    <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Acciones</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y">
                {observaciones.map((observacion) => {
                  const estado = estadoConfig[observacion.estado_observacion] || estadoConfig.NO_INICIADA;
                  const EstadoIcon = estado.icon;

                  return (
                    <tr key={observacion.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3 text-sm font-medium">
                        {observacion.numero_observacion}
                      </td>
                      <td className="px-4 py-3">
                        <div className="max-w-md">
                          <p className="text-sm font-medium">{observacion.titulo_observacion}</p>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {observacion.descripcion_observacion}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {observacion.responsable_implementacion_user ? (
                          <div>
                            <p className="font-medium">
                              {observacion.responsable_implementacion_user.full_name || 
                               observacion.responsable_implementacion_user.email}
                            </p>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Sin asignar</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="space-y-1">
                          {observacion.fecha_inicio && (
                            <p className="text-xs">
                              Inicio: {formatearFecha(observacion.fecha_inicio)}
                            </p>
                          )}
                          {observacion.fecha_fin && (
                            <p className="text-xs">
                              Fin: {formatearFecha(observacion.fecha_fin)}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={estado.variant}>
                          <EstadoIcon className="h-3 w-3 mr-1" />
                          {estado.label}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-muted rounded-full h-2">
                            <div
                              className="bg-primary h-2 rounded-full transition-all"
                              style={{ width: `${observacion.porcentaje_avance}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {observacion.porcentaje_avance}%
                          </span>
                        </div>
                      </td>
                      {!readOnly && (
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onObservacionSelect?.(observacion)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {(userRole === 'auditor' || userRole === 'auditor_interno') && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onObservacionEdit?.(observacion)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            )}
                            {userRole === 'auditado' && observacion.responsable_implementacion === currentUserId && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setObservacionReporteAvance(observacion)}
                                  title="Reportar avance mensual"
                                >
                                  <TrendingUp className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setObservacionSolicitarCorreccion(observacion)}
                                  title="Solicitar corrección o modificación al auditor"
                                >
                                  <MessageSquare className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal para solicitar corrección */}
      {observacionSolicitarCorreccion && currentUserId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <SolicitarCorreccionObservacion
              observacion={observacionSolicitarCorreccion}
              auditoriaId={auditoriaId}
              currentUserId={currentUserId}
              onSuccess={() => {
                setObservacionSolicitarCorreccion(null);
                loadObservaciones();
              }}
              onCancel={() => setObservacionSolicitarCorreccion(null)}
            />
          </div>
        </div>
      )}

      {/* Modal para reporte de avance mensual */}
      {observacionReporteAvance && currentUserId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <ReporteAvanceMensual
              observacion={observacionReporteAvance}
              auditoriaId={auditoriaId}
              currentUserId={currentUserId}
              onSuccess={() => {
                setObservacionReporteAvance(null);
                loadObservaciones();
              }}
              onCancel={() => setObservacionReporteAvance(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

